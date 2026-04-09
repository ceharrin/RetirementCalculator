/** Long-run CPI-style default (illustrative, not a forecast). */
export const DEFAULT_INFLATION_RATE = 0.03

/** Illustrative balanced portfolio nominal return; not a guarantee. */
export const DEFAULT_PORTFOLIO_RETURN = 0.065

export const DEFAULT_SS_CLAIM_AGE = 67
export const SS_CLAIM_AGE_MIN = 62
export const SS_CLAIM_AGE_MAX = 70

/**
 * Illustrative annual SS COLA (decimal). SSA sets COLA yearly from CPI-W; long-run averages
 * since automatic COLAs (1975+) are often cited around ~2.6%–3.8% depending on the period and
 * methodology — not a forecast. See https://www.ssa.gov/oact/cola/colaseries.html
 */
export const DEFAULT_SS_COLA_RATE = 0.026

/**
 * Age at which many planners begin modeling lower real (inflation-adjusted) spending—the
 * transition from “go-go” to “slow-go” years (often cited around 70–75; 70 is a common default).
 */
export const DEFAULT_SPENDING_DECLINE_START_AGE = 70

/** Default annual real spending decline after the start age (research often cites ~1%/year). */
export const DEFAULT_SPENDING_DECLINE_ANNUAL_RATE = 0.01

/** Whole-year claiming ages modeled in this tool (aligned with common SSA filing range). */
export const SS_CLAIM_AGE_OPTIONS: readonly number[] = Object.freeze(
  Array.from(
    { length: SS_CLAIM_AGE_MAX - SS_CLAIM_AGE_MIN + 1 },
    (_, i) => SS_CLAIM_AGE_MIN + i,
  ),
)

export function clampSsClaimAge(age: number): number {
  if (!Number.isFinite(age)) return DEFAULT_SS_CLAIM_AGE
  const r = Math.round(age)
  return Math.min(SS_CLAIM_AGE_MAX, Math.max(SS_CLAIM_AGE_MIN, r))
}

export type SurvivorSSMode = 'higherOfTwo' | 'custom'

export interface SimulationInput {
  /** Calendar year for the first projection row (retiree’s current age applies this year). */
  startYear: number
  hasSpouse: boolean
  retireeCurrentAge: number
  spouseCurrentAge: number | null
  retireeDeathAge: number
  spouseDeathAge: number | null
  retireeRetirementAge: number
  /** Expense in the first year of retirement, in then-current dollars (inflates each year after). */
  annualExpenseAtRetirementStart: number
  /** Annual inflation as decimal, e.g. 0.03 */
  inflationRate: number
  /** Nominal annual portfolio return as decimal, e.g. 0.065 */
  portfolioReturn: number
  currentSavings: number
  retireeClaimAge: number
  spouseClaimAge: number | null
  retireeAnnualSS: number
  spouseAnnualSS: number | null
  /**
   * Annual Social Security COLA as decimal (e.g. 0.026). Applied each year after the first
   * benefit year on each benefit amount (simplified; actual SSA rules vary).
   */
  socialSecurityColaRate: number
  /** After first death, household expense as % of joint expense (e.g. 75). */
  survivorExpensePercent: number
  survivorSSMode: SurvivorSSMode
  customSurvivorAnnualSS: number | null
  /**
   * Retiree age (or sole survivor’s age if retiree deceased) when real spending begins declining
   * annually on top of inflation.
   */
  spendingDeclineStartAge: number
  /** Annual real decline as decimal (e.g. 0.01 = 1%/yr) for each year at/above start age. */
  spendingDeclineAnnualRate: number
}

export interface YearProjection {
  calendarYear: number
  retireeAge: number
  spouseAge: number | null
  retireeAlive: boolean
  spouseAlive: boolean
  inRetirementPhase: boolean
  yearsSinceRetirement: number | null
  annualExpense: number
  socialSecurity: number
  portfolioWithdrawal: number
  /** Balance after return and withdrawal */
  endPortfolioBalance: number
  shortfall: boolean
}

export interface SimulationResult {
  rows: YearProjection[]
  retirementStartYear: number | null
}

export interface ValidationIssue {
  field: string
  message: string
}

function lastAliveYear(
  startYear: number,
  currentAge: number,
  deathAge: number,
): number {
  return startYear + (deathAge - currentAge) - 1
}

/** Whose age drives the spending-decline schedule: retiree while alive, else spouse if only survivor. */
function ageForSpendingDecline(
  retireeAlive: boolean,
  retireeAge: number,
  spouseAlive: boolean,
  spouseAge: number | null,
): number {
  if (retireeAlive) return retireeAge
  if (spouseAlive && spouseAge != null) return spouseAge
  return retireeAge
}

/** Multiplier on inflation-adjusted spending from real decline after start age (1 if below start). */
function realSpendingDeclineMultiplier(
  ageForDecline: number,
  declineStartAge: number,
  annualDeclineRate: number,
): number {
  if (annualDeclineRate <= 0 || ageForDecline < declineStartAge) return 1
  const years = ageForDecline - declineStartAge
  return (1 - annualDeclineRate) ** years
}

/**
 * Annual benefit in a given year if claiming: base at claim grows by COLA each year after.
 * First payment year (age === claimAge) uses exponent 0.
 */
function personSSCola(
  age: number,
  claimAge: number,
  deathAge: number,
  annualBenefitAtClaim: number,
  colaRate: number,
): number {
  if (age < claimAge || age >= deathAge) return 0
  const yearsSinceClaim = age - claimAge
  return annualBenefitAtClaim * (1 + colaRate) ** yearsSinceClaim
}

function computeHouseholdSS(
  retireeAge: number,
  spouseAge: number | null,
  retireeAlive: boolean,
  spouseAlive: boolean,
  input: SimulationInput,
): number {
  const cola = input.socialSecurityColaRate
  const rClaim = input.retireeClaimAge
  const rDeath = input.retireeDeathAge
  const rBen = input.retireeAnnualSS

  if (!input.hasSpouse || spouseAge === null || input.spouseDeathAge === null) {
    return personSSCola(retireeAge, rClaim, rDeath, rBen, cola)
  }

  const sClaim = input.spouseClaimAge!
  const sDeath = input.spouseDeathAge
  const sBen = input.spouseAnnualSS ?? 0

  if (retireeAlive && spouseAlive) {
    return (
      personSSCola(retireeAge, rClaim, rDeath, rBen, cola) +
      personSSCola(spouseAge, sClaim, sDeath, sBen, cola)
    )
  }

  const survivorBenefit =
    input.survivorSSMode === 'custom' && input.customSurvivorAnnualSS != null
      ? input.customSurvivorAnnualSS
      : Math.max(rBen, sBen)

  if (retireeAlive && !spouseAlive) {
    return personSSCola(retireeAge, rClaim, rDeath, survivorBenefit, cola)
  }

  if (!retireeAlive && spouseAlive) {
    return personSSCola(spouseAge, sClaim, sDeath, survivorBenefit, cola)
  }

  return 0
}

export function validateSimulationInput(
  input: SimulationInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (input.startYear < 1900 || input.startYear > 2200) {
    issues.push({ field: 'startYear', message: 'Use a reasonable planning start year.' })
  }

  if (input.retireeCurrentAge < 18 || input.retireeCurrentAge > 120) {
    issues.push({ field: 'retireeCurrentAge', message: 'Retiree age should be between 18 and 120.' })
  }

  if (input.retireeDeathAge <= input.retireeCurrentAge) {
    issues.push({
      field: 'retireeDeathAge',
      message: 'Age at death must be greater than current age.',
    })
  }

  if (input.retireeRetirementAge < input.retireeCurrentAge) {
    issues.push({
      field: 'retireeRetirementAge',
      message: 'Retirement age cannot be before current age.',
    })
  }

  if (input.retireeRetirementAge >= input.retireeDeathAge) {
    issues.push({
      field: 'retireeRetirementAge',
      message: 'Retirement age should be before age at death.',
    })
  }

  if (input.hasSpouse) {
    if (input.spouseCurrentAge == null || input.spouseDeathAge == null) {
      issues.push({
        field: 'spouse',
        message: 'Enter spouse current age and age at death.',
      })
    } else {
      if (input.spouseDeathAge <= input.spouseCurrentAge) {
        issues.push({
          field: 'spouseDeathAge',
          message: 'Spouse age at death must be greater than current age.',
        })
      }
    }
    if (input.spouseClaimAge == null) {
      issues.push({ field: 'spouseClaimAge', message: 'Enter spouse Social Security claim age.' })
    } else if (
      input.spouseClaimAge < SS_CLAIM_AGE_MIN ||
      input.spouseClaimAge > SS_CLAIM_AGE_MAX
    ) {
      issues.push({
        field: 'spouseClaimAge',
        message: `Claim age must be between ${SS_CLAIM_AGE_MIN} and ${SS_CLAIM_AGE_MAX}.`,
      })
    }
  }

  if (
    input.retireeClaimAge < SS_CLAIM_AGE_MIN ||
    input.retireeClaimAge > SS_CLAIM_AGE_MAX
  ) {
    issues.push({
      field: 'retireeClaimAge',
      message: `Claim age must be between ${SS_CLAIM_AGE_MIN} and ${SS_CLAIM_AGE_MAX}.`,
    })
  }

  if (input.annualExpenseAtRetirementStart < 0) {
    issues.push({ field: 'annualExpenseAtRetirementStart', message: 'Expenses cannot be negative.' })
  }

  if (input.currentSavings < 0) {
    issues.push({ field: 'currentSavings', message: 'Savings cannot be negative.' })
  }

  if (input.inflationRate < -0.1 || input.inflationRate > 0.25) {
    issues.push({ field: 'inflationRate', message: 'Inflation should be between -10% and 25%.' })
  }

  if (input.portfolioReturn < -0.2 || input.portfolioReturn > 0.3) {
    issues.push({
      field: 'portfolioReturn',
      message: 'Portfolio return should be between -20% and 30%.',
    })
  }

  if (
    input.socialSecurityColaRate < -0.05 ||
    input.socialSecurityColaRate > 0.15
  ) {
    issues.push({
      field: 'socialSecurityColaRate',
      message: 'SS COLA should be between -5% and 15% per year.',
    })
  }

  if (
    input.spendingDeclineStartAge < 55 ||
    input.spendingDeclineStartAge > 100
  ) {
    issues.push({
      field: 'spendingDeclineStartAge',
      message: 'Spending decline start age should be between 55 and 100.',
    })
  }

  if (
    input.spendingDeclineAnnualRate < 0 ||
    input.spendingDeclineAnnualRate > 0.05
  ) {
    issues.push({
      field: 'spendingDeclineAnnualRate',
      message: 'Annual real spending decline should be between 0% and 5%.',
    })
  }

  if (input.retireeAnnualSS < 0 || (input.spouseAnnualSS ?? 0) < 0) {
    issues.push({ field: 'socialSecurity', message: 'Social Security amounts cannot be negative.' })
  }

  if (
    input.survivorExpensePercent < 10 ||
    input.survivorExpensePercent > 150
  ) {
    issues.push({
      field: 'survivorExpensePercent',
      message: 'Survivor expense percent should be between 10 and 150.',
    })
  }

  if (
    input.survivorSSMode === 'custom' &&
    (input.customSurvivorAnnualSS == null || input.customSurvivorAnnualSS < 0)
  ) {
    issues.push({
      field: 'customSurvivorAnnualSS',
      message: 'Enter a custom annual survivor Social Security amount.',
    })
  }

  return issues
}

export function simulateRetirement(input: SimulationInput): SimulationResult {
  const issues = validateSimulationInput(input)
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join(' '))
  }

  const endYear = input.hasSpouse && input.spouseCurrentAge != null && input.spouseDeathAge != null
    ? Math.max(
        lastAliveYear(
          input.startYear,
          input.retireeCurrentAge,
          input.retireeDeathAge,
        ),
        lastAliveYear(
          input.startYear,
          input.spouseCurrentAge,
          input.spouseDeathAge,
        ),
      )
    : lastAliveYear(
        input.startYear,
        input.retireeCurrentAge,
        input.retireeDeathAge,
      )

  let retirementStartYear: number | null = null
  for (let y = input.startYear; y <= endYear; y++) {
    const ra = input.retireeCurrentAge + (y - input.startYear)
    if (ra >= input.retireeRetirementAge) {
      retirementStartYear = y
      break
    }
  }

  const rows: YearProjection[] = []
  let balance = input.currentSavings
  const r = input.portfolioReturn
  const inf = input.inflationRate

  for (let y = input.startYear; y <= endYear; y++) {
    const retireeAge = input.retireeCurrentAge + (y - input.startYear)
    const spouseAge =
      input.hasSpouse && input.spouseCurrentAge != null
        ? input.spouseCurrentAge + (y - input.startYear)
        : null

    const retireeAlive = retireeAge < input.retireeDeathAge
    const spouseAlive =
      input.hasSpouse &&
      spouseAge != null &&
      input.spouseDeathAge != null &&
      spouseAge < input.spouseDeathAge

    const inRetirementPhase =
      retirementStartYear != null && y >= retirementStartYear

    let yearsSinceRetirement: number | null = null
    if (inRetirementPhase && retirementStartYear != null) {
      yearsSinceRetirement = y - retirementStartYear
    }

    let annualExpense = 0
    if (inRetirementPhase && yearsSinceRetirement != null) {
      const jointExpenseNominal =
        input.annualExpenseAtRetirementStart * (1 + inf) ** yearsSinceRetirement

      const ageDecline = ageForSpendingDecline(
        retireeAlive,
        retireeAge,
        spouseAlive,
        spouseAge,
      )
      const declineMult = realSpendingDeclineMultiplier(
        ageDecline,
        input.spendingDeclineStartAge,
        input.spendingDeclineAnnualRate,
      )
      const jointExpense = jointExpenseNominal * declineMult

      if (input.hasSpouse && retireeAlive && spouseAlive) {
        annualExpense = jointExpense
      } else if (input.hasSpouse && (retireeAlive || spouseAlive)) {
        annualExpense =
          jointExpense * (input.survivorExpensePercent / 100)
      } else if (retireeAlive || spouseAlive) {
        annualExpense = jointExpense
      }
    }

    const socialSecurity = computeHouseholdSS(
      retireeAge,
      spouseAge,
      retireeAlive,
      spouseAlive,
      input,
    )

    const afterReturn = balance * (1 + r)
    let withdrawal = 0
    let shortfall = false
    let endPortfolioBalance: number

    if (inRetirementPhase && (retireeAlive || spouseAlive)) {
      withdrawal = Math.max(0, annualExpense - socialSecurity)
      if (withdrawal > afterReturn) {
        shortfall = true
        withdrawal = afterReturn
      }
      endPortfolioBalance = Math.max(0, afterReturn - withdrawal)
    } else {
      endPortfolioBalance = Math.max(0, afterReturn + socialSecurity)
    }

    rows.push({
      calendarYear: y,
      retireeAge,
      spouseAge,
      retireeAlive,
      spouseAlive,
      inRetirementPhase,
      yearsSinceRetirement,
      annualExpense,
      socialSecurity,
      portfolioWithdrawal: withdrawal,
      endPortfolioBalance,
      shortfall,
    })

    balance = endPortfolioBalance
  }

  return { rows, retirementStartYear }
}
