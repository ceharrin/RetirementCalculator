import { describe, expect, it } from 'vitest'
import {
  adjustSpendingForDecision,
  DEFAULT_GUARDRAIL_BAND,
  guardrailDecision,
  withdrawalRate,
} from './retirementGuardrails'

describe('withdrawalRate', () => {
  it('divides withdrawal by portfolio', () => {
    expect(withdrawalRate(40_000, 1_000_000)).toBeCloseTo(0.04, 6)
  })

  it('returns infinity when portfolio is non-positive', () => {
    expect(withdrawalRate(1, 0)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('guardrailDecision', () => {
  const initial = 0.04
  const band = DEFAULT_GUARDRAIL_BAND

  it('increases when current rate is at or below lower trigger (prosperity)', () => {
    expect(guardrailDecision(0.031, initial, band)).toBe('increase')
    expect(guardrailDecision(0.032, initial, band)).toBe('increase')
    expect(guardrailDecision(0.033, initial, band)).toBe('hold')
  })

  it('decreases when current rate is at or above upper trigger (preservation)', () => {
    expect(guardrailDecision(0.047, initial, band)).toBe('hold')
    expect(guardrailDecision(0.048, initial, band)).toBe('decrease')
    expect(guardrailDecision(0.05, initial, band)).toBe('decrease')
  })

  it('holds in the middle band', () => {
    expect(guardrailDecision(0.04, initial, band)).toBe('hold')
    expect(guardrailDecision(0.035, initial, band)).toBe('hold')
  })
})

describe('adjustSpendingForDecision', () => {
  it('applies ±10% by default pattern', () => {
    expect(adjustSpendingForDecision(100_000, 'increase', 0.1)).toBeCloseTo(110_000, 5)
    expect(adjustSpendingForDecision(100_000, 'decrease', 0.1)).toBeCloseTo(90_000, 5)
    expect(adjustSpendingForDecision(100_000, 'hold', 0.1)).toBe(100_000)
  })
})
