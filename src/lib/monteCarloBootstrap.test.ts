import { describe, expect, it } from 'vitest'
import { HISTORICAL_RETURN_INFLATION_PAIRS } from './historicalSeries'
import {
  createRng,
  monteCarloOutlookScore,
  percentile,
  runMonteCarloBootstrap,
} from './monteCarloBootstrap'
import {
  computeSimulationHorizon,
  simulateRetirement,
  simulateRetirementWithAnnualRates,
  type SimulationInput,
} from './simulateRetirement'

function baseInput(over: Partial<SimulationInput> = {}): SimulationInput {
  return {
    startYear: 2026,
    hasSpouse: false,
    retireeCurrentAge: 60,
    spouseCurrentAge: null,
    retireeDeathAge: 90,
    spouseDeathAge: null,
    retireeRetirementAge: 65,
    annualExpenseAtRetirementStart: 50_000,
    inflationRate: 0.03,
    portfolioReturn: 0.05,
    currentSavings: 500_000,
    retireeClaimAge: 67,
    spouseClaimAge: null,
    retireeAnnualSS: 0,
    spouseAnnualSS: null,
    otherAnnualIncome: 0,
    otherIncomeStartAge: 67,
    windfalls: [],
    oneTimeExpenses: [],
    survivorExpensePercent: 75,
    survivorSSMode: 'higherOfTwo',
    customSurvivorAnnualSS: null,
    socialSecurityColaRate: 0,
    modelSsBenefitCutFrom2032: false,
    useSpendingGuardrails: false,
    spendingDeclineStartAge: 100,
    spendingDeclineAnnualRate: 0,
    projectionCadence: 'annual',
    ...over,
  }
}

describe('percentile', () => {
  it('interpolates linearly on sorted samples', () => {
    const s = [10, 20, 30, 40, 50]
    expect(percentile(s, 0)).toBe(10)
    expect(percentile(s, 1)).toBe(50)
    expect(percentile(s, 0.5)).toBe(30)
  })
})

describe('createRng', () => {
  it('is deterministic for a fixed seed', () => {
    const a = createRng(42_424)
    const b = createRng(42_424)
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b())
    }
  })
})

describe('simulateRetirementWithAnnualRates', () => {
  it('matches simulateRetirement when all years use the same rates', () => {
    const input = baseInput()
    const det = simulateRetirement(input)
    const { endYear } = computeSimulationHorizon(input)
    const n = endYear - input.startYear + 1
    const uniform = Array.from({ length: n }, () => ({
      portfolioReturn: input.portfolioReturn,
      inflationRate: input.inflationRate,
    }))
    const alt = simulateRetirementWithAnnualRates(input, uniform)
    expect(alt.rows.length).toBe(det.rows.length)
    for (let i = 0; i < det.rows.length; i++) {
      expect(alt.rows[i]!.endPortfolioBalance).toBeCloseTo(det.rows[i]!.endPortfolioBalance, 5)
      expect(alt.rows[i]!.annualExpense).toBeCloseTo(det.rows[i]!.annualExpense, 5)
    }
  })
})

describe('monteCarloOutlookScore', () => {
  it('returns a bounded score', () => {
    const input = baseInput()
    const mc = runMonteCarloBootstrap(input, { trialCount: 40, seed: 7 })
    const s = monteCarloOutlookScore(mc)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
})

describe('runMonteCarloBootstrap', () => {
  it('returns stable summary for fixed seed and trial count', () => {
    const input = baseInput()
    const a = runMonteCarloBootstrap(input, { trialCount: 80, seed: 99_001 })
    const b = runMonteCarloBootstrap(input, { trialCount: 80, seed: 99_001 })
    expect(a.seedUsed).toBe(99_001)
    expect(b.seedUsed).toBe(99_001)
    expect(a.everShortfallFraction).toBe(b.everShortfallFraction)
    expect(a.finalEndBalanceP50).toBe(b.finalEndBalanceP50)
    const y = a.rows.find((r) => r.calendarYear === 2030)
    const y2 = b.rows.find((r) => r.calendarYear === 2030)
    expect(y?.endBalanceP50).toBe(y2?.endBalanceP50)
  })

  it('uses historical pair pool', () => {
    expect(HISTORICAL_RETURN_INFLATION_PAIRS.length).toBeGreaterThan(20)
  })
})
