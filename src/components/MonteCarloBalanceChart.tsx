import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonteCarloYearSummary } from '../lib/monteCarloBootstrap'

interface MonteCarloBalanceChartProps {
  rows: MonteCarloYearSummary[]
}

export function MonteCarloBalanceChart({ rows }: MonteCarloBalanceChartProps) {
  const data = rows.map((r) => ({
    year: r.calendarYear,
    balanceP10: Math.round(r.endBalanceP10),
    balanceP50: Math.round(r.endBalanceP50),
    balanceP90: Math.round(r.endBalanceP90),
    withdrawalP10: r.inRetirementPhase ? Math.round(r.withdrawalP10) : 0,
    withdrawalP50: r.inRetirementPhase ? Math.round(r.withdrawalP50) : 0,
    withdrawalP90: r.inRetirementPhase ? Math.round(r.withdrawalP90) : 0,
  }))

  return (
    <div className="space-y-2">
      <div className="h-80 w-full min-w-0 rounded-xl border border-indigo-200/70 bg-white p-2 shadow-sm shadow-indigo-100/25 dark:border-indigo-800/50 dark:bg-slate-900 dark:shadow-indigo-950/20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" className="dark:stroke-indigo-800/60" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: '#6366f1' }}
              label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#6366f1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6366f1' }}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`
              }
              width={48}
            />
            <Tooltip
              formatter={(value) =>
                (typeof value === 'number' ? value : Number(value)).toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })
              }
              labelFormatter={(y) => `Year ${y}`}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #c7d2fe',
                backgroundColor: 'rgba(255,255,255,0.98)',
              }}
              wrapperStyle={{ outline: 'none' }}
            />
            <Legend wrapperStyle={{ paddingTop: 8 }} />
            <Line
              type="monotone"
              dataKey="balanceP10"
              name="Balance p10"
              stroke="#a78bfa"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="balanceP50"
              name="Balance p50"
              stroke="#6d28d9"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="balanceP90"
              name="Balance p90"
              stroke="#c4b5fd"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="withdrawalP10"
              name="Withdrawal p10"
              stroke="#93c5fd"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="withdrawalP50"
              name="Withdrawal p50"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="withdrawalP90"
              name="Withdrawal p90"
              stroke="#bfdbfe"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="no-print text-xs text-slate-600 dark:text-slate-400">
        Each year shows p10 / p50 / p90 across trials. Historical US CPI + S&P 500 annual pairs are
        bootstrapped with replacement for return and expense inflation each year (illustrative).
      </p>
    </div>
  )
}
