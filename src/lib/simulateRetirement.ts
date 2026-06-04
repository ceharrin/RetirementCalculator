import {
  adjustSpendingForDecision,
  DEFAULT_GUARDRAIL_BAND,
  DEFAULT_GUARDRAIL_SPENDING_STEP,
  guardrailDecision,
  withdrawalRate,
} from './retirementGuardrails'

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

/** Calendar year from which the optional trust-fund shortfall scales down modeled SS benefits. */
export const SS_TRUST_FUND_CUT_START_YEAR = 2032

/** Retain this fraction of modeled benefits after a 23% cut (1 − 0.23). */
export const SS_TRUST_FUND_BENEFIT_RETENTION = 0.77

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

/** One portfolio step per year vs twelve (monthly return and cash flows within the year). */
export type ProjectionCadence = 'annual' | 'monthly'

/** Nominal portfolio return and CPI-style inflation for one projection calendar year. */
export interface AnnualMarketRates {
  portfolioReturn: number
  inflationRate: number
}

/**
 * Equivalent per-month rate so twelve compound steps match one annual step:
 * `(1 + r_m)^12 = 1 + r_annual`.
 */
export function monthlyRateFromAnnual(annualDecimal: number): number {
  if (!Number.isFinite(annualDecimal)) return 0
  return (1 + annualDecimal) ** (1 / 12) - 1
}

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
  /** Recurring nominal income streams (pension, rental, part-time, etc.) beyond Social Security. */
  recurringIncomes: RecurringIncomeInput[]
  /** One-time contributions added to portfolio in the matching retiree age year. */
  windfalls: WindfallInput[]
  /** One-time portfolio-funded expenses charged in the matching retiree age year. */
  oneTimeExpenses: OneTimeExpenseInput[]
  /**
   * Annual Social Security COLA as decimal (e.g. 0.026). Applied each year after the first
   * benefit year on each benefit amount (simplified; actual SSA rules vary).
   */
  socialSecurityColaRate: number
  /**
   * When true, modeled Social Security (retiree, spouse, custom survivor) is multiplied by
   * SS_TRUST_FUND_BENEFIT_RETENTION from SS_TRUST_FUND_CUT_START_YEAR onward (23% cut on entered amounts).
   */
  modelSsBenefitCutFrom2032: boolean
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
  /**
   * Guyton–Klinger-style MVP: record planned withdrawal ÷ portfolio (after return, before withdrawal)
   * in the first retirement year; later years move nominal spending by ±10% if that rate strays
   * outside ±20% of the anchor. No inflation skip; same annual spending for monthly cadence.
   */
  useSpendingGuardrails: boolean
  projectionCadence: ProjectionCadence
}

/** Per-year guardrail state when `useSpendingGuardrails` is modeled (otherwise `off`). */
export type GuardrailYearKind = 'off' | 'anchor' | 'hold' | 'increase' | 'decrease'

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
  otherIncome: number
  windfall: number
  oneTimeExpense: number
  portfolioWithdrawal: number
  /** Balance after return and withdrawal */
  endPortfolioBalance: number
  shortfall: boolean
  /** Guyton–Klinger guardrail role for this year (`off` when not modeled). */
  guardrailYearKind: GuardrailYearKind
}

export interface SimulationResult {
  rows: YearProjection[]
  retirementStartYear: number | null
  /** Echo of input: when true, row `guardrailYearKind` may be non-`off` in retirement. */
  useSpendingGuardrails: boolean
}

export interface ValidationIssue {
  field: string
  message: string
}

export interface WindfallInput {
  title: string
  amount: number
  startAge: number
}

export interface OneTimeExpenseInput {
  title: string
  amount: number
  startAge: number
}

export interface RecurringIncomeInput {
  label: string
  annualAmount: number
  startAge: number
  /** Last retiree age this income is received. null = runs through the last alive year. */
  endAge: number | null
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

function trustFundSsBenefitMultiplier(
  calendarYear: number,
  input: SimulationInput,
): number {
  if (!input.modelSsBenefitCutFrom2032) return 1
  if (calendarYear < SS_TRUST_FUND_CUT_START_YEAR) return 1
  return SS_TRUST_FUND_BENEFIT_RETENTION
}

/**
 * First retirement year: store anchor withdrawal rate only. Later years: optional ±10% nominal
 * spending adjustment vs DEFAULT_GUARDRAIL_BAND around that rate.
 */
function adjustAnnualExpenseForGuardrails(
  input: SimulationInput,
  balanceStartOfYear: number,
  portfolioReturn: number,
  policyAnnualExpense: number,
  socialSecurity: number,
  inRetirementPhase: boolean,
  householdAlive: boolean,
  initialWithdrawalRate: { current: number | null },
): { annualExpense: number; kind: GuardrailYearKind } {
  if (!input.useSpendingGuardrails || !inRetirementPhase || !householdAlive) {
    return { annualExpense: policyAnnualExpense, kind: 'off' }
  }

  const afterReturn = balanceStartOfYear * (1 + portfolioReturn)
  const plannedWithdrawal = Math.max(0, policyAnnualExpense - socialSecurity)

  if (initialWithdrawalRate.current === null) {
    if (afterReturn > 0) {
      const rate = withdrawalRate(plannedWithdrawal, afterReturn)
      if (Number.isFinite(rate) && rate > 0) {
        initialWithdrawalRate.current = rate
        return { annualExpense: policyAnnualExpense, kind: 'anchor' }
      }
    }
    return { annualExpense: policyAnnualExpense, kind: 'hold' }
  }

  if (afterReturn <= 0) {
    return { annualExpense: policyAnnualExpense, kind: 'hold' }
  }

  const currentRate = withdrawalRate(plannedWithdrawal, afterReturn)
  if (!Number.isFinite(currentRate)) {
    return { annualExpense: policyAnnualExpense, kind: 'hold' }
  }

  const decision = guardrailDecision(
    currentRate,
    initialWithdrawalRate.current,
    DEFAULT_GUARDRAIL_BAND,
  )
  const annualExpense = adjustSpendingForDecision(
    policyAnnualExpense,
    decision,
    DEFAULT_GUARDRAIL_SPENDING_STEP,
  )
  const kind: GuardrailYearKind =
    decision === 'increase' ? 'increase' : decision === 'decrease' ? 'decrease' : 'hold'
  return { annualExpense, kind }
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

function computeOtherAnnualIncome(
  retireeAge: number,
  retireeAlive: boolean,
  spouseAlive: boolean,
  input: SimulationInput,
): number {
  if (!(retireeAlive || spouseAlive)) return 0
  return input.recurringIncomes.reduce((sum, s) => {
    if (retireeAge < s.startAge) return sum
    if (s.endAge !== null && retireeAge > s.endAge) return sum
    return sum + s.annualAmount
  }, 0)
}

function computeWindfallForYear(
  retireeAge: number,
  retireeAlive: boolean,
  spouseAlive: boolean,
  input: SimulationInput,
): number {
  if (!(retireeAlive || spouseAlive)) return 0
  return input.windfalls.reduce((sum, w) => (w.startAge === retireeAge ? sum + w.amount : sum), 0)
}

function computeOneTimeExpenseForYear(
  retireeAge: number,
  retireeAlive: boolean,
  spouseAlive: boolean,
  input: SimulationInput,
): number {
  if (!(retireeAlive || spouseAlive)) return 0
  return input.oneTimeExpenses.reduce(
    (sum, e) => (e.startAge === retireeAge ? sum + e.amount : sum),
    0,
  )
}

interface YearCashFlowResult {
  endPortfolioBalance: number
  portfolioWithdrawal: number
  /** Reported annual expense (retirement years only; matches annual-cadence semantics). */
  annualExpenseReported: number
  shortfall: boolean
}

function applyAnnualYearStep(
  balance: number,
  annualExpense: number,
  totalIncome: number,
  inRetirementPhase: boolean,
  householdAlive: boolean,
  portfolioReturn: number,
): YearCashFlowResult {
  const afterReturn = balance * (1 + portfolioReturn)
  if (inRetirementPhase && householdAlive) {
    let withdrawal = Math.max(0, annualExpense - totalIncome)
    let shortfall = false
    if (withdrawal > afterReturn) {
      shortfall = true
      withdrawal = afterReturn
    }
    return {
      endPortfolioBalance: Math.max(0, afterReturn - withdrawal),
      portfolioWithdrawal: withdrawal,
      annualExpenseReported: annualExpense,
      shortfall,
    }
  }
  return {
    endPortfolioBalance: Math.max(0, afterReturn + totalIncome),
    portfolioWithdrawal: 0,
    annualExpenseReported: 0,
    shortfall: false,
  }
}

/**
 * Twelve substeps: geometric monthly return; retirement spending and SS split evenly by month.
 */
function applyMonthlyYearStep(
  balance: number,
  annualExpense: number,
  totalIncome: number,
  inRetirementPhase: boolean,
  householdAlive: boolean,
  portfolioReturn: number,
): YearCashFlowResult {
  const rM = monthlyRateFromAnnual(portfolioReturn)
  let bal = balance
  let totalWithdrawal = 0
  let shortfall = false

  if (inRetirementPhase && householdAlive) {
    const monthlyExpense = annualExpense / 12
    const monthlyIncome = totalIncome / 12
    for (let m = 0; m < 12; m++) {
      const afterReturn = bal * (1 + rM)
      let withdrawal = Math.max(0, monthlyExpense - monthlyIncome)
      if (withdrawal > afterReturn) {
        shortfall = true
        withdrawal = afterReturn
      }
      bal = Math.max(0, afterReturn - withdrawal)
      totalWithdrawal += withdrawal
    }
    return {
      endPortfolioBalance: bal,
      portfolioWithdrawal: totalWithdrawal,
      annualExpenseReported: annualExpense,
      shortfall,
    }
  }

  const monthlyIncome = totalIncome / 12
  for (let m = 0; m < 12; m++) {
    bal = bal * (1 + rM)
    bal = Math.max(0, bal + monthlyIncome)
  }
  return {
    endPortfolioBalance: bal,
    portfolioWithdrawal: 0,
    annualExpenseReported: 0,
    shortfall: false,
  }
}

export function validateSimulationInput(
  input: SimulationInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (input.startYear < 1900 || input.startYear > 2200) {
    issues.push({ field: 'startYear', message: 'Use a reasonable planning start year.' })
  }

  if (input.projectionCadence !== 'annual' && input.projectionCadence !== 'monthly') {
    issues.push({
      field: 'projectionCadence',
      message: 'Projection timing must be annual or monthly.',
    })
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

  for (const [i, s] of input.recurringIncomes.entries()) {
    if (s.annualAmount < 0) {
      issues.push({ field: `recurringIncome_${i}_amount`, message: `Income stream "${s.label || i + 1}" amount cannot be negative.` })
    }
    if (s.startAge < 18 || s.startAge > 120) {
      issues.push({ field: `recurringIncome_${i}_startAge`, message: `Income stream "${s.label || i + 1}" start age must be between 18 and 120.` })
    }
    if (s.endAge !== null && (s.endAge < s.startAge || s.endAge > 120)) {
      issues.push({ field: `recurringIncome_${i}_endAge`, message: `Income stream "${s.label || i + 1}" end age must be at or after start age.` })
    }
  }

  input.windfalls.forEach((w, idx) => {
    if (w.title.trim().length === 0) {
      issues.push({
        field: 'windfalls',
        message: `Windfall #${idx + 1} needs a title.`,
      })
    }
    if (!Number.isFinite(w.amount) || w.amount < 0) {
      issues.push({
        field: 'windfalls',
        message: `Windfall #${idx + 1} amount must be zero or greater.`,
      })
    }
    if (!Number.isFinite(w.startAge) || w.startAge < 18 || w.startAge > 120) {
      issues.push({
        field: 'windfalls',
        message: `Windfall #${idx + 1} age should be between 18 and 120.`,
      })
    }
  })

  input.oneTimeExpenses.forEach((e, idx) => {
    if (e.title.trim().length === 0) {
      issues.push({
        field: 'oneTimeExpenses',
        message: `One-time expense #${idx + 1} needs a title.`,
      })
    }
    if (!Number.isFinite(e.amount) || e.amount < 0) {
      issues.push({
        field: 'oneTimeExpenses',
        message: `One-time expense #${idx + 1} amount must be zero or greater.`,
      })
    }
    if (!Number.isFinite(e.startAge) || e.startAge < 18 || e.startAge > 120) {
      issues.push({
        field: 'oneTimeExpenses',
        message: `One-time expense #${idx + 1} age should be between 18 and 120.`,
      })
    }
  })

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

/** End calendar year and first retirement calendar year (null if never reached within horizon). */
export function computeSimulationHorizon(input: SimulationInput): {
  endYear: number
  retirementStartYear: number | null
} {
  const endYear =
    input.hasSpouse && input.spouseCurrentAge != null && input.spouseDeathAge != null
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

  return { endYear, retirementStartYear }
}

/**
 * Same rules as `simulateRetirement`, but each calendar year uses its own nominal return and
 * inflation from `annualRates` (length must equal horizon year count). Inflation compounds
 * nominal retirement spending year-by-year using each retirement year’s sampled rate.
 */
export function simulateRetirementWithAnnualRates(
  input: SimulationInput,
  annualRates: AnnualMarketRates[],
): SimulationResult {
  const issues = validateSimulationInput(input)
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join(' '))
  }

  const { endYear, retirementStartYear } = computeSimulationHorizon(input)
  const horizonYears = endYear - input.startYear + 1
  if (annualRates.length !== horizonYears) {
    throw new Error(
      `annualRates length ${annualRates.length} does not match projection horizon ${horizonYears} years.`,
    )
  }

  const rows: YearProjection[] = []
  let balance = input.currentSavings
  let nominalSpendingInflationMultiple = 1
  const initialWithdrawalRate: { current: number | null } = { current: null }

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

    const yearOffset = y - input.startYear
    const { portfolioReturn: r, inflationRate: inf } = annualRates[yearOffset]

    let annualExpense = 0
    if (inRetirementPhase && yearsSinceRetirement != null) {
      const jointExpenseNominal =
        input.annualExpenseAtRetirementStart * nominalSpendingInflationMultiple

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

    const socialSecurity =
      computeHouseholdSS(
        retireeAge,
        spouseAge,
        retireeAlive,
        spouseAlive,
        input,
      ) * trustFundSsBenefitMultiplier(y, input)
    const otherIncome = computeOtherAnnualIncome(
      retireeAge,
      retireeAlive,
      spouseAlive,
      input,
    )
    const totalIncome = socialSecurity + otherIncome
    const windfall = computeWindfallForYear(
      retireeAge,
      retireeAlive,
      spouseAlive,
      input,
    )
    const oneTimeExpense = computeOneTimeExpenseForYear(
      retireeAge,
      retireeAlive,
      spouseAlive,
      input,
    )
    const balanceAfterAdjustments = Math.max(0, balance + windfall - oneTimeExpense)

    const householdAlive = retireeAlive || spouseAlive
    const guardrailAdjust = adjustAnnualExpenseForGuardrails(
      input,
      balanceAfterAdjustments,
      r,
      annualExpense,
      socialSecurity,
      inRetirementPhase,
      householdAlive,
      initialWithdrawalRate,
    )
    annualExpense = guardrailAdjust.annualExpense
    const guardrailYearKind = guardrailAdjust.kind

    const cadence = input.projectionCadence
    const flow =
      cadence === 'monthly'
        ? applyMonthlyYearStep(
            balanceAfterAdjustments,
            // Windfalls and one-time expenses are applied before this year's return/withdrawals.
            annualExpense,
            totalIncome,
            inRetirementPhase,
            householdAlive,
            r,
          )
        : applyAnnualYearStep(
            balanceAfterAdjustments,
            annualExpense,
            totalIncome,
            inRetirementPhase,
            householdAlive,
            r,
          )

    rows.push({
      calendarYear: y,
      retireeAge,
      spouseAge,
      retireeAlive,
      spouseAlive,
      inRetirementPhase,
      yearsSinceRetirement,
      annualExpense: flow.annualExpenseReported,
      socialSecurity,
      otherIncome,
      windfall,
      oneTimeExpense,
      portfolioWithdrawal: flow.portfolioWithdrawal,
      endPortfolioBalance: flow.endPortfolioBalance,
      shortfall: flow.shortfall,
      guardrailYearKind,
    })

    balance = flow.endPortfolioBalance

    if (inRetirementPhase) {
      nominalSpendingInflationMultiple *= 1 + inf
    }
  }

  return { rows, retirementStartYear, useSpendingGuardrails: input.useSpendingGuardrails }
}

export function simulateRetirement(input: SimulationInput): SimulationResult {
  const { endYear } = computeSimulationHorizon(input)
  const horizonYears = endYear - input.startYear + 1
  const annualRates: AnnualMarketRates[] = Array.from({ length: horizonYears }, () => ({
    portfolioReturn: input.portfolioReturn,
    inflationRate: input.inflationRate,
  }))
  return simulateRetirementWithAnnualRates(input, annualRates)
}
