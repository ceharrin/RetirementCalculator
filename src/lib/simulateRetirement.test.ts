import { describe, expect, it } from 'vitest'
import {
  clampSsClaimAge,
  simulateRetirement,
  validateSimulationInput,
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
    inflationRate: 0,
    portfolioReturn: 0,
    currentSavings: 100_000,
    retireeClaimAge: 67,
    spouseClaimAge: null,
    retireeAnnualSS: 0,
    spouseAnnualSS: null,
    survivorExpensePercent: 75,
    survivorSSMode: 'higherOfTwo',
    customSurvivorAnnualSS: null,
    socialSecurityColaRate: 0,
    spendingDeclineStartAge: 100,
    spendingDeclineAnnualRate: 0,
    projectionCadence: 'annual',
    ...over,
  }
}

describe('clampSsClaimAge', () => {
  it('clamps to 62–70 and rounds', () => {
    expect(clampSsClaimAge(55)).toBe(62)
    expect(clampSsClaimAge(72)).toBe(70)
    expect(clampSsClaimAge(62.4)).toBe(62)
    expect(clampSsClaimAge(69.6)).toBe(70)
  })
})

describe('validateSimulationInput', () => {
  it('accepts a minimal valid single-person input', () => {
    expect(validateSimulationInput(baseInput())).toEqual([])
  })

  it('flags death age before current age', () => {
    const issues = validateSimulationInput(
      baseInput({ retireeDeathAge: 55 }),
    )
    expect(issues.some((i) => i.field === 'retireeDeathAge')).toBe(true)
  })
})

describe('simulateRetirement', () => {
  it('projects single retiree with shortfall when portfolio is exhausted', () => {
    const { rows } = simulateRetirement(
      baseInput({
        retireeCurrentAge: 65,
        retireeRetirementAge: 65,
        retireeDeathAge: 75,
        annualExpenseAtRetirementStart: 50_000,
        currentSavings: 80_000,
        portfolioReturn: 0,
        inflationRate: 0,
      }),
    )

    const shortfallRows = rows.filter((r) => r.shortfall)
    expect(shortfallRows.length).toBeGreaterThan(0)
    expect(rows[rows.length - 1].endPortfolioBalance).toBe(0)
  })

  it('sums Social Security for both spouses while both are alive', () => {
    const { rows } = simulateRetirement(
      baseInput({
        hasSpouse: true,
        spouseCurrentAge: 58,
        spouseDeathAge: 88,
        retireeCurrentAge: 60,
        retireeRetirementAge: 67,
        retireeDeathAge: 90,
        retireeClaimAge: 67,
        spouseClaimAge: 67,
        retireeAnnualSS: 30_000,
        spouseAnnualSS: 24_000,
        annualExpenseAtRetirementStart: 100_000,
        currentSavings: 1_000_000,
        portfolioReturn: 0.05,
        inflationRate: 0.02,
      }),
    )

    const rowBothClaiming = rows.find(
      (r) =>
        r.retireeAge >= 67 &&
        r.spouseAge != null &&
        r.spouseAge >= 67 &&
        r.retireeAlive &&
        r.spouseAlive &&
        r.inRetirementPhase,
    )
    expect(rowBothClaiming).toBeDefined()
    expect(rowBothClaiming!.socialSecurity).toBe(54_000)
  })

  it('applies survivor expense percent after first death', () => {
    const { rows } = simulateRetirement(
      baseInput({
        hasSpouse: true,
        spouseCurrentAge: 60,
        spouseDeathAge: 80,
        retireeCurrentAge: 60,
        retireeRetirementAge: 65,
        retireeDeathAge: 90,
        retireeClaimAge: 65,
        spouseClaimAge: 65,
        retireeAnnualSS: 40_000,
        spouseAnnualSS: 30_000,
        annualExpenseAtRetirementStart: 100_000,
        survivorExpensePercent: 70,
        currentSavings: 2_000_000,
        portfolioReturn: 0,
        inflationRate: 0,
      }),
    )

    const jointRow = rows.find(
      (r) => r.retireeAge === 70 && r.spouseAlive && r.spouseAge === 70,
    )
    const survivorRow = rows.find(
      (r) => r.retireeAge === 85 && !r.spouseAlive,
    )
    expect(jointRow?.annualExpense).toBe(100_000)
    expect(survivorRow?.annualExpense).toBe(70_000)
  })

  it('uses higher of two SS benefits for survivor when mode is higherOfTwo', () => {
    const { rows } = simulateRetirement(
      baseInput({
        hasSpouse: true,
        spouseCurrentAge: 65,
        spouseDeathAge: 72,
        retireeCurrentAge: 65,
        retireeRetirementAge: 65,
        retireeDeathAge: 90,
        retireeClaimAge: 65,
        spouseClaimAge: 65,
        retireeAnnualSS: 20_000,
        spouseAnnualSS: 35_000,
        annualExpenseAtRetirementStart: 40_000,
        survivorSSMode: 'higherOfTwo',
        currentSavings: 500_000,
        portfolioReturn: 0,
        inflationRate: 0,
      }),
    )

    const survivorOnly = rows.find(
      (r) => r.retireeAlive && !r.spouseAlive && r.retireeAge === 73,
    )
    expect(survivorOnly?.socialSecurity).toBe(35_000)
  })

  it('grows Social Security benefits by COLA after the first payment year', () => {
    const { rows } = simulateRetirement(
      baseInput({
        retireeCurrentAge: 66,
        retireeRetirementAge: 66,
        retireeDeathAge: 70,
        retireeClaimAge: 66,
        retireeAnnualSS: 10_000,
        annualExpenseAtRetirementStart: 0,
        currentSavings: 100_000,
        portfolioReturn: 0,
        inflationRate: 0,
        socialSecurityColaRate: 0.05,
      }),
    )

    const y0 = rows.find((r) => r.retireeAge === 66)
    const y1 = rows.find((r) => r.retireeAge === 67)
    expect(y0?.socialSecurity).toBe(10_000)
    expect(y1?.socialSecurity).toBe(10_500)
  })

  it('applies real spending decline on top of inflation after start age', () => {
    const { rows } = simulateRetirement(
      baseInput({
        retireeCurrentAge: 65,
        retireeRetirementAge: 65,
        retireeDeathAge: 75,
        annualExpenseAtRetirementStart: 100_000,
        inflationRate: 0.1,
        spendingDeclineStartAge: 100,
        spendingDeclineAnnualRate: 0,
        currentSavings: 1_000_000,
        portfolioReturn: 0,
      }),
    )
    expect(rows.find((r) => r.retireeAge === 65)?.annualExpense).toBe(100_000)
    expect(rows.find((r) => r.retireeAge === 66)?.annualExpense).toBeCloseTo(110_000, 5)

    const { rows: rows2 } = simulateRetirement(
      baseInput({
        retireeCurrentAge: 65,
        retireeRetirementAge: 65,
        retireeDeathAge: 75,
        annualExpenseAtRetirementStart: 100_000,
        inflationRate: 0,
        spendingDeclineStartAge: 70,
        spendingDeclineAnnualRate: 0.05,
        currentSavings: 1_000_000,
        portfolioReturn: 0,
      }),
    )
    const at70 = rows2.find((r) => r.retireeAge === 70)
    const at71 = rows2.find((r) => r.retireeAge === 71)
    expect(at70?.annualExpense).toBe(100_000)
    expect(at71?.annualExpense).toBe(95_000)
  })

  it('combines inflation then real decline for expenses', () => {
    const { rows } = simulateRetirement(
      baseInput({
        retireeCurrentAge: 69,
        retireeRetirementAge: 69,
        retireeDeathAge: 72,
        annualExpenseAtRetirementStart: 100_000,
        inflationRate: 0.1,
        spendingDeclineStartAge: 70,
        spendingDeclineAnnualRate: 0.05,
        currentSavings: 500_000,
        portfolioReturn: 0,
      }),
    )
    const at69 = rows.find((r) => r.retireeAge === 69)
    const at70 = rows.find((r) => r.retireeAge === 70)
    const at71 = rows.find((r) => r.retireeAge === 71)
    expect(at69?.annualExpense).toBe(100_000)
    expect(at70?.annualExpense).toBeCloseTo(110_000, 5)
    const nominal71 = 100_000 * 1.1 ** 2
    expect(at71?.annualExpense).toBeCloseTo(nominal71 * 0.95, 5)
  })

  it('monthly cadence uses 12 steps and matches annual when return and SS are zero', () => {
    const input = baseInput({
      retireeCurrentAge: 65,
      retireeRetirementAge: 65,
      retireeDeathAge: 70,
      annualExpenseAtRetirementStart: 60_000,
      currentSavings: 200_000,
      portfolioReturn: 0,
      inflationRate: 0,
    })
    const annualRows = simulateRetirement({ ...input, projectionCadence: 'annual' }).rows
    const monthlyRows = simulateRetirement({ ...input, projectionCadence: 'monthly' }).rows
    expect(monthlyRows.length).toBe(annualRows.length)
    for (let i = 0; i < annualRows.length; i++) {
      expect(monthlyRows[i].portfolioWithdrawal).toBeCloseTo(annualRows[i].portfolioWithdrawal, 5)
      expect(monthlyRows[i].endPortfolioBalance).toBeCloseTo(annualRows[i].endPortfolioBalance, 5)
      expect(monthlyRows[i].annualExpense).toBe(annualRows[i].annualExpense)
    }
  })

  it('monthly cadence produces finite rows with positive return', () => {
    const { rows } = simulateRetirement(
      baseInput({
        projectionCadence: 'monthly',
        retireeCurrentAge: 65,
        retireeRetirementAge: 65,
        retireeDeathAge: 80,
        annualExpenseAtRetirementStart: 40_000,
        currentSavings: 800_000,
        portfolioReturn: 0.06,
        inflationRate: 0.03,
        retireeClaimAge: 65,
        retireeAnnualSS: 15_000,
      }),
    )
    expect(rows.every((r) => Number.isFinite(r.endPortfolioBalance))).toBe(true)
    expect(rows.some((r) => r.portfolioWithdrawal > 0)).toBe(true)
  })
})
