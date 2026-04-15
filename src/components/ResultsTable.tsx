import type { GuardrailYearKind, YearProjection } from '../lib/simulateRetirement'
import {
  DEFAULT_GUARDRAIL_BAND,
  DEFAULT_GUARDRAIL_SPENDING_STEP,
} from '../lib/retirementGuardrails'

interface ResultsTableProps {
  rows: YearProjection[]
  /** When true, show legend and highlight rows where guardrails affected spending (and thus withdrawals and balance). */
  useSpendingGuardrails?: boolean
  /** Optional sampled years used by guardrail examples; highlight spending+portfolio cells in red. */
  guardrailExampleYears?: number[]
}

function rowHighlightClass(shortfall: boolean, kind: GuardrailYearKind): string {
  if (shortfall) return 'bg-red-50/80 dark:bg-red-950/20'
  if (kind === 'increase' || kind === 'decrease') {
    return 'bg-amber-50/90 dark:bg-amber-950/30 hover:bg-amber-100/90 dark:hover:bg-amber-950/40'
  }
  if (kind === 'anchor') {
    return 'bg-violet-50/80 dark:bg-violet-950/25 hover:bg-violet-100/70 dark:hover:bg-violet-950/35'
  }
  return 'hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25'
}

function spendingCellClass(kind: GuardrailYearKind): string {
  if (kind === 'increase' || kind === 'decrease') {
    return 'bg-amber-100/80 font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
  }
  if (kind === 'anchor') {
    return 'bg-violet-100/70 font-medium text-violet-950 dark:bg-violet-950/35 dark:text-violet-100'
  }
  return 'text-slate-800 dark:text-slate-200'
}

function portfolioCellClass(kind: GuardrailYearKind): string {
  if (kind === 'increase' || kind === 'decrease') {
    return 'bg-amber-100/80 font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
  }
  if (kind === 'anchor') {
    return 'bg-violet-100/70 font-medium text-violet-950 dark:bg-violet-950/35 dark:text-violet-100'
  }
  return ''
}

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function guardrailComparisonTooltip(r: YearProjection): string {
  const dropPercent = (DEFAULT_GUARDRAIL_BAND / (1 + DEFAULT_GUARDRAIL_BAND)) * 100
  const portfolioDropAmount = r.endPortfolioBalance * (dropPercent / 100)
  const portfolioDropScenario = Math.max(0, r.endPortfolioBalance - portfolioDropAmount)
  const spendingAfterCut = Math.max(0, r.annualExpense * (1 - DEFAULT_GUARDRAIL_SPENDING_STEP))
  return [
    `Year ${r.calendarYear} guardrail comparison`,
    `Portfolio current: ${fmtMoney(r.endPortfolioBalance)}`,
    `Portfolio drop scenario (${dropPercent.toFixed(1)}%): ${fmtMoney(portfolioDropScenario)}`,
    `Spending current: ${fmtMoney(r.annualExpense)}`,
    `Spending after cut (${(DEFAULT_GUARDRAIL_SPENDING_STEP * 100).toFixed(0)}%): ${fmtMoney(spendingAfterCut)}`,
  ].join('\n')
}

function tooltipLines(text: string): string[] {
  return text.split('\n')
}

export function ResultsTable({
  rows,
  useSpendingGuardrails,
  guardrailExampleYears,
}: ResultsTableProps) {
  const showKey = Boolean(useSpendingGuardrails)
  const guardrailExampleYearSet = new Set(guardrailExampleYears ?? [])

  return (
    <div className="space-y-3">
      {showKey ? (
        <div
          className="no-print rounded-lg border border-amber-200/90 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100"
          role="note"
        >
          <p className="font-semibold">Guardrail modeling on</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/95 print:text-amber-950">
            <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 font-medium dark:bg-amber-900/50">
              Amber
            </span>{' '}
            highlights years when nominal spending was raised or lowered (withdrawal and end balance
            reflect that year&apos;s spending).{' '}
            <span className="inline-block rounded bg-violet-100 px-1.5 py-0.5 font-medium dark:bg-violet-900/45">
              Violet
            </span>{' '}
            marks the first retirement year where the anchor withdrawal rate is set.
            {' '}
            <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
              Red
            </span>{' '}
            marks sampled guardrail example years (spending and end balance cells).
          </p>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-indigo-200/70 bg-white shadow-sm shadow-indigo-100/20 dark:border-indigo-800/50 dark:bg-slate-900 dark:shadow-indigo-950/20">
      <table className="min-w-full divide-y divide-indigo-100 text-sm dark:divide-indigo-900/40">
        <thead className="bg-indigo-50/95 dark:bg-indigo-950/45">
          <tr>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Year
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Retiree age
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Spouse age
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Expenses
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Social Security
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Other income
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Windfall
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              One-time expense
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Portfolio withdrawal
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              End balance
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100">
              Shortfall
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-50 bg-white dark:divide-indigo-950/30 dark:bg-slate-900">
          {rows.map((r) => (
            (() => {
              const isGuardrailExampleYear =
                Boolean(useSpendingGuardrails) && guardrailExampleYearSet.has(r.calendarYear)
              const sampledDropCellClass =
                isGuardrailExampleYear && r.inRetirementPhase
                  ? 'bg-red-100/80 font-semibold text-red-900 dark:bg-red-950/45 dark:text-red-200'
                  : ''
              const sampledDropTitle =
                isGuardrailExampleYear && r.inRetirementPhase
                  ? guardrailComparisonTooltip(r)
                  : undefined
              return (
            <tr
              key={r.calendarYear}
              className={rowHighlightClass(r.shortfall, r.guardrailYearKind)}
            >
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.calendarYear}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.retireeAlive ? r.retireeAge : 'Deceased'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.spouseAge != null
                  ? r.spouseAlive
                    ? r.spouseAge
                    : 'Deceased'
                  : '—'}
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${r.inRetirementPhase ? spendingCellClass(r.guardrailYearKind) : 'text-slate-800 dark:text-slate-200'} ${sampledDropCellClass}`}
              >
                {r.inRetirementPhase ? (
                  sampledDropTitle ? (
                    <span className="group relative inline-flex cursor-help items-center">
                      {fmtMoney(r.annualExpense)}
                      <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden min-w-[18rem] max-w-[22rem] whitespace-normal rounded-md border border-red-300 bg-white px-2 py-1.5 text-left text-[11px] leading-snug text-slate-800 shadow-lg group-hover:block dark:border-red-700 dark:bg-slate-900 dark:text-slate-100">
                        {tooltipLines(sampledDropTitle).map((line, idx) => (
                          <span key={`sp-${r.calendarYear}-${idx}`} className="block">
                            {line}
                          </span>
                        ))}
                      </span>
                    </span>
                  ) : (
                    fmtMoney(r.annualExpense)
                  )
                ) : (
                  '—'
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {fmtMoney(r.socialSecurity)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {fmtMoney(r.otherIncome)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {r.windfall > 0 ? fmtMoney(r.windfall) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {r.oneTimeExpense > 0 ? fmtMoney(r.oneTimeExpense) : '—'}
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 ${r.inRetirementPhase ? portfolioCellClass(r.guardrailYearKind) : ''}`}
              >
                {r.inRetirementPhase ? fmtMoney(r.portfolioWithdrawal) : '—'}
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium text-indigo-950 dark:text-indigo-50 ${r.inRetirementPhase ? portfolioCellClass(r.guardrailYearKind) : ''} ${sampledDropCellClass}`}
              >
                {sampledDropTitle ? (
                  <span className="group relative inline-flex cursor-help items-center">
                    {fmtMoney(r.endPortfolioBalance)}
                    <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden min-w-[18rem] max-w-[22rem] whitespace-normal rounded-md border border-red-300 bg-white px-2 py-1.5 text-left text-[11px] leading-snug text-slate-800 shadow-lg group-hover:block dark:border-red-700 dark:bg-slate-900 dark:text-slate-100">
                      {tooltipLines(sampledDropTitle).map((line, idx) => (
                        <span key={`bal-${r.calendarYear}-${idx}`} className="block">
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                ) : (
                  fmtMoney(r.endPortfolioBalance)
                )}
              </td>
              <td className="px-3 py-2 text-center text-slate-800 dark:text-slate-200">
                {r.shortfall ? (
                  <span className="font-medium text-red-700 dark:text-red-400">Yes</span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
              )
            })()
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
