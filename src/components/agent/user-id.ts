/** 상담 화면이 같이 쓰는 익명 사용자 ID. 서버의 사용자별 하루 한도에 쓰인다. */
export function anonymousId() {
  const key = 'dopagaki.agent.userId';
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(key);
  } catch {
    /* Storage may be disabled. */
  }
  if (saved && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(saved)) return saved;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const id = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  try {
    localStorage.setItem(key, id);
  } catch {
    /* Keep the ID in memory. */
  }
  return id;
}
