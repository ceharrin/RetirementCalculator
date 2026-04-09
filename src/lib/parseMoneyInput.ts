/**
 * Parse pasted or typed currency strings into whole dollars (rounded).
 * Supports:
 * - US: commas as thousands, period as decimals — `$32,592.00`, `32,592`
 * - European: periods as thousands, comma as decimals — `32.592,00` (when unambiguous)
 * - Plain digits
 */
export function parseMoneyInputToDollars(raw: string): number {
  const t = raw
    .trim()
    .replace(/[$€£¥]/g, '')
    .replace(/\u00A0/g, '')
    .replace(/\s/g, '')
  if (!t) return 0

  const lastDot = t.lastIndexOf('.')
  const lastComma = t.lastIndexOf(',')
  const hasDot = lastDot >= 0
  const hasComma = lastComma >= 0

  /** Comma is decimal separator (e.g. `1.234,56` or `1234,56`), not thousands. */
  let europeanDecimal = false
  if (hasDot && hasComma && lastComma > lastDot) {
    europeanDecimal = true
  } else if (!hasDot && hasComma) {
    const afterComma = t.slice(lastComma + 1).replace(/\D/g, '')
    if (afterComma.length === 1 || afterComma.length === 2) {
      europeanDecimal = true
    }
  }

  let intPart: string
  let fracPart = ''

  if (europeanDecimal) {
    intPart = t.slice(0, lastComma).replace(/\./g, '')
    fracPart = t.slice(lastComma + 1)
  } else if (hasDot) {
    intPart = t.slice(0, lastDot).replace(/,/g, '')
    fracPart = t.slice(lastDot + 1)
  } else {
    intPart = t.replace(/,/g, '')
    fracPart = ''
  }

  const intDigits = intPart.replace(/\D/g, '')
  const fracDigitsOnly = fracPart.replace(/\D/g, '')
  const intVal = intDigits === '' ? 0 : parseInt(intDigits, 10)
  if (!Number.isFinite(intVal)) return 0

  const fracVal = parseInt((fracDigitsOnly + '00').slice(0, 2), 10)
  if (!Number.isFinite(fracVal)) return intVal

  const combined = intVal + fracVal / 100
  return Number.isFinite(combined) ? Math.round(combined) : 0
}
