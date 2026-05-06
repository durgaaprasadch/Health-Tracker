/** Format large numbers: 1234567 → "1.23M" */
export const fmt = (n) => {
  if (n == null || isNaN(n)) return 'N/A'
  const v = Number(n)
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(Math.round(v))
}

/** Full locale string: 1234567 → "1,234,567" */
export const fmtFull = (n) =>
  n == null ? 'N/A' : Number(n).toLocaleString()

/** Case fatality rate */
export const cfr = (deaths, cases) =>
  cases ? ((deaths / cases) * 100).toFixed(2) + '%' : 'N/A'

/** Percentage */
export const pct = (num, den) =>
  den ? ((num / den) * 100).toFixed(1) + '%' : 'N/A'

/** Truncate long strings */
export const trunc = (str, max = 12) =>
  str && str.length > max ? str.slice(0, max - 1) + '…' : str
