'use client'

import { similarity, scoreLabel, scoreBadgeClass } from '@/lib/tm'

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
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-white/50">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Translation Memory
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {scored.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-slate-500">No TM matches found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/40">
            {scored.map(entry => (
              <div key={entry.id} className="px-4 py-3 hover:bg-white/25 transition-colors">
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
    </div>
  )
}
