import type { YearProjection } from '../lib/simulateRetirement'

interface ResultsTableProps {
  rows: YearProjection[]
}

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function ResultsTable({ rows }: ResultsTableProps) {
  return (
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
            <tr
              key={r.calendarYear}
              className={
                r.shortfall
                  ? 'bg-red-50/80 dark:bg-red-950/20'
                  : 'hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25'
              }
            >
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.calendarYear}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.retireeAge}
                {!r.retireeAlive ? ' (deceased)' : ''}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-800 dark:text-slate-200">
                {r.spouseAge != null ? (
                  <>
                    {r.spouseAge}
                    {!r.spouseAlive ? ' (deceased)' : ''}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {r.inRetirementPhase ? fmtMoney(r.annualExpense) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {fmtMoney(r.socialSecurity)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {r.inRetirementPhase ? fmtMoney(r.portfolioWithdrawal) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium text-indigo-950 dark:text-indigo-50">
                {fmtMoney(r.endPortfolioBalance)}
              </td>
              <td className="px-3 py-2 text-center text-slate-800 dark:text-slate-200">
                {r.shortfall ? (
                  <span className="font-medium text-red-700 dark:text-red-400">Yes</span>
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
