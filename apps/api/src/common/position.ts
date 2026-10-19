// Fractional indexing: vị trí là chuỗi so sánh theo thứ tự từ điển.
// Chèn giữa 2 thẻ chỉ cần sinh 1 chuỗi mới → kéo thả chỉ cập nhật 1 document.
// Thuật toán midpoint (cùng ý tưởng thư viện fractional-indexing), tự viết để tránh gói ESM-only.

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function midpoint(a: string, b: string | null): string {
  if (b !== null) {
    // Bỏ phần tiền tố chung
    let n = 0;
    while ((a[n] ?? '0') === b[n]) n++;
    if (n > 0) return b.slice(0, n) + midpoint(a.slice(n), b.slice(n));
  }
  const digitA = a ? DIGITS.indexOf(a[0]) : 0;
  const digitB = b !== null ? DIGITS.indexOf(b[0]) : DIGITS.length;
  if (digitB - digitA > 1) {
    return DIGITS[Math.round((digitA + digitB) / 2)];
  }
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[digitA] + midpoint(a.slice(1), null);
}

/**
 * Sinh vị trí nằm giữa `before` (thẻ phía trên) và `after` (thẻ phía dưới).
 * null = đầu/cuối danh sách.
 */
export function positionBetween(before: string | null, after: string | null): string {
  if (before !== null && after !== null && before >= after) {
    throw new Error(`positionBetween: ${before} >= ${after}`);
  }
  return midpoint(before ?? '', after);
}
