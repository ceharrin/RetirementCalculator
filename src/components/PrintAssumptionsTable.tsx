import type { ReactNode } from 'react'
import type { FormState } from '../types/form'

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatPercentWhole(n: number): string {
  return Number.isInteger(n) ? `${n}%` : `${Number(n.toFixed(2))}%`
}

function sectionHeader(label: string) {
  return (
    <tr key={label}>
      <th
        colSpan={2}
        scope="colgroup"
        className="border-b border-slate-400 bg-slate-100 px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-800"
      >
        {label}
      </th>
    </tr>
  )
}

function assumptionRow(label: string, value: string) {
  return (
    <tr key={label} className="border-b border-slate-200">
      <td className="px-2 py-1.5 text-left text-sm text-slate-700">{label}</td>
      <td className="px-2 py-1.5 text-right text-sm font-medium tabular-nums text-slate-900">
        {value}
      </td>
    </tr>
  )
}

export function PrintAssumptionsTable(props: { form: FormState }) {
  const { form } = props

  const survivorSsLabel =
    form.survivorSSMode === 'higherOfTwo'
      ? 'Higher of two benefits'
      : 'Custom annual benefit'

  const rows: ReactNode[] = []

  rows.push(sectionHeader('Household & longevity'))
  rows.push(assumptionRow('Planning start year', String(form.startYear)))
  rows.push(
    assumptionRow(
      'Projection timing',
      form.projectionCadence === 'monthly'
        ? 'Monthly (12 steps per year)'
        : 'Annual (one step per year)',
    ),
  )
  rows.push(
    assumptionRow(
      'Projection mode',
      form.projectionMode === 'monte_carlo'
        ? `Monte Carlo bootstrap (${form.monteCarloTrials} trials)`
        : 'Deterministic (fixed annual return and inflation)',
    ),
  )
  if (form.projectionMode === 'monte_carlo') {
    rows.push(
      assumptionRow(
        'Monte Carlo seed',
        form.monteCarloSeed.trim() === ''
          ? 'Automatic (see on-screen summary after run)'
          : form.monteCarloSeed.trim(),
      ),
    )
    rows.push(
      assumptionRow(
        'Historical bootstrap',
        'US CPI calendar-year inflation + S&P 500 total return (1970–2023), paired by year, sampled with replacement each projection year',
      ),
    )
  }
  rows.push(assumptionRow('Retiree current age', String(form.retireeCurrentAge)))
  rows.push(assumptionRow('Include spouse', form.hasSpouse ? 'Yes' : 'No'))
  if (form.hasSpouse) {
    rows.push(assumptionRow('Spouse current age', String(form.spouseCurrentAge)))
  }
  rows.push(assumptionRow('Retiree age at death', String(form.retireeDeathAge)))
  if (form.hasSpouse) {
    rows.push(assumptionRow('Spouse age at death', String(form.spouseDeathAge)))
  }

  rows.push(sectionHeader('Retirement spending & portfolio'))
  rows.push(assumptionRow('Retiree retirement age', String(form.retireeRetirementAge)))
  rows.push(assumptionRow('Annual retirement expenses', formatMoney(form.annualExpenseAtRetirementStart)))
  rows.push(
    assumptionRow('Real spending decline starts (age)', String(form.spendingDeclineStartAge)),
  )
  rows.push(
    assumptionRow('Annual real spending decline', formatPercentWhole(form.spendingDeclinePercent)),
  )
  rows.push(assumptionRow('Current retirement savings', formatMoney(form.currentSavings)))
  rows.push(
    assumptionRow(
      'Annual portfolio return',
      form.projectionMode === 'monte_carlo'
        ? 'Not used (Monte Carlo draws historical returns each year)'
        : formatPercentWhole(form.portfolioReturnPercent),
    ),
  )
  rows.push(
    assumptionRow(
      'Annual inflation',
      form.projectionMode === 'monte_carlo'
        ? 'Not used (Monte Carlo draws historical inflation each retirement year)'
        : formatPercentWhole(form.inflationPercent),
    ),
  )
  rows.push(
    assumptionRow(
      'Guyton–Klinger spending guardrails',
      form.useSpendingGuardrails ? 'Yes (±20% rate vs anchor, ±10% spending step)' : 'No',
    ),
  )

  rows.push(sectionHeader('Healthcare (MAGI prep)'))
  rows.push(
    assumptionRow('Tax-deferred % (IRA, 401(k), etc.)', formatPercentWhole(form.portfolioTaxDeferredPercent)),
  )
  rows.push(assumptionRow('Roth %', formatPercentWhole(form.portfolioRothPercent)))
  rows.push(assumptionRow('Taxable brokerage %', formatPercentWhole(form.portfolioTaxablePercent)))
  rows.push(assumptionRow('HSA %', formatPercentWhole(form.portfolioHsaPercent)))
  rows.push(
    assumptionRow(
      'Taxable withdrawal MAGI share',
      formatPercentWhole(form.taxableWithdrawalMagiPercent),
    ),
  )
  rows.push(
    assumptionRow(
      'Marketplace household size (MAGI / FPL helper)',
      String(form.acaMarketplaceHouseholdSize),
    ),
  )
  rows.push(
    assumptionRow(
      'Estimated annual MAGI (subsidy context)',
      form.acaMarketplaceMagiEstimate === null
        ? 'Not entered'
        : formatMoney(form.acaMarketplaceMagiEstimate),
    ),
  )

  rows.push(sectionHeader('Social Security'))
  rows.push(
    assumptionRow(
      'Model 23% SS benefit cut from 2032',
      form.modelSsBenefitCutFrom2032 ? 'Yes (entered amounts × 77%)' : 'No',
    ),
  )
  rows.push(
    assumptionRow('Annual SS COLA', formatPercentWhole(form.socialSecurityColaPercent)),
  )
  rows.push(assumptionRow('Retiree claim age', String(form.retireeClaimAge)))
  rows.push(assumptionRow('Retiree annual benefit', formatMoney(form.retireeAnnualSS)))
  if (form.hasSpouse) {
    rows.push(assumptionRow('Spouse claim age', String(form.spouseClaimAge)))
    rows.push(assumptionRow('Spouse annual benefit', formatMoney(form.spouseAnnualSS)))
  }
  rows.push(assumptionRow('Other annual income', formatMoney(form.otherAnnualIncome)))
  rows.push(assumptionRow('Other income starts (retiree age)', String(form.otherIncomeStartAge)))

  rows.push(sectionHeader('Windfalls'))
  if (form.windfalls.length === 0) {
    rows.push(assumptionRow('Windfalls', 'None'))
  } else {
    form.windfalls.forEach((w, idx) => {
      rows.push(
        assumptionRow(
          w.title.trim().length > 0 ? w.title : `Windfall ${idx + 1}`,
          `${formatMoney(w.amount)} at age ${w.startAge}`,
        ),
      )
    })
  }

  rows.push(sectionHeader('One-time expenses'))
  if (form.oneTimeExpenses.length === 0) {
    rows.push(assumptionRow('One-time expenses', 'None'))
  } else {
    form.oneTimeExpenses.forEach((e, idx) => {
      rows.push(
        assumptionRow(
          e.title.trim().length > 0 ? e.title : `One-time expense ${idx + 1}`,
          `${formatMoney(e.amount)} at age ${e.startAge}`,
        ),
      )
    })
  }

  if (form.hasSpouse) {
    rows.push(sectionHeader('After first death'))
    rows.push(
      assumptionRow('Survivor expenses (% of joint)', formatPercentWhole(form.survivorExpensePercent)),
    )
    rows.push(assumptionRow('Survivor Social Security', survivorSsLabel))
    if (form.survivorSSMode === 'custom') {
      rows.push(
        assumptionRow('Custom survivor benefit', formatMoney(form.customSurvivorAnnualSS)),
      )
    }
  }

  return (
    <div className="print-only print-split-table-wrap mb-5">
      <h3 className="mb-2 text-sm font-bold text-slate-900">Assumed values</h3>
      <table className="print-split-table w-full border-collapse border border-slate-300 text-sm">
        <tbody>{rows}</tbody>
      </table>
    </div>
  )
}
