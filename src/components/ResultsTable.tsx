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
  const showSpouseColumn = rows.some((r) => r.spouseAge != null)
  const showOtherIncomeColumn = rows.some((r) => r.otherIncome > 0)
  const showWindfallColumn = rows.some((r) => r.windfall > 0)
  const showOneTimeExpenseColumn = rows.some((r) => r.oneTimeExpense > 0)

  return (
    <div className="space-y-3">
      <div className="print-split-table-wrap overflow-x-auto rounded-xl border border-indigo-200/70 bg-white shadow-sm shadow-indigo-100/20 dark:border-indigo-800/50 dark:bg-slate-900 dark:shadow-indigo-950/20 print:overflow-visible print:rounded-none print:border-slate-300 print:shadow-none">
      <table className="print-split-table min-w-full divide-y divide-indigo-100 text-sm dark:divide-indigo-900/40 print:text-[10px] print:leading-tight">
        <thead className="bg-indigo-50/95 dark:bg-indigo-950/45">
          <tr>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Year
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Retiree age
            </th>
            {showSpouseColumn ? (
              <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
                Spouse age
              </th>
            ) : null}
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Expenses
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Soc Sec
            </th>
            {showOtherIncomeColumn ? (
              <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
                Other inc
              </th>
            ) : null}
            {showWindfallColumn ? (
              <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
                Windfall
              </th>
            ) : null}
            {showOneTimeExpenseColumn ? (
              <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
                One-time exp
              </th>
            ) : null}
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Port w/d
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              End bal
            </th>
            <th scope="col" className="px-3 py-3 text-center font-bold text-indigo-950 dark:text-indigo-100 print:px-1 print:py-1 print:font-semibold">
              Shortfall
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
                {r.inRetirementPhase ? fmtMoney(r.annualExpense) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {fmtMoney(r.socialSecurity)}
              </td>
              {showOtherIncomeColumn ? (
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                  {fmtMoney(r.otherIncome)}
                </td>
              ) : null}
              {showWindfallColumn ? (
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                  {r.windfall > 0 ? fmtMoney(r.windfall) : '—'}
                </td>
              ) : null}
              {showOneTimeExpenseColumn ? (
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                  {r.oneTimeExpense > 0 ? fmtMoney(r.oneTimeExpense) : '—'}
                </td>
              ) : null}
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
                {r.inRetirementPhase ? fmtMoney(r.portfolioWithdrawal) : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium text-indigo-950 dark:text-indigo-50 print:px-1 print:py-0.5">
                {fmtMoney(r.endPortfolioBalance)}
              </td>
              <td className="px-3 py-2 text-center text-slate-800 dark:text-slate-200 print:px-1 print:py-0.5">
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
    </div>
  )
}
