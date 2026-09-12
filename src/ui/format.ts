export function inr(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/** Compact form for big numbers: ₹8.0L, ₹1.2Cr */
export function inrCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_00_00_000) return '₹' + (n / 1_00_00_000).toFixed(2).replace(/\.00$/, '') + 'Cr'
  if (abs >= 1_00_000) return '₹' + (n / 1_00_000).toFixed(2).replace(/\.00$/, '') + 'L'
  return inr(n)
}

export function pct(n: number, digits = 1): string {
  return n.toFixed(digits) + '%'
}
