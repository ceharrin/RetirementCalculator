import { useCallback, useMemo, useState } from 'react'
import { BalanceChart } from './components/BalanceChart'
import { InputForm } from './components/InputForm'
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

export default function App() {
  const [form, setForm] = useState<FormState>(() => defaultFormState(PLANNING_YEAR))

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
    const input = formStateToSimulationInput(defaultFormState(PLANNING_YEAR))
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
    setResult(simulateRetirement(simulationInput))
  }, [canRun, simulationInput])

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 via-indigo-50/35 to-violet-50/45 text-slate-900 dark:from-slate-950 dark:via-indigo-950/30 dark:to-violet-950/25 dark:text-slate-50">
      <header className="border-b border-indigo-200/80 bg-white/90 px-4 py-8 shadow-sm shadow-indigo-100/50 backdrop-blur dark:border-indigo-800/40 dark:bg-slate-900/90 dark:shadow-indigo-950/20">
        <div className="mx-auto max-w-6xl text-center sm:text-left">
          <h1 className="bg-gradient-to-r from-indigo-800 to-violet-700 bg-clip-text text-3xl font-semibold tracking-tight text-transparent dark:from-indigo-300 dark:to-violet-300 sm:text-4xl">
            Retirement planning calculator
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
            Year-by-year portfolio projection using your retirement age, spending, inflation, return
            assumptions, and simplified Social Security. For couples, spending and benefits adjust
            after the first death using the rules you set below.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
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

          <div className="lg:col-span-3">
            {result ? (
              <div className="flex flex-col gap-8">
                <section>
                  <h2 className="mb-3 text-lg font-bold text-indigo-950 dark:text-indigo-100">
                    Portfolio and withdrawals
                  </h2>
                  <BalanceChart rows={result.rows} />
                </section>
                <section>
                  <h2 className="mb-3 text-lg font-bold text-indigo-950 dark:text-indigo-100">
                    Year-by-year detail
                  </h2>
                  <ResultsTable rows={result.rows} />
                </section>
                <aside
                  className="rounded-lg border border-indigo-200/90 bg-indigo-50/80 p-4 text-sm text-indigo-950 dark:border-indigo-700/60 dark:bg-indigo-950/35 dark:text-indigo-100"
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
