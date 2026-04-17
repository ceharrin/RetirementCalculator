import { describe, expect, it } from 'vitest'
import { fplAnnualDollars2026Contiguous, FPL_ANNUAL_2026_CONTIGUOUS_48 } from './acaPremiumSubsidyReference'

describe('fplAnnualDollars2026Contiguous', () => {
  it('matches published 2026 contiguous guidelines for sizes 1–4', () => {
    expect(FPL_ANNUAL_2026_CONTIGUOUS_48[0]).toBe(15_960)
    expect(FPL_ANNUAL_2026_CONTIGUOUS_48[1]).toBe(21_640)
    expect(FPL_ANNUAL_2026_CONTIGUOUS_48[2]).toBe(27_320)
    expect(FPL_ANNUAL_2026_CONTIGUOUS_48[3]).toBe(33_000)
  })

  it('extends past 8 with the published increment', () => {
    expect(fplAnnualDollars2026Contiguous(9)).toBe(55_720 + 5_680)
  })

  it('returns null for invalid household size', () => {
    expect(fplAnnualDollars2026Contiguous(0)).toBeNull()
    expect(fplAnnualDollars2026Contiguous(1.5 as unknown as number)).toBeNull()
  })
})
