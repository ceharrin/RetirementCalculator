import {
  clampSsClaimAge,
  DEFAULT_SPENDING_DECLINE_ANNUAL_RATE,
  DEFAULT_SPENDING_DECLINE_START_AGE,
  DEFAULT_SS_COLA_RATE,
  type ProjectionCadence,
  type SimulationInput,
  type SurvivorSSMode,
} from '../lib/simulateRetirement'

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
    socialSecurityColaPercent: DEFAULT_SS_COLA_RATE * 100,
    modelSsBenefitCutFrom2032: false,
    survivorExpensePercent: 75,
    survivorSSMode: 'higherOfTwo',
    customSurvivorAnnualSS: 30_000,
    projectionCadence: 'annual',
    useSpendingGuardrails: false,
  }
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
