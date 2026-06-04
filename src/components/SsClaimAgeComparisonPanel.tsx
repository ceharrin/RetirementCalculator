import { useMemo } from 'react'
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
import {
  breakEvenAge,
  ssClaimComparison,
  SS_COMPARISON_CLAIM_AGES,
  type SsClaimScenario,
} from '../lib/ssClaimComparison'

interface Props {
  label: string
  fraAnnualBenefit: number
  currentAge: number
  deathAge: number
  colaRate: number
}

const COLORS: Record<number, string> = {
  62: '#dc2626',
  67: '#2563eb',
  70: '#16a34a',
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function buildChartData(
  scenarios: SsClaimScenario[],
  currentAge: number,
  deathAge: number,
): Record<string, number>[] {
  const rows: Record<string, number>[] = []
  for (let age = currentAge + 1; age <= deathAge; age++) {
    const row: Record<string, number> = { age }
    for (const s of scenarios) {
      row[`age${s.claimAge}`] = s.cumulativeByAge.get(age) ?? 0
    }
    rows.push(row)
  }
  return rows
}

function PersonPanel({ label, fraAnnualBenefit, currentAge, deathAge, colaRate }: Props) {
  const scenarios = useMemo(
    () => ssClaimComparison(fraAnnualBenefit, currentAge, deathAge, colaRate),
    [fraAnnualBenefit, currentAge, deathAge, colaRate],
  )

  const chartData = useMemo(
    () => buildChartData(scenarios, currentAge, deathAge),
    [scenarios, currentAge, deathAge],
  )

  const [s62, s67, s70] = scenarios as [SsClaimScenario, SsClaimScenario, SsClaimScenario]
  const be6267 = useMemo(() => breakEvenAge(s62, s67, deathAge), [s62, s67, deathAge])
  const be6270 = useMemo(() => breakEvenAge(s62, s70, deathAge), [s62, s70, deathAge])
  const be6770 = useMemo(() => breakEvenAge(s67, s70, deathAge), [s67, s70, deathAge])

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</h3>
      <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
        Your entered benefit is treated as the FRA (age 67) amount. SSA adjustment factors are applied to derive the 62 and 70 amounts. COLA is applied from first payment year.
      </p>

      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-1.5 pr-3 text-left font-semibold text-slate-700 dark:text-slate-300">Claim age</th>
              <th className="py-1.5 pr-3 text-right font-semibold text-slate-700 dark:text-slate-300">Annual benefit</th>
              <th className="py-1.5 pr-3 text-right font-semibold text-slate-700 dark:text-slate-300">Lifetime total</th>
              <th className="py-1.5 text-right font-semibold text-slate-700 dark:text-slate-300">Break-even vs age 62</th>
            </tr>
          </thead>
          <tbody>
            {SS_COMPARISON_CLAIM_AGES.map((ca) => {
              const s = scenarios.find((x) => x.claimAge === ca)!
              const be = ca === 62 ? null : ca === 67 ? be6267 : be6270
              return (
                <tr key={ca} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 pr-3 font-medium tabular-nums" style={{ color: COLORS[ca] }}>
                    Age {ca}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {formatMoney(s.annualBenefitAtClaim)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                    {formatMoney(s.lifetimeTotal)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                    {be === null ? (ca === 62 ? '—' : 'Never') : `Age ${be}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {be6770 !== null && (
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Age 70 overtakes age 67 at age {be6770}.
          </p>
        )}
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{ value: 'Retiree age', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => {
                const n = Number(v)
                if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
                if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
                return `$${Math.round(n)}`
              }}
              width={54}
            />
            <Tooltip
              formatter={(value: unknown) => [typeof value === 'number' ? formatMoney(value) : '', 'Cumulative SS']}
              labelFormatter={(label) => `Age ${label}`}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Legend iconType="line" wrapperStyle={{ fontSize: 11 }} />
            {SS_COMPARISON_CLAIM_AGES.map((ca) => (
              <Line
                key={ca}
                type="monotone"
                dataKey={`age${ca}`}
                name={`Claim at ${ca}`}
                stroke={COLORS[ca]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface SsClaimAgeComparisonPanelProps {
  retireeAnnualSS: number
  retireeCurrentAge: number
  retireeDeathAge: number
  spouseAnnualSS: number | null
  spouseCurrentAge: number | null
  spouseDeathAge: number | null
  colaRate: number
}

export function SsClaimAgeComparisonPanel({
  retireeAnnualSS,
  retireeCurrentAge,
  retireeDeathAge,
  spouseAnnualSS,
  spouseCurrentAge,
  spouseDeathAge,
  colaRate,
}: SsClaimAgeComparisonPanelProps) {
  const showRetiree = retireeAnnualSS > 0
  const showSpouse =
    spouseAnnualSS !== null &&
    spouseAnnualSS > 0 &&
    spouseCurrentAge !== null &&
    spouseDeathAge !== null

  if (!showRetiree && !showSpouse) return null

  return (
    <section>
      <h2 className="mb-1 text-lg font-bold text-indigo-950 dark:text-indigo-100 print:text-slate-900">
        Social Security claim-age comparison
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Cumulative lifetime SS received for claiming at 62, 67, or 70 — assuming the benefit you entered is your FRA (age 67) amount. Break-even ages show when a later claim age overtakes an earlier one in total dollars received.
      </p>
      <div className={showRetiree && showSpouse ? 'grid gap-8 sm:grid-cols-2' : ''}>
        {showRetiree && (
          <PersonPanel
            label="Retiree"
            fraAnnualBenefit={retireeAnnualSS}
            currentAge={retireeCurrentAge}
            deathAge={retireeDeathAge}
            colaRate={colaRate}
          />
        )}
        {showSpouse && (
          <PersonPanel
            label="Spouse"
            fraAnnualBenefit={spouseAnnualSS!}
            currentAge={spouseCurrentAge!}
            deathAge={spouseDeathAge!}
            colaRate={colaRate}
          />
        )}
      </div>
    </section>
  )
}
