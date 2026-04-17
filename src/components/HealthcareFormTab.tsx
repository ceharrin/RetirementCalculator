import { useMemo } from 'react'
import type { FormState } from '../types/form'
import type { ValidationIssue } from '../lib/simulateRetirement'
import {
  fplAnnualDollars2026Contiguous,
  formatPercentFromDecimal,
  formatUsd0,
} from '../lib/acaPremiumSubsidyReference'
import { applicableFigureForm8962Ty2025 } from '../lib/form8962Table2Ty2025ApplicableFigure'
import { AcaSubsidyReferencePanel } from './AcaSubsidyReferencePanel'

const labelClass =
  'flex min-h-9 items-end text-xs font-bold leading-tight text-slate-900 dark:text-slate-100'
const hintClass = 'min-h-8 space-y-0.5 text-[11px] leading-snug'
const inputClass =
  'input-number-clean box-border min-h-8 w-full min-w-0 rounded-md border border-indigo-200/90 bg-white px-2.5 py-1.5 text-right text-sm tabular-nums text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/35 dark:border-indigo-700/70 dark:bg-slate-900 dark:text-slate-100'

function fieldError(issues: ValidationIssue[], field: string): string | undefined {
  return issues.find((i) => i.field === field)?.message
}

interface HealthcareFormTabProps {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  validationIssues: ValidationIssue[]
  /** When set with `onRunProjection`, shows a Run projection control on this tab. */
  canRunProjection?: boolean
  onRunProjection?: () => void
}

function clampInteger(n: number, min?: number, max?: number): number {
  let x = Math.trunc(n)
  if (min !== undefined) x = Math.max(min, x)
  if (max !== undefined) x = Math.min(max, x)
  return x
}

function IntegerField(props: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  hint?: string
  error?: string
}) {
  const { id, label, value, onChange, min, max, hint, error } = props
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : '']
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
      <div className={labelClass}>
        <label htmlFor={id} className="block w-full">
          {label}
        </label>
      </div>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (!Number.isFinite(v)) return
          onChange(clampInteger(v, min, max))
        }}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <div className={hintClass}>
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

function PercentField(props: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
  error?: string
}) {
  const { id, label, value, onChange, min, max, step, hint, error } = props
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : '']
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
      <div className={labelClass}>
        <label htmlFor={id} className="block w-full">
          {label}
        </label>
      </div>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step ?? 1}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <div className={hintClass}>
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

export function HealthcareFormTab({
  form,
  onChange,
  validationIssues,
  canRunProjection = false,
  onRunProjection,
}: HealthcareFormTabProps) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onChange({ [key]: value } as Partial<FormState>)
  const mixSum =
    form.portfolioTaxDeferredPercent +
    form.portfolioRothPercent +
    form.portfolioTaxablePercent +
    form.portfolioHsaPercent
  const mixError = fieldError(validationIssues, 'portfolioAccountMix')
  const sumMismatch = Number.isFinite(mixSum) && Math.abs(mixSum - 100) > 0.01

  const acaDerived = useMemo(() => {
    const fpl = fplAnnualDollars2026Contiguous(form.acaMarketplaceHouseholdSize)
    const magi = form.acaMarketplaceMagiEstimate
    if (fpl == null || magi === null || !Number.isFinite(magi) || magi < 0 || fpl <= 0) {
      return { fpl, magi, pctOfFpl: null as number | null, line5Floor: null as number | null, figure: null as number | null, capDollars: null as number | null }
    }
    const pctOfFpl = (magi / fpl) * 100
    const line5Floor = Math.max(0, Math.floor((magi / fpl) * 100))
    const figure = applicableFigureForm8962Ty2025(line5Floor)
    const capDollars = magi * figure
    return { fpl, magi, pctOfFpl, line5Floor, figure, capDollars }
  }, [form.acaMarketplaceHouseholdSize, form.acaMarketplaceMagiEstimate])

  const magiFieldError = fieldError(validationIssues, 'acaMarketplaceMagiEstimate')
  const magiAriaDescribedBy = ['aca-magi-hint', magiFieldError ? 'aca-magi-err' : ''].filter(Boolean).join(' ')

  return (
    <div className="px-3 py-4">
      <h2 className="text-base font-bold text-indigo-900 dark:text-indigo-100">Healthcare</h2>
      <p className="mt-2 rounded-md border border-amber-200/90 bg-amber-50/90 px-2.5 py-2 text-[11px] leading-snug text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
        <strong className="font-semibold">Separate from the portfolio model.</strong> The retirement projection
        on the Assumptions tab (and <strong className="font-semibold">Run projection</strong> below) uses savings,
        spending, and return assumptions only. Nothing on this tab changes those numbers yet—this area is for
        understanding and eventually modeling <strong className="font-semibold">MAGI</strong> against ACA
        marketplace rules.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        Before age 65, many retirees buy coverage through the public exchange; premiums and cost-sharing
        subsidies depend on <strong className="font-semibold text-slate-900 dark:text-slate-100">MAGI</strong>{' '}
        (Modified Adjusted Gross Income), not your total cash flow. Many people aim to keep MAGI within certain
        percentages of the <strong className="font-semibold text-slate-900 dark:text-slate-100">federal poverty
        level</strong> so advance premium tax credits stay larger. Only certain items count toward MAGI—for
        example, traditional IRA/401(k) withdrawals usually increase it, while Roth qualified withdrawals often do
        not; taxable investment sales count toward MAGI to the extent of taxable gain, not necessarily the full
        sale proceeds.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        At <strong className="font-semibold text-slate-900 dark:text-slate-100">Medicare</strong>{' '}
        eligibility (typically 65), Parts B and D and supplemental choices replace exchange
        coverage for most people; higher income can trigger IRMAA surcharges. Couples and survivor
        years add more moving parts.
      </p>

      <section className="mt-5 rounded-lg border border-indigo-200/70 bg-white/90 px-3 py-3 dark:border-indigo-800/50 dark:bg-slate-900/60">
        <h3 className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-200">
          Your household and MAGI vs 2026 FPL
        </h3>
        <p className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          Compare estimated <strong className="font-semibold text-slate-800 dark:text-slate-200">household MAGI</strong>{' '}
          to <strong className="font-semibold text-slate-800 dark:text-slate-200">2026 HHS federal poverty guidelines</strong>{' '}
          (48 states and D.C.). The “line 5 floor” matches Form 8962 instructions: use the whole-number percentage row in
          Table 2 (floor of MAGI ÷ FPL × 100). This is educational only.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <IntegerField
            id="acaMarketplaceHouseholdSize"
            label="People in tax household (Marketplace / Form 8962)"
            value={form.acaMarketplaceHouseholdSize}
            onChange={(n) => set('acaMarketplaceHouseholdSize', n)}
            min={1}
            max={20}
            hint="Include everyone on the application; may differ from portfolio “has spouse” alone."
            error={fieldError(validationIssues, 'acaMarketplaceHouseholdSize')}
          />
          <div className="flex h-full min-h-0 min-w-0 flex-col gap-1 text-left">
            <div className={labelClass}>
              <label htmlFor="acaMarketplaceMagiEstimate" className="block w-full">
                Estimated annual household MAGI ($)
              </label>
            </div>
            <input
              id="acaMarketplaceMagiEstimate"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={form.acaMarketplaceMagiEstimate === null ? '' : form.acaMarketplaceMagiEstimate}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') set('acaMarketplaceMagiEstimate', null)
                else {
                  const n = Number(raw)
                  if (Number.isFinite(n)) set('acaMarketplaceMagiEstimate', Math.max(0, Math.round(n)))
                }
              }}
              className={inputClass}
              aria-invalid={magiFieldError ? true : undefined}
              aria-describedby={magiAriaDescribedBy}
            />
            <div className={hintClass}>
              <p id="aca-magi-hint" className="text-slate-500 dark:text-slate-400">
                Marketplace MAGI definition; leave blank if you only want to browse the reference tables.
              </p>
              {fieldError(validationIssues, 'acaMarketplaceMagiEstimate') ? (
                <p id="aca-magi-err" className="text-red-600 dark:text-red-400" role="alert">
                  {fieldError(validationIssues, 'acaMarketplaceMagiEstimate')}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className="mt-3 rounded-md border border-slate-200/90 bg-slate-50/90 px-2.5 py-2 text-[11px] leading-snug text-slate-800 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-200"
          aria-live="polite"
        >
          {acaDerived.fpl == null ? (
            <p>Enter a valid household size (1–20) to load FPL dollars.</p>
          ) : form.acaMarketplaceMagiEstimate === null ? (
            <p>
              <strong className="font-semibold">100% FPL</strong> for {form.acaMarketplaceHouseholdSize}{' '}
              {form.acaMarketplaceHouseholdSize === 1 ? 'person' : 'people'}: {formatUsd0(acaDerived.fpl)}. Enter MAGI
              above to see your % of FPL and the IRS Table 2 applicable figure (2025 instructions).
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong className="font-semibold">100% FPL</strong> ({form.acaMarketplaceHouseholdSize}{' '}
                {form.acaMarketplaceHouseholdSize === 1 ? 'person' : 'people'}, 2026 contiguous):{' '}
                {formatUsd0(acaDerived.fpl!)}
              </li>
              <li>
                <strong className="font-semibold">MAGI vs FPL:</strong>{' '}
                {acaDerived.pctOfFpl != null ? `${acaDerived.pctOfFpl.toFixed(1)}% of FPL` : '—'}
              </li>
              <li>
                <strong className="font-semibold">Form 8962 line 5 (floor)</strong> for Table 2 lookup:{' '}
                {acaDerived.line5Floor != null ? `${acaDerived.line5Floor}%` : '—'}
              </li>
              <li>
                <strong className="font-semibold">Applicable figure</strong> (TY2025 Table 2, max share of income
                toward benchmark silver before credit):{' '}
                {acaDerived.figure != null
                  ? `${formatPercentFromDecimal(acaDerived.figure)} of household income`
                  : '—'}
              </li>
              {acaDerived.capDollars != null ? (
                <li>
                  <strong className="font-semibold">Illustrative income cap</strong> toward benchmark plan (MAGI ×
                  applicable figure): {formatUsd0(Math.round(acaDerived.capDollars))} / yr — actual premiums and
                  credits depend on your plan and enrollment.
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </section>

      <AcaSubsidyReferencePanel />

      <section className="mt-5 border-t border-indigo-100/90 pt-4 dark:border-indigo-900/40">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          Retirement savings by account (MAGI prep)
        </h3>
        <p className="mb-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          Allocate <strong className="font-semibold text-slate-800 dark:text-slate-200">100%</strong> of
          retirement savings across the four buckets (percent of total). For now this is only context for
          healthcare planning; the portfolio projection does not read these fields.
        </p>
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
          <PercentField
            id="portfolioTaxDeferredPercent"
            label="Tax-deferred (IRA, 401(k), 403(b), etc.) %"
            value={form.portfolioTaxDeferredPercent}
            onChange={(n) => set('portfolioTaxDeferredPercent', n)}
            min={0}
            max={100}
            step={1}
            hint="Pre-tax balances; withdrawals generally increase MAGI."
          />
          <PercentField
            id="portfolioRothPercent"
            label="Roth (IRA, Roth 401(k), etc.) %"
            value={form.portfolioRothPercent}
            onChange={(n) => set('portfolioRothPercent', n)}
            min={0}
            max={100}
            step={1}
            hint="Qualified Roth withdrawals are often excluded from MAGI."
          />
          <PercentField
            id="portfolioTaxablePercent"
            label="Taxable brokerage %"
            value={form.portfolioTaxablePercent}
            onChange={(n) => set('portfolioTaxablePercent', n)}
            min={0}
            max={100}
            step={1}
            hint="Non-qualified accounts; only part of withdrawals may count as income."
          />
          <PercentField
            id="portfolioHsaPercent"
            label="HSA %"
            value={form.portfolioHsaPercent}
            onChange={(n) => set('portfolioHsaPercent', n)}
            min={0}
            max={100}
            step={1}
            hint="HSA rules for MAGI depend on qualified vs non-qualified use."
          />
        </div>
        <p
          className={`mt-2 text-xs font-semibold tabular-nums ${sumMismatch ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}
          aria-live="polite"
        >
          Total: {mixSum.toFixed(1)}% {sumMismatch ? '(must equal 100%)' : ''}
        </p>
        {mixError ? (
          <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400" role="alert">
            {mixError}
          </p>
        ) : null}

        <div className="mt-5">
          <PercentField
            id="taxableWithdrawalMagiPercent"
            label="Taxable withdrawal MAGI share (%)"
            value={form.taxableWithdrawalMagiPercent}
            onChange={(n) => set('taxableWithdrawalMagiPercent', n)}
            min={0}
            max={100}
            step={1}
            hint="Rough share of each dollar drawn from taxable accounts assumed to count toward MAGI (gains, taxable dividends, etc.). Use a planner’s estimate if unsure."
            error={fieldError(validationIssues, 'taxableWithdrawalMagiPercent')}
          />
        </div>
      </section>

      {onRunProjection ? (
        <div className="mt-6 border-t border-indigo-100/90 pt-5 dark:border-indigo-900/40">
          <p className="mb-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
            Runs the <strong className="font-semibold text-slate-800 dark:text-slate-200">financial</strong>{' '}
            projection only (same as the button under the form). Healthcare inputs are not applied there yet.
          </p>
          <button
            type="button"
            disabled={!canRunProjection}
            onClick={onRunProjection}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-300/40 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-indigo-900/30 dark:focus:ring-offset-slate-950 sm:w-auto sm:px-8"
          >
            Run projection
          </button>
          {!canRunProjection ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="status">
              Fix the highlighted fields (including on the Assumptions tab) to run the projection.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        Illustrative and educational only—not tax, legal, or insurance advice. Rules and thresholds
        change by year and circumstance.
      </p>
    </div>
  )
}
