import { describe, expect, it } from 'vitest'
import {
  defaultFormState,
  validateAcaMarketplacePlanner,
  validatePortfolioAccountMix,
} from './form'

describe('validatePortfolioAccountMix', () => {
  it('accepts default allocation summing to 100', () => {
    const form = defaultFormState(2026)
    expect(validatePortfolioAccountMix(form)).toEqual([])
  })

  it('rejects when buckets do not sum to 100%', () => {
    const form = { ...defaultFormState(2026), portfolioTaxDeferredPercent: 50, portfolioRothPercent: 50 }
    const issues = validatePortfolioAccountMix(form)
    expect(issues.some((i) => i.field === 'portfolioAccountMix')).toBe(true)
  })
})

describe('validateAcaMarketplacePlanner', () => {
  it('accepts defaults', () => {
    expect(validateAcaMarketplacePlanner(defaultFormState(2026))).toEqual([])
  })

  it('rejects invalid household size', () => {
    const form = { ...defaultFormState(2026), acaMarketplaceHouseholdSize: 0 }
    const issues = validateAcaMarketplacePlanner(form)
    expect(issues.some((i) => i.field === 'acaMarketplaceHouseholdSize')).toBe(true)
  })

  it('rejects negative MAGI when set', () => {
    const form = { ...defaultFormState(2026), acaMarketplaceMagiEstimate: -1 }
    const issues = validateAcaMarketplacePlanner(form)
    expect(issues.some((i) => i.field === 'acaMarketplaceMagiEstimate')).toBe(true)
  })
})
