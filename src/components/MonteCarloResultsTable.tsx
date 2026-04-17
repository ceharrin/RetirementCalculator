import type { MonteCarloYearSummary } from '../lib/monteCarloBootstrap'

interface MonteCarloResultsTableProps {
  rows: MonteCarloYearSummary[]
}

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function triplet(p10: number, p50: number, p90: number) {
  return `${fmtMoney(p10)} / ${fmtMoney(p50)} / ${fmtMoney(p90)}`
}

function pct(f: number) {
  return `${(f * 100).toFixed(1)}%`
}

export function MonteCarloResultsTable({ rows }: MonteCarloResultsTableProps) {
  const showSpouseColumn = rows.some((r) => r.spouseAge != null)

  return (
    <div className="print-split-table-wrap overflow-x-auto rounded-xl border border-indigo-200/70 bg-white shadow-sm shadow-indigo-100/20 dark:border-indigo-800/50 dark:bg-slate-900 dark:shadow-indigo-950/20 print:overflow-visible print:rounded-none print:border-slate-300 print:shadow-none">
      <table className="print-split-table min-w-full divide-y divide-indigo-100 text-sm dark:divide-indigo-900/40 print:text-[10px] print:leading-tight">
        <thead className="bg-indigo-50/95 dark:bg-indigo-950/45">
          <tr>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Year
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Retiree age
            </th>
            {showSpouseColumn ? (
              <th
                scope="col"
                className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
              >
                Spouse age
              </th>
            ) : null}
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Soc Sec
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Expenses p10 / p50 / p90
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Port w/d p10 / p50 / p90
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              End bal p10 / p50 / p90
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold"
            >
              Shortfall %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-indigo-50 bg-white dark:divide-indigo-950/30 dark:bg-slate-900">
          {rows.map((r) => (
            <tr
              key={r.calendarYear}
              className="hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
            >
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.calendarYear}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.retireeAlive ? r.retireeAge : 'Deceased'}
              </td>
              {showSpouseColumn ? (
                <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                  {r.spouseAge != null
                    ? r.spouseAlive
                      ? r.spouseAge
                      : 'Deceased'
                    : '—'}
                </td>
              ) : null}
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {fmtMoney(r.socialSecurity)}
              </td>
              <td className="min-w-[10rem] px-3 py-2 text-right text-xs tabular-nums leading-snug text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.inRetirementPhase ? triplet(r.expenseP10, r.expenseP50, r.expenseP90) : '—'}
              </td>
              <td className="min-w-[10rem] px-3 py-2 text-right text-xs tabular-nums leading-snug text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.inRetirementPhase
                  ? triplet(r.withdrawalP10, r.withdrawalP50, r.withdrawalP90)
                  : '—'}
              </td>
              <td className="min-w-[10rem] px-3 py-2 text-right text-xs tabular-nums font-medium leading-snug text-indigo-950 dark:text-indigo-50 print:px-1 print:py-0.5">
                {triplet(r.endBalanceP10, r.endBalanceP50, r.endBalanceP90)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-center tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.shortfallFraction > 0 ? (
                  <span className="font-medium text-amber-800 dark:text-amber-300">
                    {pct(r.shortfallFraction)}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
