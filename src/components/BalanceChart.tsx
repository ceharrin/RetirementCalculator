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
import type { YearProjection } from '../lib/simulateRetirement'

function seriesLabelFromPayload(item: {
  dataKey?: unknown
  name?: unknown
}): string {
  const dk = item.dataKey
  const key = typeof dk === 'string' ? dk : dk != null ? String(dk) : ''
  if (key === 'balance') return 'Portfolio balance'
  if (key === 'withdrawal') return 'Annual withdrawal'
  if (typeof item.name === 'string' && item.name.length > 0) return item.name
  return 'Value'
}

interface BalanceChartProps {
  rows: YearProjection[]
  /** When true, mark years where guardrails stepped spending (and show chart key). */
  useSpendingGuardrails?: boolean
}

export function BalanceChart({ rows, useSpendingGuardrails }: BalanceChartProps) {
  const data = rows.map((r) => ({
    year: r.calendarYear,
    balance: Math.round(r.endPortfolioBalance),
    withdrawal: r.inRetirementPhase ? Math.round(r.portfolioWithdrawal) : 0,
    guardrailStep:
      r.inRetirementPhase &&
      (r.guardrailYearKind === 'increase' || r.guardrailYearKind === 'decrease'),
    guardrailAnchor: r.inRetirementPhase && r.guardrailYearKind === 'anchor',
  }))

  const showGuardrailMarkers = Boolean(useSpendingGuardrails)

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
            formatter={(value, _name, item) => {
              const n = typeof value === 'number' ? value : Number(value)
              const label = seriesLabelFromPayload(item ?? {})
              return [
                n.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                }),
                label,
              ]
            }}
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
            dataKey="balance"
            name="Portfolio balance"
            stroke="#6d28d9"
            strokeWidth={2}
            dot={
              showGuardrailMarkers
                ? (props: { cx?: number; cy?: number; payload?: (typeof data)[0] }) => {
                    const { cx, cy, payload } = props
                    if (cx == null || cy == null || !payload) return null
                    if (payload.guardrailStep) {
                      return (
                        <circle
                          key={`bal-step-${payload.year}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#f59e0b"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      )
                    }
                    if (payload.guardrailAnchor) {
                      return (
                        <circle
                          key={`bal-anchor-${payload.year}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#8b5cf6"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      )
                    }
                    return null
                  }
                : false
            }
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="withdrawal"
            name="Annual withdrawal"
            stroke="#2563eb"
            strokeWidth={2}
            dot={
              showGuardrailMarkers
                ? (props: { cx?: number; cy?: number; payload?: (typeof data)[0] }) => {
                    const { cx, cy, payload } = props
                    if (cx == null || cy == null || !payload) return null
                    if (payload.guardrailStep) {
                      return (
                        <circle
                          key={`wd-step-${payload.year}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#f59e0b"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      )
                    }
                    if (payload.guardrailAnchor) {
                      return (
                        <circle
                          key={`wd-anchor-${payload.year}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="#8b5cf6"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      )
                    }
                    return null
                  }
                : false
            }
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      {showGuardrailMarkers ? (
        <p className="no-print text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium text-amber-700 dark:text-amber-400">Amber dots</span>: spending
          raised or lowered by guardrails that year (balance and withdrawal move with it).{' '}
          <span className="font-medium text-violet-700 dark:text-violet-400">Violet dots</span>:
          anchor year (first retirement year rate recorded).
        </p>
      ) : null}
    </div>
  )
}
