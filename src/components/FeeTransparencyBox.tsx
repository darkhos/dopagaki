import { CheckCircle2, CircleAlert, ShieldCheck } from 'lucide-react';
import type { Lang } from '@/types.ts';

interface FeeTransparencyBoxProps {
  includeVat: boolean;
  lang: Lang;
  compact?: boolean;
}

export function FeeTransparencyBox({
  includeVat,
  lang,
  compact = false
}: FeeTransparencyBoxProps) {
  const isJa = lang === 'ja';

  const rows = [
    {
      id: 'vat',
      label: isJa ? '消費税 10% (VAT)' : '부가세 10% (VAT)',
      badge: includeVat
        ? isJa
          ? '込み'
          : '포함 완료'
        : isJa
          ? '別途 (+10%)'
          : '별도 (+10%)',
      tone: includeVat ? ('ok' as const) : ('warn' as const),
      note: includeVat
        ? isJa
          ? 'ドパガキ表示額に10%反映済み'
          : '도파가키 표시 금액에 포함 완료'
        : isJa
          ? '現地決済時に10%加算されます'
          : '현장 결제 시 부가세 10%가 추가돼요'
    },
    {
      id: 'anesthesia',
      label: isJa ? '麻酔クリーム・睡眠麻酔' : '마취크림 · 수면마취비',
      badge: isJa ? '別途あり' : '별도 가능',
      tone: 'warn' as const,
      note: isJa
        ? '病院により別途発生（目安1〜10万ウォン）→ 施術前に確認'
        : '병원별 별도 발생 가능 (보통 1~10만 원) → 시술 전 확인'
    },
    {
      id: 'aftercare',
      label: isJa ? '鎮静ケア・再生クリーム' : '진정관리 · 재생크림',
      badge: isJa ? '任意・断り可' : '선택 · 거절 가능',
      tone: 'neutral' as const,
      note: isJa
        ? '別途オプションの場合あり → 不要なら断ってOK'
        : '별도 발생 가능 → 원치 않으면 거절 가능'
    }
  ];

  return (
    <div
      className={`cp2-fee-box${compact ? ' is-compact' : ''}`}
      role="region"
      aria-label={isJa ? '費用の込み・別途チェック' : '비용 포함 · 별도 투명성 체크'}
    >
      <div className="cp2-fee-head">
        <ShieldCheck size={14} strokeWidth={2.3} />
        <span>
          {isJa
            ? '追加料金チェック（込み・別途）'
            : '현장 추가금 3줄 체크 (포함 · 별도)'}
        </span>
      </div>
      <ul className="cp2-fee-list">
        {rows.map((r) => (
          <li className="cp2-fee-row" key={r.id}>
            <div className="cp2-fee-top">
              <span className="cp2-fee-label">{r.label}</span>
              <span className={`cp2-fee-pill is-${r.tone}`}>
                {r.tone === 'ok' ? (
                  <CheckCircle2 size={11} strokeWidth={2.5} />
                ) : r.tone === 'warn' ? (
                  <CircleAlert size={11} strokeWidth={2.4} />
                ) : null}
                <span>{r.badge}</span>
              </span>
            </div>
            <p className="cp2-fee-note">{r.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
