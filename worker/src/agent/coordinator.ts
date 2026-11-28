import { DurableObject } from 'cloudflare:workers';
import type { QuotaCheckParams, QuotaCheckResult } from './service.ts';

const ONE_MINUTE_MS = 60_000;
const THREAD_TTL_MS = 24 * 60 * 60 * 1000;
const QUOTA_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * SQLite-backed Durable Object providing strictly atomic rate limiting (global + per-user + per-IP daily
 * & per-IP 1-minute sliding burst window) and strongly consistent per-thread state persistence.
 *
 * Sharding strategy (no global bottleneck):
 * - Daily quota instance: `COORDINATOR.getByName('quota:' + YYYY-MM-DD)`
 * - Thread state instance: `COORDINATOR.getByName('thread:' + userId + ':' + threadId)`
 */
export class AgentCoordinator extends DurableObject {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS daily_counters (
          bucket TEXT PRIMARY KEY,
          count INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ip_burst (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip_hash TEXT NOT NULL,
          ts INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ip_burst_lookup ON ip_burst (ip_hash, ts);
        CREATE TABLE IF NOT EXISTS thread_store (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    });
  }

  async consumeQuota(params: QuotaCheckParams): Promise<QuotaCheckResult> {
    const now = Date.now();
    const cutoff = now - ONE_MINUTE_MS;
    const sql = this.ctx.storage.sql;

    // 1. Prune expired burst samples and check per-IP 1-minute sliding window first
    sql.exec('DELETE FROM ip_burst WHERE ts <= ?', cutoff);
    if (params.ipHash && params.ipBurstLimit > 0) {
      const burstRow = sql
        .exec<{ cnt: number; oldest: number | null }>(
          'SELECT COUNT(*) AS cnt, MIN(ts) AS oldest FROM ip_burst WHERE ip_hash = ?',
          params.ipHash
        )
        .one();
      if (burstRow.cnt >= params.ipBurstLimit) {
        const oldest = burstRow.oldest ?? now;
        const retryAfterSec = Math.max(5, Math.ceil((oldest + ONE_MINUTE_MS - now) / 1000));
        return { allowed: false, reason: 'rate_limit', retryAfterSec };
      }
    }

    // 2. Check global, user, and per-IP daily limits synchronously inside the single-threaded DO
    const readCount = (bucket: string): number => {
      const rows = sql
        .exec<{ count: number }>('SELECT count FROM daily_counters WHERE bucket = ?', bucket)
        .toArray();
      return rows.length > 0 ? rows[0].count : 0;
    };

    const totalUsed = readCount('global');
    const userUsed = readCount(`user:${params.userId}`);
    const ipUsed = params.ipHash ? readCount(`ip:${params.ipHash}`) : 0;

    if (
      totalUsed >= params.totalLimit ||
      userUsed >= params.userLimit ||
      (params.ipHash && params.ipDailyLimit > 0 && ipUsed >= params.ipDailyLimit)
    ) {
      return { allowed: false, reason: 'daily_limit' };
    }

    // 3. Atomically increment counters + record IP burst timestamp (no await between SQL writes!)
    const bump = (bucket: string) => {
      sql.exec(
        'INSERT INTO daily_counters (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1',
        bucket
      );
    };
    bump('global');
    bump(`user:${params.userId}`);
    if (params.ipHash) {
      bump(`ip:${params.ipHash}`);
      sql.exec('INSERT INTO ip_burst (ip_hash, ts) VALUES (?, ?)', params.ipHash, now);
    }

    await this.ctx.storage.setAlarm(now + QUOTA_TTL_MS);
    return { allowed: true };
  }

  async getThread(): Promise<string | null> {
    const rows = this.ctx.storage.sql
      .exec<{ payload: string; updated_at: number }>(
        'SELECT payload, updated_at FROM thread_store WHERE id = 1'
      )
      .toArray();
    if (rows.length === 0) return null;
    if (Date.now() - rows[0].updated_at > THREAD_TTL_MS) {
      this.ctx.storage.sql.exec('DELETE FROM thread_store WHERE id = 1');
      return null;
    }
    return rows[0].payload;
  }

  async saveThread(payload: string): Promise<void> {
    const now = Date.now();
    this.ctx.storage.sql.exec(
      'INSERT INTO thread_store (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at',
      payload,
      now
    );
    await this.ctx.storage.setAlarm(now + THREAD_TTL_MS);
  }

  async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
