/**
 * Public reference values for ACA marketplace premium tax credits (PTC) vs
 * household income as a share of the federal poverty level (FPL).
 *
 * Sources (URLs in `ACA_REFERENCE_LINKS`):
 * - HHS: annual FPL dollar amounts by household size (used with MAGI to compute % of FPL).
 * - IRS: Form 8962 “Table 2 — Applicable Figure” (max share of household income applied toward
 *   the benchmark second lowest–cost silver plan before the credit fills the gap—simplified).
 *
 * This module does not compute actual premiums or credits; it only holds cited constants for UI.
 */

/** 2026 HHS poverty guidelines: annual dollars, 48 contiguous states and D.C., household sizes 1–8. */
export const FPL_ANNUAL_2026_CONTIGUOUS_48: readonly number[] = [
  15_960, 21_640, 27_320, 33_000, 38_680, 44_360, 50_040, 55_720,
] as const

/** Add for each person beyond 8 (2026 contiguous guidelines). */
export const FPL_EXTRA_PERSON_2026_CONTIGUOUS_48 = 5_680

export function fplAnnualDollars2026Contiguous(persons: number): number | null {
  if (!Number.isInteger(persons) || persons < 1) return null
  if (persons <= 8) return FPL_ANNUAL_2026_CONTIGUOUS_48[persons - 1]
  return FPL_ANNUAL_2026_CONTIGUOUS_48[7] + (persons - 8) * FPL_EXTRA_PERSON_2026_CONTIGUOUS_48
}

/**
 * IRS Form 8962 Table 2 “Applicable figure” at selected household-income-%FPL breakpoints.
 * Values are decimals of household income (e.g. 0.02 = 2%). From Instructions for Form 8962 (2025).
 * Updated by IRS annually—see current-year instructions for reconciliation/credits.
 */
export const PTC_APPLICABLE_FIGURE_HIGHLIGHTS_TY2025: readonly {
  label: string
  fplPercent: number
  /** Decimal of annual household income (Form 8962 line 7 style). */
  applicableFigure: number
}[] = [
  { label: 'At or below 150% FPL', fplPercent: 150, applicableFigure: 0 },
  { label: '200% FPL', fplPercent: 200, applicableFigure: 0.02 },
  { label: '250% FPL', fplPercent: 250, applicableFigure: 0.04 },
  { label: '300% FPL', fplPercent: 300, applicableFigure: 0.06 },
  { label: '350% FPL', fplPercent: 350, applicableFigure: 0.0725 },
  { label: '399% FPL', fplPercent: 399, applicableFigure: 0.0848 },
  { label: '400% FPL and above', fplPercent: 400, applicableFigure: 0.085 },
] as const

export const ACA_REFERENCE_LINKS = {
  hhsPovertyGuidelines2026:
    'https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines',
  healthcareGovFpl: 'https://www.healthcare.gov/glossary/federal-poverty-level-fpl/',
  irsForm8962Instructions: 'https://www.irs.gov/instructions/i8962',
  irsPublication974: 'https://www.irs.gov/publications/p974',
} as const

export function formatUsd0(n: number): string {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function formatPercentFromDecimal(d: number): string {
  return `${(d * 100).toFixed(2).replace(/\.?0+$/, '')}%`
}
