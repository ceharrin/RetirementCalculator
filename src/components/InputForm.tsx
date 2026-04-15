import { useState } from 'react'
import type { FormState } from '../types/form'
import type { ValidationIssue } from '../lib/simulateRetirement'
import { parseMoneyInputToDollars } from '../lib/parseMoneyInput'
import {
  DEFAULT_GUARDRAIL_BAND,
  DEFAULT_GUARDRAIL_SPENDING_STEP,
} from '../lib/retirementGuardrails'
import {
  DEFAULT_INFLATION_RATE,
  DEFAULT_PORTFOLIO_RETURN,
  DEFAULT_SPENDING_DECLINE_ANNUAL_RATE,
  DEFAULT_SPENDING_DECLINE_START_AGE,
  DEFAULT_SS_CLAIM_AGE,
  DEFAULT_SS_COLA_RATE,
  SS_CLAIM_AGE_MAX,
  SS_CLAIM_AGE_MIN,
  SS_CLAIM_AGE_OPTIONS,
  SS_TRUST_FUND_CUT_START_YEAR,
  type WindfallInput,
} from '../lib/simulateRetirement'

type Patch<K extends keyof FormState> = Pick<FormState, K>

interface InputFormProps {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  onApplyHistoricalDefaults: () => void
  validationIssues: ValidationIssue[]
}

function fieldError(issues: ValidationIssue[], field: string): string | undefined {
  return issues.find((i) => i.field === field)?.message
}

const sectionTitle =
  'mb-2 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300'
const gridGap =
  'grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch'
/** Keeps labels + inputs aligned across grid columns (wrap + missing hints). */
const labelSlotClass =
  'flex min-h-10 items-end text-xs font-bold leading-tight text-slate-900 dark:text-slate-100'
const hintSlotClass = 'min-h-9 space-y-0.5 text-[11px] leading-snug'
const inputClass =
  'input-number-clean box-border min-h-9 w-full min-w-0 rounded-md border border-indigo-200/90 bg-white px-2.5 py-2 text-right text-sm tabular-nums text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 disabled:opacity-50 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100'

function formatMoneyInteger(n: number): string {
  if (!Number.isFinite(n)) return ''
  return Math.trunc(n).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function clampInteger(n: number, min?: number, max?: number): number {
  let x = Math.trunc(n)
  if (min !== undefined) x = Math.max(min, x)
  if (max !== undefined) x = Math.min(max, x)
  return x
}

function MoneyField(props: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  hint?: string
  error?: string
  disabled?: boolean
}) {
  const { id, label, value, onChange, min, max, hint, error, disabled } = props
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : '']
    .filter(Boolean)
    .join(' ') || undefined

  const [editingText, setEditingText] = useState<string | null>(null)
  const displayValue = editingText !== null ? editingText : formatMoneyInteger(value)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
      <div className={labelSlotClass}>
        <label htmlFor={id} className="block w-full">
          {label}
        </label>
      </div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={displayValue}
        onFocus={() => setEditingText(formatMoneyInteger(value))}
        onChange={(e) => {
          const s = e.target.value
          setEditingText(s)
          onChange(clampInteger(parseMoneyInputToDollars(s), min, max))
        }}
        onBlur={() => setEditingText(null)}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <div className={hintSlotClass}>
        {hint ? (
          <p id={`${id}-hint`} className="text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-err`} className="text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function NumField(props: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  error?: string
  disabled?: boolean
}) {
  const { id, label, value, onChange, min, max, step, hint, error, disabled } = props
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : '']
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
      <div className={labelSlotClass}>
        <label htmlFor={id} className="block w-full">
          {label}
        </label>
      </div>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        disabled={disabled}
        min={min}
        max={max}
        step={step ?? 1}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <div className={hintSlotClass}>
        {hint ? (
          <p id={`${id}-hint`} className="text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-err`} className="text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SsClaimAgeField(props: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  error?: string
}) {
  const { id, label, value, onChange, error } = props
  const describedBy = [error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
      <div className={labelSlotClass}>
        <label htmlFor={id} className="block w-full">
          {label}{' '}
          <span className="font-normal text-slate-500 dark:text-slate-400">
            ({SS_CLAIM_AGE_MIN}–{SS_CLAIM_AGE_MAX})
          </span>
        </label>
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="box-border min-h-9 w-full min-w-0 cursor-pointer rounded-md border border-indigo-200/90 bg-white px-2.5 py-2 text-right text-sm tabular-nums text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        {SS_CLAIM_AGE_OPTIONS.map((age) => (
          <option key={age} value={age}>
            {age}
          </option>
        ))}
      </select>
      <div className={hintSlotClass}>
        {error ? (
          <p id={`${id}-err`} className="text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function InputForm({
  form,
  onChange,
  onApplyHistoricalDefaults,
  validationIssues,
}: InputFormProps) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onChange({ [key]: value } as Patch<K>)
  const addWindfall = () =>
    set('windfalls', [
      ...form.windfalls,
      {
        title: `Windfall ${form.windfalls.length + 1}`,
        amount: 0,
        startAge: form.retireeRetirementAge,
      },
    ])
  const updateWindfall = (idx: number, patch: Partial<WindfallInput>) =>
    set(
      'windfalls',
      form.windfalls.map((w, i) => (i === idx ? { ...w, ...patch } : w)),
    )
  const removeWindfall = (idx: number) =>
    set(
      'windfalls',
      form.windfalls.filter((_, i) => i !== idx),
    )

  return (
    <form className="text-left" onSubmit={(e) => e.preventDefault()}>
      <article className="overflow-hidden rounded-xl border border-indigo-200/70 bg-white shadow-md shadow-indigo-100/30 dark:border-indigo-800/50 dark:bg-slate-900 dark:shadow-indigo-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/60 bg-gradient-to-r from-indigo-50/95 to-violet-50/90 px-3 py-2.5 dark:border-indigo-800/50 dark:from-indigo-950/60 dark:to-violet-950/50">
          <h2 className="text-base font-bold text-indigo-900 dark:text-indigo-100">Assumptions</h2>
          <button
            type="button"
            onClick={() => {
              ;(document.activeElement as HTMLElement | null)?.blur?.()
              onApplyHistoricalDefaults()
            }}
            className="shrink-0 rounded-md border border-indigo-300/80 bg-white px-3 py-1.5 text-xs font-medium text-indigo-900 hover:bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:bg-indigo-900/60"
          >
            Apply historical defaults
          </button>
        </div>
        <p className="border-b border-indigo-100/90 px-3 py-2 text-[11px] leading-snug text-slate-600 dark:border-indigo-900/40 dark:text-slate-400">
          Defaults: ~{(DEFAULT_INFLATION_RATE * 100).toFixed(1)}% inflation, ~{(DEFAULT_PORTFOLIO_RETURN * 100).toFixed(1)}% return, SS claim {DEFAULT_SS_CLAIM_AGE}, SS COLA ~{(DEFAULT_SS_COLA_RATE * 100).toFixed(1)}%, real spending decline from age {DEFAULT_SPENDING_DECLINE_START_AGE} at ~{(DEFAULT_SPENDING_DECLINE_ANNUAL_RATE * 100).toFixed(0)}%/yr. Illustrative only.
        </p>

        <section className="border-b border-indigo-100/90 px-3 py-3 dark:border-indigo-900/40">
          <h3 className={sectionTitle}>Household & longevity</h3>
          <div className={gridGap}>
            <NumField
              id="startYear"
              label="Planning start year"
              value={form.startYear}
              onChange={(n) => set('startYear', n)}
              min={2000}
              max={2100}
              error={fieldError(validationIssues, 'startYear')}
              hint="First projection row uses this calendar year."
            />
            <div className="sm:col-span-2 lg:col-span-3">
              <div className={labelSlotClass}>
                <span className="block w-full">Projection timing</span>
              </div>
              <fieldset className="flex min-h-9 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <legend className="sr-only">Projection timing</legend>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="projectionCadence"
                    checked={form.projectionCadence === 'annual'}
                    onChange={() => set('projectionCadence', 'annual')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Annual
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="projectionCadence"
                    checked={form.projectionCadence === 'monthly'}
                    onChange={() => set('projectionCadence', 'monthly')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  Monthly
                </label>
              </fieldset>
              <div className={hintSlotClass}>
                <p className="text-slate-500 dark:text-slate-400">
                  Annual: one portfolio return and withdrawal per year. Monthly: twelve substeps using
                  (1 + annual return)<sup>1/12</sup> − 1 per month; spending and Social Security are
                  spread evenly within each year.
                </p>
              </div>
            </div>
            <NumField
              id="retireeCurrentAge"
              label="Retiree current age"
              value={form.retireeCurrentAge}
              onChange={(n) => set('retireeCurrentAge', n)}
              min={18}
              max={120}
              error={fieldError(validationIssues, 'retireeCurrentAge')}
            />
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <div className={labelSlotClass}>
                <span className="block w-full">Household</span>
              </div>
              <div className="flex min-h-9 items-center gap-2">
                <input
                  id="hasSpouse"
                  type="checkbox"
                  checked={form.hasSpouse}
                  onChange={(e) => set('hasSpouse', e.target.checked)}
                  className="size-3.5 shrink-0 rounded border-indigo-400 text-indigo-600 focus:ring-violet-500 dark:border-indigo-500"
                />
                <label htmlFor="hasSpouse" className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Include spouse
                </label>
              </div>
              <div className={hintSlotClass}>
                {fieldError(validationIssues, 'spouse') ? (
                  <p className="text-red-600 dark:text-red-400" role="alert">
                    {fieldError(validationIssues, 'spouse')}
                  </p>
                ) : null}
              </div>
            </div>
            {form.hasSpouse ? (
              <NumField
                id="spouseCurrentAge"
                label="Spouse current age"
                value={form.spouseCurrentAge}
                onChange={(n) => set('spouseCurrentAge', n)}
                min={18}
                max={120}
              />
            ) : null}
            <NumField
              id="retireeDeathAge"
              label="Retiree age at death"
              value={form.retireeDeathAge}
              onChange={(n) => set('retireeDeathAge', n)}
              min={form.retireeCurrentAge + 1}
              max={120}
              error={fieldError(validationIssues, 'retireeDeathAge')}
              hint="Plan runs through the last year either of you is modeled as living."
            />
            {form.hasSpouse ? (
              <NumField
                id="spouseDeathAge"
                label="Spouse age at death"
                value={form.spouseDeathAge}
                onChange={(n) => set('spouseDeathAge', n)}
                min={form.spouseCurrentAge + 1}
                max={120}
                error={fieldError(validationIssues, 'spouseDeathAge')}
              />
            ) : null}
          </div>
        </section>

        <section className="border-b border-indigo-100/90 px-3 py-3 dark:border-indigo-900/40">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className={sectionTitle}>Windfalls</h3>
            <button
              type="button"
              onClick={addWindfall}
              className="rounded-md border border-indigo-300/80 bg-white px-3 py-1.5 text-xs font-medium text-indigo-900 hover:bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:bg-indigo-900/60"
            >
              Add windfall
            </button>
          </div>
          <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            One-time future amounts (cash or assets) that are invested into the portfolio in that
            year.
          </p>
          {fieldError(validationIssues, 'windfalls') ? (
            <p className="mb-2 text-[11px] text-red-600 dark:text-red-400" role="alert">
              {fieldError(validationIssues, 'windfalls')}
            </p>
          ) : null}
          {form.windfalls.length === 0 ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">No windfalls added.</p>
          ) : (
            <div className="space-y-2">
              {form.windfalls.map((w, idx) => (
                <div
                  key={`windfall-${idx}`}
                  className="rounded-lg border border-indigo-100/80 p-2 dark:border-indigo-800/50"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
                    <div className="sm:col-span-5">
                      <label
                        htmlFor={`windfall-title-${idx}`}
                        className="mb-1 block text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Title
                      </label>
                      <input
                        id={`windfall-title-${idx}`}
                        type="text"
                        value={w.title}
                        onChange={(e) => updateWindfall(idx, { title: e.target.value })}
                        className="box-border min-h-9 w-full min-w-0 rounded-md border border-indigo-200/90 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label
                        htmlFor={`windfall-amount-${idx}`}
                        className="mb-1 block text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Amount ($)
                      </label>
                      <input
                        id={`windfall-amount-${idx}`}
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInteger(w.amount)}
                        onChange={(e) =>
                          updateWindfall(idx, {
                            amount: clampInteger(parseMoneyInputToDollars(e.target.value), 0),
                          })
                        }
                        className="box-border min-h-9 w-full min-w-0 rounded-md border border-indigo-200/90 bg-white px-2.5 py-1.5 text-right text-sm tabular-nums text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={`windfall-age-${idx}`}
                        className="mb-1 block text-[11px] font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Age
                      </label>
                      <input
                        id={`windfall-age-${idx}`}
                        type="number"
                        inputMode="numeric"
                        min={18}
                        max={120}
                        value={w.startAge}
                        onChange={(e) => updateWindfall(idx, { startAge: Number(e.target.value) })}
                        className="box-border min-h-9 w-full min-w-0 rounded-md border border-indigo-200/90 bg-white px-2.5 py-1.5 text-right text-sm tabular-nums text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => removeWindfall(idx)}
                        className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-red-300/80 bg-white px-3 py-1.5 text-center text-xs font-medium leading-none text-red-700 hover:bg-red-50 dark:border-red-700/70 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border-b border-indigo-100/90 px-3 py-3 dark:border-indigo-900/40">
          <h3 className={sectionTitle}>Retirement spending & portfolio</h3>
          <div className={gridGap}>
            <NumField
              id="retireeRetirementAge"
              label="Retiree retirement age"
              value={form.retireeRetirementAge}
              onChange={(n) => set('retireeRetirementAge', n)}
              min={form.retireeCurrentAge}
              max={120}
              error={fieldError(validationIssues, 'retireeRetirementAge')}
              hint="Withdrawals for living expenses start this year."
            />
            <MoneyField
              id="annualExpenseAtRetirementStart"
              label="Annual retirement expenses ($)"
              value={form.annualExpenseAtRetirementStart}
              onChange={(n) => set('annualExpenseAtRetirementStart', n)}
              min={0}
              error={fieldError(validationIssues, 'annualExpenseAtRetirementStart')}
              hint="Inflation applies each year; real decline can apply from the age below."
            />
            <NumField
              id="spendingDeclineStartAge"
              label="Real spending decline starts (age)"
              value={form.spendingDeclineStartAge}
              onChange={(n) => set('spendingDeclineStartAge', n)}
              min={55}
              max={100}
              error={fieldError(validationIssues, 'spendingDeclineStartAge')}
              hint={`Often ~${DEFAULT_SPENDING_DECLINE_START_AGE} (go-go → slow-go). Uses retiree age, or spouse if sole survivor.`}
            />
            <NumField
              id="spendingDeclinePercent"
              label="Annual real spending decline (%)"
              value={form.spendingDeclinePercent}
              onChange={(n) => set('spendingDeclinePercent', n)}
              min={0}
              max={5}
              step={0.1}
              error={fieldError(validationIssues, 'spendingDeclineAnnualRate')}
              hint={`After start age, ~${(DEFAULT_SPENDING_DECLINE_ANNUAL_RATE * 100).toFixed(0)}%/yr matches common research; 0% = off.`}
            />
            <MoneyField
              id="currentSavings"
              label="Current retirement savings ($)"
              value={form.currentSavings}
              onChange={(n) => set('currentSavings', n)}
              min={0}
              error={fieldError(validationIssues, 'currentSavings')}
            />
            <NumField
              id="portfolioReturnPercent"
              label="Annual portfolio return (%)"
              value={form.portfolioReturnPercent}
              onChange={(n) => set('portfolioReturnPercent', n)}
              min={-20}
              max={30}
              step={0.1}
              error={fieldError(validationIssues, 'portfolioReturn')}
              hint="Nominal, same each year."
            />
            <NumField
              id="inflationPercent"
              label="Annual inflation (%)"
              value={form.inflationPercent}
              onChange={(n) => set('inflationPercent', n)}
              min={-10}
              max={25}
              step={0.1}
              error={fieldError(validationIssues, 'inflationRate')}
              hint="Applied to expenses every year; decline is real, on top of this."
            />
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <div className={labelSlotClass}>
                <span className="block w-full">Spending guardrails</span>
              </div>
              <div className="flex min-h-9 items-start gap-2">
                <input
                  id="useSpendingGuardrails"
                  type="checkbox"
                  checked={form.useSpendingGuardrails}
                  onChange={(e) => set('useSpendingGuardrails', e.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 rounded border-indigo-400 text-indigo-600 focus:ring-violet-500 dark:border-indigo-500"
                />
                <label
                  htmlFor="useSpendingGuardrails"
                  className="cursor-pointer text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  Guyton–Klinger-style guardrails
                </label>
              </div>
              <div className={hintSlotClass}>
                <p className="text-slate-500 dark:text-slate-400">
                  First retirement year sets an anchor withdrawal rate (vs portfolio after return).
                  Later years raise or lower nominal spending by {(DEFAULT_GUARDRAIL_SPENDING_STEP * 100).toFixed(0)}% if
                  the planned rate moves outside ±{(DEFAULT_GUARDRAIL_BAND * 100).toFixed(0)}% of that anchor.
                  Illustrative only.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-indigo-100/90 px-3 py-3 dark:border-indigo-900/40">
          <h3 className={sectionTitle}>Social Security</h3>
          <p className="mb-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Your estimated annual benefits at the ages you select (not official SSA amounts).
          </p>
          <div className="mb-3 flex items-start gap-2">
            <input
              id="modelSsBenefitCutFrom2032"
              type="checkbox"
              checked={form.modelSsBenefitCutFrom2032}
              onChange={(e) => set('modelSsBenefitCutFrom2032', e.target.checked)}
              className="mt-0.5 size-3.5 shrink-0 rounded border-indigo-400 text-indigo-600 focus:ring-violet-500 dark:border-indigo-500"
            />
            <label
              htmlFor="modelSsBenefitCutFrom2032"
              className="cursor-pointer text-[11px] leading-snug text-slate-700 dark:text-slate-300"
            >
              Model a 23% benefit reduction starting in {SS_TRUST_FUND_CUT_START_YEAR} (trust-fund
              shortfall scenario). Retiree, spouse, and custom survivor amounts above are reduced in
              the projection from that year onward.
            </label>
          </div>
          <div className="mb-3 max-w-xs">
            <NumField
              id="socialSecurityColaPercent"
              label="Annual SS COLA (%)"
              value={form.socialSecurityColaPercent}
              onChange={(n) => set('socialSecurityColaPercent', n)}
              min={-5}
              max={15}
              step={0.1}
              error={fieldError(validationIssues, 'socialSecurityColaRate')}
              hint={`Default ~${(DEFAULT_SS_COLA_RATE * 100).toFixed(1)}% reflects long-run SSA COLA history (varies every year).`}
            />
          </div>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
            <SsClaimAgeField
              id="retireeClaimAge"
              label="Retiree claim age"
              value={form.retireeClaimAge}
              onChange={(n) => set('retireeClaimAge', n)}
              error={fieldError(validationIssues, 'retireeClaimAge')}
            />
            <MoneyField
              id="retireeAnnualSS"
              label="Retiree annual benefit ($)"
              value={form.retireeAnnualSS}
              onChange={(n) => set('retireeAnnualSS', n)}
              min={0}
              error={fieldError(validationIssues, 'socialSecurity')}
            />
            {form.hasSpouse ? (
              <>
                <SsClaimAgeField
                  id="spouseClaimAge"
                  label="Spouse claim age"
                  value={form.spouseClaimAge}
                  onChange={(n) => set('spouseClaimAge', n)}
                  error={fieldError(validationIssues, 'spouseClaimAge')}
                />
                <MoneyField
                  id="spouseAnnualSS"
                  label="Spouse annual benefit ($)"
                  value={form.spouseAnnualSS}
                  onChange={(n) => set('spouseAnnualSS', n)}
                  min={0}
                />
              </>
            ) : null}
            <MoneyField
              id="otherAnnualIncome"
              label="Other annual income ($)"
              value={form.otherAnnualIncome}
              onChange={(n) => set('otherAnnualIncome', n)}
              min={0}
              error={fieldError(validationIssues, 'otherAnnualIncome')}
              hint="Additional household income beyond Social Security."
            />
            <NumField
              id="otherIncomeStartAge"
              label="Other income starts (retiree age)"
              value={form.otherIncomeStartAge}
              onChange={(n) => set('otherIncomeStartAge', n)}
              min={18}
              max={120}
              error={fieldError(validationIssues, 'otherIncomeStartAge')}
              hint="If earlier than current age, income starts immediately."
            />
          </div>
        </section>

        {form.hasSpouse ? (
          <section className="px-3 py-3">
            <h3 className={sectionTitle}>After first death</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-stretch">
              <NumField
                id="survivorExpensePercent"
                label="Survivor expenses (% of joint)"
                value={form.survivorExpensePercent}
                onChange={(n) => set('survivorExpensePercent', n)}
                min={10}
                max={150}
                error={fieldError(validationIssues, 'survivorExpensePercent')}
                hint="Often ~70–80% of joint spending."
              />
              <fieldset className="sm:col-span-2">
                <legend className="mb-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  Survivor Social Security
                </legend>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="survivorSS"
                      checked={form.survivorSSMode === 'higherOfTwo'}
                      onChange={() => set('survivorSSMode', 'higherOfTwo')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Higher of two benefits
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="survivorSS"
                      checked={form.survivorSSMode === 'custom'}
                      onChange={() => set('survivorSSMode', 'custom')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Custom annual benefit
                  </label>
                </div>
                {form.survivorSSMode === 'custom' ? (
                  <div className="mt-2 max-w-md">
                    <MoneyField
                      id="customSurvivorAnnualSS"
                      label="Custom survivor benefit ($)"
                      value={form.customSurvivorAnnualSS}
                      onChange={(n) => set('customSurvivorAnnualSS', n)}
                      min={0}
                      error={fieldError(validationIssues, 'customSurvivorAnnualSS')}
                    />
                  </div>
                ) : null}
              </fieldset>
            </div>
          </section>
        ) : null}
      </article>
    </form>
  )
}
