import { useState } from 'react'
import {
  ACA_REFERENCE_LINKS,
  fplAnnualDollars2026Contiguous,
  formatPercentFromDecimal,
  formatUsd0,
  PTC_APPLICABLE_FIGURE_HIGHLIGHTS_TY2025,
} from '../lib/acaPremiumSubsidyReference'

const linkClass =
  'font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:decoration-indigo-600 dark:hover:text-indigo-200'
const tableWrap =
  'mt-2 overflow-x-auto rounded-lg border border-indigo-200/80 bg-white/90 text-xs dark:border-indigo-800/60 dark:bg-slate-950/40'
const thCell = 'px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-indigo-900 dark:text-indigo-100'
const tdCell = 'px-2.5 py-1.5 tabular-nums text-slate-800 dark:text-slate-200'

const sectionTitle =
  'MAGI, federal poverty level, and marketplace premium help'

export function AcaSubsidyReferencePanel() {
  const [expanded, setExpanded] = useState(true)
  const fplRows = [1, 2, 3, 4].map((n) => {
    const fpl = fplAnnualDollars2026Contiguous(n)
    return { n, fpl }
  })

  return (
    <section
      className="mt-5 rounded-lg border border-indigo-200/70 bg-indigo-50/50 px-3 py-3 dark:border-indigo-800/50 dark:bg-indigo-950/25"
      aria-labelledby="aca-subsidy-reference-heading"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="aca-subsidy-reference-body"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left transition-colors hover:bg-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-indigo-50 dark:hover:bg-indigo-900/30 dark:focus:ring-indigo-500 dark:focus:ring-offset-indigo-950/80"
      >
        <span
          id="aca-subsidy-reference-heading"
          className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-200"
        >
          {sectionTitle}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-indigo-700 transition-transform dark:text-indigo-300 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        id="aca-subsidy-reference-body"
        role="region"
        aria-label={sectionTitle}
        hidden={!expanded}
      >
        <p className="mt-2 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
          For pre-65 coverage bought through the{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">Health Insurance Marketplace</strong>,
          eligibility for advance premium tax credits is based on{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">MAGI</strong> for the tax family
          relative to the{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">federal poverty guidelines</strong>.
          Lower MAGI (as a percent of FPL) generally means a{' '}
          <strong className="font-semibold text-slate-900 dark:text-slate-100">smaller required share of income</strong>{' '}
          toward the benchmark “second lowest cost silver plan” in your area, so the credit can be larger—subject
          to enrollment, household, and year-specific IRS rules.
        </p>

        <h4 className="mt-3 text-[11px] font-bold text-slate-900 dark:text-slate-100">
          2026 federal poverty guidelines (annual, 48 states + D.C.)
        </h4>
        <p className="text-[10px] leading-snug text-slate-600 dark:text-slate-400">
          HHS publishes these figures each January. Alaska and Hawaii use higher amounts (
          <a href={ACA_REFERENCE_LINKS.hhsPovertyGuidelines2026} className={linkClass} rel="noreferrer" target="_blank">
            HHS poverty guidelines
          </a>
          ).
        </p>
        <div className={tableWrap}>
          <table className="w-full min-w-[280px] border-collapse text-left">
            <thead>
              <tr className="border-b border-indigo-200/80 bg-indigo-100/40 dark:border-indigo-800/60 dark:bg-indigo-950/50">
                <th className={thCell}>People in household</th>
                <th className={thCell}>100% FPL (annual)</th>
                <th className={thCell}>Example: 150% FPL MAGI cap</th>
              </tr>
            </thead>
            <tbody>
              {fplRows.map(({ n, fpl }) => {
                const cap150 = fpl != null ? Math.round(fpl * 1.5) : null
                return (
                  <tr
                    key={n}
                    className="border-b border-indigo-100/80 last:border-0 dark:border-indigo-900/50"
                  >
                    <td className={tdCell}>{n}</td>
                    <td className={tdCell}>{fpl != null ? formatUsd0(fpl) : '—'}</td>
                    <td className={tdCell}>{cap150 != null ? formatUsd0(cap150) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400">
          “150% FPL MAGI cap” means household MAGI at exactly 150% of FPL for that size—illustrative only.
        </p>

        <h4 className="mt-4 text-[11px] font-bold text-slate-900 dark:text-slate-100">
          IRS applicable figure vs income as % of FPL (selected points)
        </h4>
        <p className="text-[10px] leading-snug text-slate-600 dark:text-slate-400">
          When reconciling the premium tax credit, Form 8962 uses your household income as a percentage of FPL to look
          up an <strong className="font-semibold text-slate-800 dark:text-slate-200">applicable figure</strong>: a cap
          on the share of your income applied toward the benchmark plan. Values below are from{' '}
          <a
            href={ACA_REFERENCE_LINKS.irsForm8962Instructions}
            className={linkClass}
            rel="noreferrer"
            target="_blank"
          >
            Instructions for Form 8962 (2025)
          </a>{' '}
          Table 2 (rounded for display). Congress and IRS update parameters—always use the instructions for your coverage
          / tax year.
        </p>
        <div className={tableWrap}>
          <table className="w-full min-w-[320px] border-collapse text-left">
            <thead>
              <tr className="border-b border-indigo-200/80 bg-indigo-100/40 dark:border-indigo-800/60 dark:bg-indigo-950/50">
                <th className={thCell}>Income (% of FPL)</th>
                <th className={thCell}>Applicable figure (max share of income)</th>
              </tr>
            </thead>
            <tbody>
              {PTC_APPLICABLE_FIGURE_HIGHLIGHTS_TY2025.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-indigo-100/80 last:border-0 dark:border-indigo-900/50"
                >
                  <td className={tdCell}>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{row.label}</span>
                    <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      ({row.fplPercent}% of FPL)
                    </span>
                  </td>
                  <td className={tdCell}>{formatPercentFromDecimal(row.applicableFigure)} of household income</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-slate-600 dark:text-slate-400">
          Between breakpoints the IRS table steps by one percentage point of FPL with small increments in the
          applicable figure (
          <a href={ACA_REFERENCE_LINKS.irsPublication974} className={linkClass} rel="noreferrer" target="_blank">
            IRS Publication 974 — Premium Tax Credit
          </a>
          ;{' '}
          <a href={ACA_REFERENCE_LINKS.healthcareGovFpl} className={linkClass} rel="noreferrer" target="_blank">
            HealthCare.gov — federal poverty level
          </a>
          ).
        </p>
      </div>
    </section>
  )
}
