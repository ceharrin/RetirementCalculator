import { useCallback, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { BalanceChart } from './components/BalanceChart'
import { InputForm } from './components/InputForm'
import { PrintAssumptionsTable } from './components/PrintAssumptionsTable'
import { ResultsTable } from './components/ResultsTable'
import {
  clampSsClaimAge,
  DEFAULT_INFLATION_RATE,
  DEFAULT_PORTFOLIO_RETURN,
  DEFAULT_SPENDING_DECLINE_ANNUAL_RATE,
  DEFAULT_SPENDING_DECLINE_START_AGE,
  DEFAULT_SS_CLAIM_AGE,
  DEFAULT_SS_COLA_RATE,
  simulateRetirement,
  validateSimulationInput,
  type SimulationResult,
} from './lib/simulateRetirement'
import { defaultFormState, formStateToSimulationInput, type FormState } from './types/form'

const PLANNING_YEAR = new Date().getFullYear()
const initialForm = defaultFormState(PLANNING_YEAR)

function applyHistoricalDefaults(prev: FormState): FormState {
  return {
    ...prev,
    inflationPercent: DEFAULT_INFLATION_RATE * 100,
    portfolioReturnPercent: DEFAULT_PORTFOLIO_RETURN * 100,
    socialSecurityColaPercent: DEFAULT_SS_COLA_RATE * 100,
    spendingDeclineStartAge: DEFAULT_SPENDING_DECLINE_START_AGE,
    spendingDeclinePercent: DEFAULT_SPENDING_DECLINE_ANNUAL_RATE * 100,
    retireeClaimAge: DEFAULT_SS_CLAIM_AGE,
    spouseClaimAge: DEFAULT_SS_CLAIM_AGE,
  }
}

function formatReportDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function App() {
  const [form, setForm] = useState<FormState>(() => initialForm)
  const [assumptionsForReport, setAssumptionsForReport] = useState<FormState | null>(() => {
    const input = formStateToSimulationInput(initialForm)
    return validateSimulationInput(input).length === 0 ? { ...initialForm } : null
  })
  const [printReportMeta, setPrintReportMeta] = useState<{
    display: string
    iso: string
  } | null>(null)

  const applyFormPatch = useCallback((patch: Partial<FormState>) => {
    setForm((f) => {
      const next = { ...f, ...patch }
      if (patch.retireeClaimAge !== undefined) {
        next.retireeClaimAge = clampSsClaimAge(patch.retireeClaimAge)
      }
      if (patch.spouseClaimAge !== undefined) {
        next.spouseClaimAge = clampSsClaimAge(patch.spouseClaimAge)
      }
      return next
    })
  }, [])
  const [result, setResult] = useState<SimulationResult | null>(() => {
    const input = formStateToSimulationInput(initialForm)
    return validateSimulationInput(input).length === 0
      ? simulateRetirement(input)
      : null
  })

  const simulationInput = useMemo(() => formStateToSimulationInput(form), [form])
  const validationIssues = useMemo(
    () => validateSimulationInput(simulationInput),
    [simulationInput],
  )
  const canRun = validationIssues.length === 0

  const runProjection = useCallback(() => {
    if (!canRun) return
    setAssumptionsForReport({ ...form })
    setResult(simulateRetirement(simulationInput))
  }, [canRun, form, simulationInput])

  const printOrSavePdf = useCallback(() => {
    if (!result) return
    const now = new Date()
    flushSync(() => {
      setPrintReportMeta({
        display: formatReportDate(now),
        iso: now.toISOString().slice(0, 10),
      })
    })
    window.print()
  }, [result])

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 via-indigo-50/35 to-violet-50/45 text-slate-900 dark:from-slate-950 dark:via-indigo-950/30 dark:to-violet-950/25 dark:text-slate-50">
      <header className="border-b border-indigo-200/80 bg-white/90 px-4 py-8 shadow-sm shadow-indigo-100/50 backdrop-blur dark:border-indigo-800/40 dark:bg-slate-900/90 dark:shadow-indigo-950/20 print:border-slate-300 print:bg-white print:py-4 print:shadow-none dark:print:bg-white">
        <div className="mx-auto max-w-6xl text-center sm:text-left">
          <h1 className="bg-gradient-to-r from-indigo-800 to-violet-700 bg-clip-text text-3xl font-semibold tracking-tight text-transparent dark:from-indigo-300 dark:to-violet-300 sm:text-4xl print:bg-none print:bg-clip-border print:text-slate-900">
            Retirement planning calculator
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600 no-print dark:text-slate-400">
            Year-by-year portfolio projection using your retirement age, spending, inflation, return
            assumptions, and simplified Social Security. For couples, spending and benefits adjust
            after the first death using the rules you set below.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:px-2 print:py-4">
        <div className="grid gap-10 lg:grid-cols-5 print:block">
          <div className="no-print lg:col-span-2">
            <InputForm
              form={form}
              onChange={applyFormPatch}
              onApplyHistoricalDefaults={() =>
                setForm((f) => applyHistoricalDefaults(f))
              }
              validationIssues={validationIssues}
            />
            <div className="mt-6">
              <button
                type="button"
                disabled={!canRun}
                onClick={runProjection}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-300/40 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-indigo-900/30 dark:focus:ring-offset-slate-950 sm:w-auto sm:px-8"
              >
                Run projection
              </button>
              {!canRun ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="status">
                  Fix the highlighted fields to run the projection.
                </p>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-3 print:w-full print:max-w-none">
            {result ? (
              <div className="flex flex-col gap-8 print:gap-6">
                <div className="print-only mb-4 border-b border-slate-300 pb-3">
                  <p className="text-lg font-semibold text-slate-900">Retirement projection report</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Generated{' '}
                    {printReportMeta ? (
                      <time dateTime={printReportMeta.iso}>{printReportMeta.display}</time>
                    ) : null}
                  </p>
                </div>
                <PrintAssumptionsTable form={assumptionsForReport ?? form} />
                <div className="no-print">
                  <button
                    type="button"
                    onClick={printOrSavePdf}
                    className="mb-2 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:border-indigo-600 dark:bg-slate-900 dark:text-indigo-200 dark:hover:bg-indigo-950/50 dark:focus:ring-offset-slate-950"
                  >
                    Print or save as PDF
                  </button>
                  <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                    Opens your browser print dialog—choose &quot;Save as PDF&quot; to download.
                  </p>
                </div>
                <section>
                  <h2 className="mb-3 text-lg font-bold text-indigo-950 dark:text-indigo-100 print:text-slate-900">
                    Portfolio and withdrawals
                  </h2>
                  <BalanceChart
                    rows={result.rows}
                    useSpendingGuardrails={result.useSpendingGuardrails}
                  />
                </section>
                <section>
                  <h2 className="mb-3 text-lg font-bold text-indigo-950 dark:text-indigo-100 print:text-slate-900">
                    Year-by-year detail
                  </h2>
                  <ResultsTable
                    rows={result.rows}
                    useSpendingGuardrails={result.useSpendingGuardrails}
                  />
                </section>
                <aside
                  className="rounded-lg border border-indigo-200/90 bg-indigo-50/80 p-4 text-sm text-indigo-950 dark:border-indigo-700/60 dark:bg-indigo-950/35 dark:text-indigo-100 print:border-slate-300 print:bg-slate-50 print:text-slate-800 dark:print:bg-slate-50 dark:print:text-slate-800"
                  role="note"
                >
                  <strong className="font-semibold">Disclaimer.</strong> This tool is for education
                  and illustration only. It is not tax, legal, or investment advice. Social Security
                  is modeled with simplified rules and your own benefit estimates, not official SSA
                  calculations. Inflation and investment returns are unknown; any rate you enter is
                  an assumption, not a prediction.
                </aside>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-indigo-300/80 bg-white/70 p-10 text-center text-slate-600 shadow-inner shadow-indigo-50/80 dark:border-indigo-600/50 dark:bg-slate-900/50 dark:text-slate-400 dark:shadow-indigo-950/20">
                <p className="text-base">
                  Enter assumptions on the left, then click <strong>Run projection</strong> to see
                  balances, withdrawals, and a yearly table.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
