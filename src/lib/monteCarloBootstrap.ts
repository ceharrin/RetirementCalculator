import { HISTORICAL_RETURN_INFLATION_PAIRS } from './historicalSeries'
import {
  computeSimulationHorizon,
  simulateRetirementWithAnnualRates,
  type AnnualMarketRates,
  type SimulationInput,
} from './simulateRetirement'

/** Deterministic PRNG in [0, 1); same seed yields same stream. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Linear interpolation on sorted ascending samples; `p` in [0, 1]. */
export function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length
  if (n === 0) return Number.NaN
  if (n === 1) return sortedAsc[0]!
  const clamped = Math.min(1, Math.max(0, p))
  const pos = (n - 1) * clamped
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sortedAsc[lo]!
  return sortedAsc[lo]! + (sortedAsc[hi]! - sortedAsc[lo]!) * (pos - lo)
}

function drawAnnualRates(horizonYears: number, rng: () => number): AnnualMarketRates[] {
  const pool = HISTORICAL_RETURN_INFLATION_PAIRS
  const out: AnnualMarketRates[] = []
  for (let i = 0; i < horizonYears; i++) {
    const idx = Math.floor(rng() * pool.length)
    const row = pool[idx]!
    out.push({
      portfolioReturn: row.portfolioReturn,
      inflationRate: row.inflationRate,
    })
  }
  return out
}

export interface MonteCarloYearSummary {
  calendarYear: number
  retireeAge: number
  spouseAge: number | null
  retireeAlive: boolean
  spouseAlive: boolean
  inRetirementPhase: boolean
  socialSecurity: number
  endBalanceP10: number
  endBalanceP50: number
  endBalanceP90: number
  withdrawalP10: number
  withdrawalP50: number
  withdrawalP90: number
  expenseP10: number
  expenseP50: number
  expenseP90: number
  /** Fraction of trials with a shortfall in this calendar year. */
  shortfallFraction: number
}

export interface MonteCarloResult {
  trialCount: number
  seedUsed: number
  useSpendingGuardrails: boolean
  retirementStartYear: number | null
  /** Share of trials where at least one year had a portfolio shortfall. */
  everShortfallFraction: number
  finalEndBalanceP10: number
  finalEndBalanceP50: number
  finalEndBalanceP90: number
  rows: MonteCarloYearSummary[]
}

/**
 * Illustrative 0–100 score from shortfall frequency and final-year balance tail (p10).
 * For UI only—not a statistical confidence interval.
 */
export function monteCarloOutlookScore(result: MonteCarloResult): number {
  let score = (1 - result.everShortfallFraction) * 100
  if (result.finalEndBalanceP10 < 0) {
    score -= 22
  } else if (
    result.finalEndBalanceP50 > 0 &&
    result.finalEndBalanceP10 < result.finalEndBalanceP50 * 0.15
  ) {
    score -= 10
  }
  if (result.finalEndBalanceP50 <= 0) {
    score -= 28
  }
  return Math.round(Math.min(100, Math.max(0, score)))
}

export function runMonteCarloBootstrap(
  input: SimulationInput,
  options: { trialCount: number; seed?: number },
): MonteCarloResult {
  const trialCount = options.trialCount
  const seedUsed =
    options.seed !== undefined
      ? options.seed >>> 0
      : ((Date.now() & 0xffffffff) ^
          (typeof performance !== 'undefined'
            ? Math.floor(performance.now() * 1_000_000) & 0xffffffff
            : 0x9e3779b9)) >>>
        0
  const rng = createRng(seedUsed)

  const { endYear, retirementStartYear } = computeSimulationHorizon(input)
  const horizonYears = endYear - input.startYear + 1

  const balanceSamples: number[][] = Array.from({ length: horizonYears }, () => [])
  const withdrawalSamples: number[][] = Array.from({ length: horizonYears }, () => [])
  const expenseSamples: number[][] = Array.from({ length: horizonYears }, () => [])
  const shortfallCount = Array.from({ length: horizonYears }, () => 0)
  let trialsWithAnyShortfall = 0

  let skeleton: ReturnType<typeof simulateRetirementWithAnnualRates>['rows'] | null = null

  for (let t = 0; t < trialCount; t++) {
    const rates = drawAnnualRates(horizonYears, rng)
    const sim = simulateRetirementWithAnnualRates(input, rates)
    if (!skeleton) skeleton = sim.rows

    let anyShort = false
    for (let i = 0; i < horizonYears; i++) {
      const row = sim.rows[i]!
      balanceSamples[i]!.push(row.endPortfolioBalance)
      withdrawalSamples[i]!.push(row.portfolioWithdrawal)
      expenseSamples[i]!.push(row.annualExpense)
      if (row.shortfall) {
        shortfallCount[i]!++
        anyShort = true
      }
    }
    if (anyShort) trialsWithAnyShortfall++
  }

  const sk = skeleton!
  const rows: MonteCarloYearSummary[] = sk.map((sr, i) => {
    const bal = [...balanceSamples[i]!].sort((a, b) => a - b)
    const w = [...withdrawalSamples[i]!].sort((a, b) => a - b)
    const e = [...expenseSamples[i]!].sort((a, b) => a - b)
    return {
      calendarYear: sr.calendarYear,
      retireeAge: sr.retireeAge,
      spouseAge: sr.spouseAge,
      retireeAlive: sr.retireeAlive,
      spouseAlive: sr.spouseAlive,
      inRetirementPhase: sr.inRetirementPhase,
      socialSecurity: sr.socialSecurity,
      endBalanceP10: percentile(bal, 0.1),
      endBalanceP50: percentile(bal, 0.5),
      endBalanceP90: percentile(bal, 0.9),
      withdrawalP10: percentile(w, 0.1),
      withdrawalP50: percentile(w, 0.5),
      withdrawalP90: percentile(w, 0.9),
      expenseP10: percentile(e, 0.1),
      expenseP50: percentile(e, 0.5),
      expenseP90: percentile(e, 0.9),
      shortfallFraction: shortfallCount[i]! / trialCount,
    }
  })

  const fi = horizonYears - 1
  const finalBal = [...balanceSamples[fi]!].sort((a, b) => a - b)

  return {
    trialCount,
    seedUsed,
    useSpendingGuardrails: input.useSpendingGuardrails,
    retirementStartYear,
    everShortfallFraction: trialsWithAnyShortfall / trialCount,
    finalEndBalanceP10: percentile(finalBal, 0.1),
    finalEndBalanceP50: percentile(finalBal, 0.5),
    finalEndBalanceP90: percentile(finalBal, 0.9),
    rows,
  }
}
