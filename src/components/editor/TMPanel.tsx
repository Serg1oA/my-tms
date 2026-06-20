'use client'

interface TMEntry {
  id: string
  source_text: string
  target_text: string
}

interface Props {
  sourceText: string
  tmEntries: TMEntry[]
  onApply: (text: string) => void
}

export default function TMPanel({ sourceText, tmEntries, onApply }: Props) {
  const scored = tmEntries
    .map(entry => ({ ...entry, score: similarity(sourceText, entry.source_text) }))
    .filter(e => e.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return (
    <div className="px-4 py-3">
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
        Translation Memory
      </h3>

      {scored.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">No TM matches — confirm a segment to build memory</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {scored.map(entry => (
            <div
              key={entry.id}
              className="flex-shrink-0 w-64 glass-inset rounded-xl p-3 hover:bg-white/35 transition-colors"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`text-xs font-semibold rounded-md px-1.5 py-0.5 border ${scoreBadgeClass(entry.score)}`}>
                  {scoreLabel(entry.score)} · {Math.round(entry.score * 100)}%
                </span>
                <button
                  onClick={() => onApply(entry.target_text)}
                  className="text-xs text-brand-700 hover:text-brand-900 font-semibold transition-colors shrink-0"
                >
                  Apply →
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-1 line-clamp-2">{entry.source_text}</p>
              <p className="text-xs text-slate-900 font-medium line-clamp-2">{entry.target_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ponytail: Levenshtein similarity inlined here; swap for a TM library if corpus grows large.
function similarity(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  const m = al.length, n = bl.length
  if (m === 0 || n === 0) return 0

  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = al[i - 1] === bl[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return 1 - dp[m][n] / Math.max(m, n)
}

function scoreLabel(score: number): string {
  if (score >= 1) return 'Exact'
  if (score >= 0.85) return 'High'
  if (score >= 0.6) return 'Fuzzy'
  return 'Low'
}

function scoreBadgeClass(score: number): string {
  if (score >= 1) return 'bg-emerald-100/95 text-emerald-900 border-emerald-200/60'
  if (score >= 0.85) return 'bg-sky-100/95 text-sky-900 border-sky-200/60'
  if (score >= 0.6) return 'bg-amber-100/95 text-amber-900 border-amber-200/60'
  return 'bg-slate-200/90 text-slate-700 border-slate-300/50'
}
