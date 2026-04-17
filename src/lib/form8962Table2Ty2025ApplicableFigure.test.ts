import { describe, expect, it } from 'vitest'
import {
  applicableFigureForm8962Ty2025,
  FORM8962_TABLE2_TY2025_LINE7_BY_LINE5,
} from './form8962Table2Ty2025ApplicableFigure'

describe('FORM8962_TABLE2_TY2025_LINE7_BY_LINE5', () => {
  it('has one entry per whole percent 0–400', () => {
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5).toHaveLength(401)
  })

  it('matches IRS Table 2 spot checks (Instructions for Form 8962, 2025)', () => {
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[150]).toBe(0)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[200]).toBe(0.02)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[250]).toBe(0.04)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[300]).toBe(0.06)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[350]).toBe(0.0725)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[399]).toBe(0.0848)
    expect(FORM8962_TABLE2_TY2025_LINE7_BY_LINE5[400]).toBe(0.085)
  })
})

describe('applicableFigureForm8962Ty2025', () => {
  it('returns 0.085 for 400% and above', () => {
    expect(applicableFigureForm8962Ty2025(400)).toBe(0.085)
    expect(applicableFigureForm8962Ty2025(900)).toBe(0.085)
  })

  it('floors non-integer input', () => {
    expect(applicableFigureForm8962Ty2025(200.9)).toBe(0.02)
  })
})
