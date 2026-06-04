/**
 * SSA benefit adjustment factors relative to FRA = 67.
 * Early: -5/9% per month for first 36 months, -5/12% per month beyond.
 * Delayed: +8% per year (2/3% per month).
 */
const ADJUSTMENT_FACTOR: Record<number, number> = {
  62: 0.700,
  63: 0.750,
  64: 0.800,
  65: 0.8667,
  66: 0.9333,
  67: 1.000,
  68: 1.080,
  69: 1.160,
  70: 1.240,
}

export const SS_COMPARISON_CLAIM_AGES = [62, 67, 70] as const
export type SsComparisonClaimAge = (typeof SS_COMPARISON_CLAIM_AGES)[number]

export interface SsClaimScenario {
  claimAge: SsComparisonClaimAge
  /** Annual benefit at this claim age (adjusted from FRA amount). */
  annualBenefitAtClaim: number
  /** Cumulative SS received by the end of each retiree age (age → cumulative total). */
  cumulativeByAge: Map<number, number>
  /** Total lifetime SS if lived to deathAge. */
  lifetimeTotal: number
}

/**
 * Computes SS cumulative totals for claim ages 62, 67, and 70.
 *
 * @param fraAnnualBenefit The annual benefit at FRA (age 67). The form's entered benefit is
 *   treated as this amount regardless of the chosen claim age in the main projection.
 * @param currentAge Retiree's current age (start of chart x-axis).
 * @param deathAge Retiree's modeled death age (end of chart x-axis).
 * @param colaRate Annual COLA as decimal (e.g. 0.026).
 */
export function ssClaimComparison(
  fraAnnualBenefit: number,
  currentAge: number,
  deathAge: number,
  colaRate: number,
): SsClaimScenario[] {
  return SS_COMPARISON_CLAIM_AGES.map((claimAge) => {
    const factor = ADJUSTMENT_FACTOR[claimAge]
    const annualBenefitAtClaim = fraAnnualBenefit * factor

    const cumulativeByAge = new Map<number, number>()
    let cumulative = 0

    for (let age = currentAge; age < deathAge; age++) {
      if (age >= claimAge) {
        const yearsSinceClaim = age - claimAge
        cumulative += annualBenefitAtClaim * (1 + colaRate) ** yearsSinceClaim
      }
      cumulativeByAge.set(age + 1, cumulative)
    }

    return {
      claimAge,
      annualBenefitAtClaim,
      cumulativeByAge,
      lifetimeTotal: cumulative,
    }
  })
}

/**
 * Returns the first age at which scenario B's cumulative total overtakes scenario A's.
 * Returns null if B never overtakes A within the modeled horizon.
 */
export function breakEvenAge(
  scenarioA: SsClaimScenario,
  scenarioB: SsClaimScenario,
  deathAge: number,
): number | null {
  for (const [age, cumB] of scenarioB.cumulativeByAge) {
    if (age > deathAge) break
    if (cumB <= 0) continue  // B hasn't started receiving benefits yet
    const cumA = scenarioA.cumulativeByAge.get(age) ?? 0
    if (cumB >= cumA) return age
  }
  return null
}
