import { describe, expect, it } from 'vitest'
import { parseMoneyInputToDollars } from './parseMoneyInput'

describe('parseMoneyInputToDollars', () => {
  it('parses US-style thousands and cents', () => {
    expect(parseMoneyInputToDollars('$32,592.00')).toBe(32_592)
    expect(parseMoneyInputToDollars('32,592.00')).toBe(32_592)
    expect(parseMoneyInputToDollars('32,592')).toBe(32_592)
  })

  it('does not treat cents digits as extra thousands', () => {
    expect(parseMoneyInputToDollars('$32,592.00')).not.toBe(3_259_200)
  })

  it('rounds fractional dollars', () => {
    expect(parseMoneyInputToDollars('100.50')).toBe(101)
    expect(parseMoneyInputToDollars('100.49')).toBe(100)
  })

  it('parses European-style when comma is the decimal separator', () => {
    expect(parseMoneyInputToDollars('32.592,00')).toBe(32_592)
    expect(parseMoneyInputToDollars('1.234,56')).toBe(1235)
  })

  it('handles empty and plain integers', () => {
    expect(parseMoneyInputToDollars('')).toBe(0)
    expect(parseMoneyInputToDollars('500000')).toBe(500_000)
  })

  it('parses multiple US thousands groups without a decimal point', () => {
    expect(parseMoneyInputToDollars('1,234,567')).toBe(1_234_567)
  })
})
