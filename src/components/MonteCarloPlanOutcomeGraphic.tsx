import { monteCarloOutlookScore, type MonteCarloResult } from '../lib/monteCarloBootstrap'

interface MonteCarloPlanOutcomeGraphicProps {
  result: MonteCarloResult
}

function verdict(score: number, p10: number, p50: number) {
  if (p50 <= 0) {
    return {
      title: 'Simulated outlook: severe stress',
      tone: 'rose' as const,
      detail:
        'Median final-year balance is not positive across trials—paths often end depleted under this bootstrap.',
    }
  }
  if (score >= 78 && p10 >= 0) {
    return {
      title: 'Simulated outlook: stronger support',
      tone: 'emerald' as const,
      detail:
        'Most bootstrapped paths avoided portfolio shortfalls, and the weak tail (p10) still looks resilient in this model.',
    }
  }
  if (score >= 52) {
    return {
      title: 'Simulated outlook: mixed',
      tone: 'amber' as const,
      detail:
        'A meaningful share of paths hit a shortfall or a thin ending balance—worth reviewing spending, timing, or savings.',
    }
  }
  return {
    title: 'Simulated outlook: elevated doubt',
    tone: 'rose' as const,
    detail:
      'Many paths show shortfalls or a stressed ending balance—treat this as a prompt to stress-test assumptions further.',
  }
}

const toneRing: Record<
  'emerald' | 'amber' | 'rose',
  { stroke: string; text: string; bg: string; border: string }
> = {
  emerald: {
    stroke: '#10b981',
    text: 'text-emerald-900 dark:text-emerald-100',
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    border: 'border-emerald-200/90 dark:border-emerald-800/50',
  },
  amber: {
    stroke: '#f59e0b',
    text: 'text-amber-950 dark:text-amber-100',
    bg: 'bg-amber-50/90 dark:bg-amber-950/35',
    border: 'border-amber-200/90 dark:border-amber-800/50',
  },
  rose: {
    stroke: '#f43f5e',
    text: 'text-rose-950 dark:text-rose-100',
    bg: 'bg-rose-50/90 dark:bg-rose-950/35',
    border: 'border-rose-200/90 dark:border-rose-800/50',
  },
}

export function MonteCarloPlanOutcomeGraphic({ result }: MonteCarloPlanOutcomeGraphicProps) {
  const noShortfallPct = (1 - result.everShortfallFraction) * 100
  const shortfallPct = result.everShortfallFraction * 100
  const score = monteCarloOutlookScore(result)
  const v = verdict(score, result.finalEndBalanceP10, result.finalEndBalanceP50)
  const ring = toneRing[v.tone]

  const r = 52
  const cx = 64
  const cy = 64

  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-5 shadow-sm print:break-inside-avoid ${ring.bg} ${ring.border}`}
      role="img"
      aria-label={`Monte Carlo outlook score ${score} out of 100. ${noShortfallPct.toFixed(
        0,
      )} percent of paths had no portfolio shortfall.`}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex w-36 shrink-0 flex-col items-center sm:w-40">
          <svg width="144" height="72" viewBox="0 0 128 72" className="text-slate-200 dark:text-slate-600">
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke={ring.stroke}
              strokeWidth="12"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${score} ${100 - score}`}
            />
          </svg>
          <div className="-mt-6 text-center">
            <p className={`text-3xl font-bold tabular-nums leading-none ${ring.text}`}>{score}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Outlook score
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h3 className={`text-base font-bold sm:text-lg ${ring.text}`}>{v.title}</h3>
            <p className="mt-1 text-sm leading-snug text-slate-700 dark:text-slate-300">{v.detail}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-slate-200/80 dark:bg-slate-900/50 dark:ring-slate-700/80">
              {noShortfallPct > 0 ? (
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-[width] duration-500"
                  style={{ width: `${noShortfallPct}%`, minWidth: noShortfallPct > 0 ? '2px' : undefined }}
                  title={`${noShortfallPct.toFixed(1)}% of trials with no portfolio shortfall`}
                />
              ) : null}
              {shortfallPct > 0 ? (
                <div
                  className="bg-gradient-to-r from-rose-500 to-rose-400 transition-[width] duration-500"
                  style={{ width: `${shortfallPct}%`, minWidth: shortfallPct > 0 ? '2px' : undefined }}
                  title={`${shortfallPct.toFixed(1)}% of trials with at least one shortfall year`}
                />
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-medium sm:justify-between">
              <span className="text-emerald-800 dark:text-emerald-300">
                No shortfall: {noShortfallPct.toFixed(1)}%
              </span>
              <span className="text-rose-800 dark:text-rose-300">
                Any-year shortfall: {shortfallPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
            Score blends shortfall frequency across trials with how low the{' '}
            <span className="font-semibold text-slate-600 dark:text-slate-300">final-year p10</span> balance
            looks—illustrative only, not a probability of retirement success.
          </p>
        </div>
      </div>
    </div>
  )
}
