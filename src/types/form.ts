import {
  clampSsClaimAge,
  DEFAULT_SPENDING_DECLINE_ANNUAL_RATE,
  DEFAULT_SPENDING_DECLINE_START_AGE,
  DEFAULT_SS_COLA_RATE,
  type ProjectionCadence,
  type SimulationInput,
  type SurvivorSSMode,
  type OneTimeExpenseInput,
  type WindfallInput,
  type ValidationIssue,
} from '../lib/simulateRetirement'

export type ProjectionMode = 'deterministic' | 'monte_carlo'

/** Form-friendly mirror of simulation input; rates as whole percents (e.g. 3 = 3%). */
export interface FormState {
  startYear: number
  hasSpouse: boolean
  retireeCurrentAge: number
  spouseCurrentAge: number
  retireeDeathAge: number
  spouseDeathAge: number
  retireeRetirementAge: number
  annualExpenseAtRetirementStart: number
  /** Age when real spending starts declining yearly (often ~70; go-go / slow-go). */
  spendingDeclineStartAge: number
  /** Real spending decline per year after start age, whole percent (e.g. 1 = 1%). */
  spendingDeclinePercent: number
  inflationPercent: number
  portfolioReturnPercent: number
  currentSavings: number
  retireeClaimAge: number
  spouseClaimAge: number
  retireeAnnualSS: number
  spouseAnnualSS: number
  otherAnnualIncome: number
  otherIncomeStartAge: number
  windfalls: WindfallInput[]
  oneTimeExpenses: OneTimeExpenseInput[]
  /** Annual SS COLA as whole percent (e.g. 2.6 = 2.6%). */
  socialSecurityColaPercent: number
  /**
   * If true, simulation applies a 23% reduction to modeled SS from 2032 (retiree, spouse, survivor).
   */
  modelSsBenefitCutFrom2032: boolean
  survivorExpensePercent: number
  survivorSSMode: SurvivorSSMode
  customSurvivorAnnualSS: number
  /** One portfolio step per year vs twelve within each year. */
  projectionCadence: ProjectionCadence
  /** Guyton–Klinger-style optional adjustment to nominal retirement spending (see simulation). */
  useSpendingGuardrails: boolean
  /** Deterministic fixed rates vs Monte Carlo bootstrap of historical return/inflation pairs. */
  projectionMode: ProjectionMode
  /** Number of Monte Carlo trials (when projectionMode is monte_carlo). */
  monteCarloTrials: number
  /** Integer seed for reproducible Monte Carlo; empty string uses an automatic seed each run. */
  monteCarloSeed: string
  /**
   * Share of total retirement savings by account type (whole percents). Four buckets must sum to 100.
   * Used for future MAGI-aware modeling.
   */
  portfolioTaxDeferredPercent: number
  portfolioRothPercent: number
  portfolioTaxablePercent: number
  portfolioHsaPercent: number
  /**
   * Estimated share of each dollar withdrawn from taxable accounts that counts toward MAGI
   * (e.g. realized gains, ordinary dividends), whole percent 0–100. Illustrative proxy only.
   */
  taxableWithdrawalMagiPercent: number
  /**
   * People in the tax household for Marketplace / Form 8962 context (not necessarily same as
   * “has spouse” in the portfolio model). Used only for healthcare education on this tab.
   */
  acaMarketplaceHouseholdSize: number
  /**
   * Estimated annual household MAGI for subsidy context; null means not entered. Not used by simulation.
   */
  acaMarketplaceMagiEstimate: number | null
}

export function defaultFormState(nowYear: number): FormState {
  return {
    startYear: nowYear,
    hasSpouse: true,
    retireeCurrentAge: 60,
    spouseCurrentAge: 58,
    retireeDeathAge: 90,
    spouseDeathAge: 88,
    retireeRetirementAge: 65,
    annualExpenseAtRetirementStart: 80_000,
    spendingDeclineStartAge: DEFAULT_SPENDING_DECLINE_START_AGE,
    spendingDeclinePercent: DEFAULT_SPENDING_DECLINE_ANNUAL_RATE * 100,
    inflationPercent: 3,
    portfolioReturnPercent: 6.5,
    currentSavings: 500_000,
    retireeClaimAge: 67,
    spouseClaimAge: 67,
    retireeAnnualSS: 30_000,
    spouseAnnualSS: 22_000,
    otherAnnualIncome: 0,
    otherIncomeStartAge: 67,
    windfalls: [],
    oneTimeExpenses: [],
    socialSecurityColaPercent: DEFAULT_SS_COLA_RATE * 100,
    modelSsBenefitCutFrom2032: false,
    survivorExpensePercent: 75,
    survivorSSMode: 'higherOfTwo',
    customSurvivorAnnualSS: 30_000,
    projectionCadence: 'annual',
    useSpendingGuardrails: false,
    projectionMode: 'deterministic',
    monteCarloTrials: 500,
    monteCarloSeed: '',
    portfolioTaxDeferredPercent: 45,
    portfolioRothPercent: 15,
    portfolioTaxablePercent: 35,
    portfolioHsaPercent: 5,
    taxableWithdrawalMagiPercent: 40,
    acaMarketplaceHouseholdSize: 2,
    acaMarketplaceMagiEstimate: null,
  }
}

/** Extra validation for Monte Carlo controls (append to `validateSimulationInput` issues). */
export function validateMonteCarloControls(form: FormState): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (form.projectionMode !== 'monte_carlo') return issues

  if (
    !Number.isFinite(form.monteCarloTrials) ||
    form.monteCarloTrials < 50 ||
    form.monteCarloTrials > 5000
  ) {
    issues.push({
      field: 'monteCarloTrials',
      message: 'Monte Carlo trials should be between 50 and 5,000.',
    })
  }

  const s = form.monteCarloSeed.trim()
  if (s !== '' && !/^-?\d+$/.test(s)) {
    issues.push({
      field: 'monteCarloSeed',
      message: 'Optional seed must be a whole number (or leave blank for automatic).',
    })
  }

  return issues
}

/** Whole percents for tax-deferred / Roth / taxable / HSA must total 100; taxable MAGI share 0–100. */
export function validatePortfolioAccountMix(form: FormState): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const buckets = [
    form.portfolioTaxDeferredPercent,
    form.portfolioRothPercent,
    form.portfolioTaxablePercent,
    form.portfolioHsaPercent,
  ]
  for (const b of buckets) {
    if (!Number.isFinite(b) || b < 0 || b > 100) {
      issues.push({
        field: 'portfolioAccountMix',
        message: 'Each account bucket must be between 0% and 100%.',
      })
      break
    }
  }
  const sum =
    form.portfolioTaxDeferredPercent +
    form.portfolioRothPercent +
    form.portfolioTaxablePercent +
    form.portfolioHsaPercent
  if (Number.isFinite(sum) && Math.abs(sum - 100) > 0.01) {
    issues.push({
      field: 'portfolioAccountMix',
      message: 'Tax-deferred, Roth, taxable, and HSA portions must total 100%.',
    })
  }
  if (
    !Number.isFinite(form.taxableWithdrawalMagiPercent) ||
    form.taxableWithdrawalMagiPercent < 0 ||
    form.taxableWithdrawalMagiPercent > 100
  ) {
    issues.push({
      field: 'taxableWithdrawalMagiPercent',
      message: 'Taxable withdrawal MAGI share should be between 0% and 100%.',
    })
  }
  return issues
}

/** Marketplace household size and optional MAGI estimate (healthcare tab only; not used by simulation). */
export function validateAcaMarketplacePlanner(form: FormState): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const s = form.acaMarketplaceHouseholdSize
  if (!Number.isFinite(s) || !Number.isInteger(s) || s < 1 || s > 20) {
    issues.push({
      field: 'acaMarketplaceHouseholdSize',
      message: 'Marketplace household size should be a whole number from 1 to 20.',
    })
  }
  const m = form.acaMarketplaceMagiEstimate
  if (m !== null) {
    if (!Number.isFinite(m) || m < 0) {
      issues.push({
        field: 'acaMarketplaceMagiEstimate',
        message: 'Estimated MAGI should be zero or greater (or leave blank).',
      })
    }
  }
  return issues
}

export function formStateToSimulationInput(form: FormState): SimulationInput {
  return {
    startYear: form.startYear,
    hasSpouse: form.hasSpouse,
    retireeCurrentAge: form.retireeCurrentAge,
    spouseCurrentAge: form.hasSpouse ? form.spouseCurrentAge : null,
    retireeDeathAge: form.retireeDeathAge,
    spouseDeathAge: form.hasSpouse ? form.spouseDeathAge : null,
    retireeRetirementAge: form.retireeRetirementAge,
    annualExpenseAtRetirementStart: form.annualExpenseAtRetirementStart,
    spendingDeclineStartAge: form.spendingDeclineStartAge,
    spendingDeclineAnnualRate: form.spendingDeclinePercent / 100,
    inflationRate: form.inflationPercent / 100,
    portfolioReturn: form.portfolioReturnPercent / 100,
    currentSavings: form.currentSavings,
    retireeClaimAge: clampSsClaimAge(form.retireeClaimAge),
    spouseClaimAge: form.hasSpouse ? clampSsClaimAge(form.spouseClaimAge) : null,
    retireeAnnualSS: form.retireeAnnualSS,
    spouseAnnualSS: form.hasSpouse ? form.spouseAnnualSS : null,
    otherAnnualIncome: form.otherAnnualIncome,
    otherIncomeStartAge: form.otherIncomeStartAge,
    windfalls: form.windfalls,
    oneTimeExpenses: form.oneTimeExpenses,
    socialSecurityColaRate: form.socialSecurityColaPercent / 100,
    modelSsBenefitCutFrom2032: form.modelSsBenefitCutFrom2032,
    survivorExpensePercent: form.survivorExpensePercent,
    survivorSSMode: form.survivorSSMode,
    customSurvivorAnnualSS:
      form.survivorSSMode === 'custom' ? form.customSurvivorAnnualSS : null,
    useSpendingGuardrails: form.useSpendingGuardrails,
    projectionCadence: form.projectionCadence,
  }
}
