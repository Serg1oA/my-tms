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
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Translation Memory
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {scored.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-600">No TM matches found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {scored.map(entry => (
              <div key={entry.id} className="px-4 py-3 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${scoreBadgeClass(entry.score)}`}>
                    {scoreLabel(entry.score)} · {Math.round(entry.score * 100)}%
                  </span>
                  <button
                    onClick={() => onApply(entry.target_text)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Apply →
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-1 line-clamp-2">{entry.source_text}</p>
                <p className="text-xs text-white line-clamp-2">{entry.target_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}