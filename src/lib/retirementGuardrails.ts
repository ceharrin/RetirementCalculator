/**
 * Portfolio-linked spending guardrails (Guyton–Klinger style).
 *
 * Compare **current planned withdrawal rate** (withdrawal ÷ portfolio) to the **anchor** rate
 * from the first retirement year. Prosperity: portfolio grew → same-dollar withdrawal is a
 * smaller fraction → optional spending increase. Capital preservation: the opposite.
 *
 * **`simulateRetirement`** applies this when `useSpendingGuardrails` is true: anchor uses
 * balance after return and before withdrawal; one ±10% nominal spending step per year when the
 * rate strays outside ±20% of the anchor. No inflation skip in the current MVP.
 *
 * Illustrative only—not tax, legal, or planning advice.
 */

/** Withdrawal as a decimal fraction of portfolio (e.g. 0.04 = 4%). */
export function withdrawalRate(withdrawal: number, portfolio: number): number {
  if (!Number.isFinite(withdrawal) || !Number.isFinite(portfolio) || portfolio <= 0) {
    return Number.POSITIVE_INFINITY
  }
  return withdrawal / portfolio
}

export type GuardrailDecision = 'increase' | 'decrease' | 'hold'

/**
 * Guyton–Klinger–style band around the **initial** withdrawal rate.
 * @param band — e.g. `0.2` → triggers at ±20% from initial (80% and 120% of initial rate).
 */
export function guardrailDecision(
  currentWithdrawalRate: number,
  initialWithdrawalRate: number,
  band: number,
): GuardrailDecision {
  if (
    !Number.isFinite(currentWithdrawalRate) ||
    !Number.isFinite(initialWithdrawalRate) ||
    initialWithdrawalRate <= 0 ||
    band < 0 ||
    band >= 1
  ) {
    return 'hold'
  }
  const lowerTrigger = initialWithdrawalRate * (1 - band)
  const upperTrigger = initialWithdrawalRate * (1 + band)
  if (currentWithdrawalRate <= lowerTrigger) return 'increase'
  if (currentWithdrawalRate >= upperTrigger) return 'decrease'
  return 'hold'
}

/** Default band cited in many Guyton–Klinger summaries (20%). */
export const DEFAULT_GUARDRAIL_BAND = 0.2

/** Default spending adjustment cited in many summaries (±10%). */
export const DEFAULT_GUARDRAIL_SPENDING_STEP = 0.1

export function adjustSpendingForDecision(
  annualExpense: number,
  decision: GuardrailDecision,
  stepPercent: number,
): number {
  if (!Number.isFinite(annualExpense) || annualExpense < 0) return 0
  if (decision === 'hold') return annualExpense
  const step = Math.min(0.95, Math.max(0, stepPercent))
  if (decision === 'increase') return annualExpense * (1 + step)
  return annualExpense * (1 - step)
}
