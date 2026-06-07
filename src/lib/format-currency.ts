/**
 * 원화 금액을 컴마 없이 한글 단위(억/만/천)로 표기한다.
 *
 * 예:
 *   3,000,000   → "300만원"
 *   1,500,000   → "150만원"
 *   50,000      → "5만원"
 *   12,500      → "1만 2천 500원"
 *   1,234,567   → "123만 4천 567원"
 *   700         → "700원"
 *   0           → "0원"
 *   100,000,000 → "1억원"
 */
export function formatWon(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0원";
  if (n < 0) return "-" + formatWon(-n);
  if (n < 1000) return `${n}원`;

  let rem = Math.floor(n);
  const eok = Math.floor(rem / 100_000_000);
  rem = rem % 100_000_000;
  const man = Math.floor(rem / 10_000);
  rem = rem % 10_000;
  const cheon = Math.floor(rem / 1_000);
  const ones = rem % 1_000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (cheon > 0) parts.push(`${cheon}천`);
  if (ones > 0) parts.push(`${ones}`);

  return parts.join(" ") + "원";
}

/**
 * 가장 큰 단위 1개로만 축약 표기 (작은 배지/칩용).
 * 만 단위 미만은 천 단위, 천 미만은 원으로.
 *
 * 예:
 *   50,000    → "5만원"
 *   3,000,000 → "300만원"
 *   7,000     → "7천원"
 *   500       → "500원"
 */
export function formatWonCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0원";
  if (n < 0) return "-" + formatWonCompact(-n);
  if (n >= 100_000_000) return `${Math.round(n / 100_000_000)}억원`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}천원`;
  return `${Math.floor(n)}원`;
}
