/**
 * Sketch: portfolio-linked spending guardrails (Guyton–Klinger style).
 *
 * Idea: compare **current withdrawal rate** (portfolio withdrawal ÷ portfolio) to the
 * **initial** rate from the first retirement year. If the portfolio has grown so much that
 * the same dollar withdrawal is a much **smaller** fraction of the portfolio, raise spending
 * (prosperity guardrail). If the portfolio has shrunk so withdrawals are a **larger**
 * fraction, cut spending (capital preservation guardrail).
 *
 * This module only holds **policy + pure math**. Wiring into `simulateRetirement` would:
 * 1. Track `initialWithdrawalRate` set once in the first in-retirement year (define whether
 *    the denominator is balance after return, before withdrawal, etc.—pick one and stay
 *    consistent).
 * 2. Each retirement year, after you know nominal spending need (inflation, decline, survivor
 *    rules) and Social Security, compute `withdrawal = max(0, expense - ss)`.
 * 3. Use balance **after** return and **before** withdrawal as portfolio for the rate check
 *    (common choice); recompute withdrawal if guardrail changes spending in that year.
 * 4. Optionally: Guyton-style **inflation skip**—omit the annual inflation bump on spending when
 *    the prior year’s portfolio return was negative (add prior-year return to loop state).
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
