'use client'

import { useState } from 'react'
import Link from 'next/link'
import SegmentRow from './SegmentRow'
import TMPanel from './TMPanel'
import ExportXliffButton from './ExportXliffButton'

interface Segment {
  id: string
  position: number
  source_text: string
  target_text: string
}

interface TMEntry {
  id: string
  source_text: string
  target_text: string
}

interface Props {
  project: { id: string; name: string; source_locale: string; target_locale: string }
  document: { id: string; filename: string }
  segments: Segment[]
  tmEntries: TMEntry[]
}

export default function EditorClient({ project, document, segments, tmEntries }: Props) {
  const [activeId, setActiveId] = useState<string | null>(segments[0]?.id ?? null)
  const [liveTargets, setLiveTargets] = useState<Record<string, string>>({})

  const activeSegment = segments.find(s => s.id === activeId)
  const activeSource = activeSegment?.source_text ?? ''

  function handleApplyTM(text: string) {
    if (!activeId) return
    setLiveTargets(prev => ({ ...prev, [activeId]: text }))
  }

  function targetOf(s: Segment) {
    return (liveTargets[s.id] ?? s.target_text).trim()
  }

  const translated = segments.filter(s => targetOf(s).length > 0).length
  const progress = segments.length > 0 ? Math.round((translated / segments.length) * 100) : 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden glass-card !p-0">
      <header className="glass-panel border-b border-white/50 flex-shrink-0 rounded-t-2xl">
        <div className="px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="text-xs text-slate-600 hover:text-brand-700 transition-colors font-medium shrink-0"
            >
              ← {project.name}
            </Link>
            <span className="text-slate-300 shrink-0">/</span>
            <span className="text-xs text-slate-800 font-medium truncate">{document.filename}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-white/50 rounded-full overflow-hidden border border-white/40">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 font-semibold tabular-nums">{progress}%</span>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline tabular-nums">
              {translated}/{segments.length} segments
            </span>
            <ExportXliffButton projectId={project.id} docId={document.id} />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 border-b border-white/50 glass-panel flex-shrink-0">
        <div className="px-4 py-2.5 border-r border-white/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {project.source_locale.toUpperCase()} — Source
          </span>
        </div>
        <div className="px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {project.target_locale.toUpperCase()} — Target
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-white/15">
        {segments.map(segment => (
          <SegmentRow
            key={segment.id}
            segment={{
              ...segment,
              target_text: liveTargets[segment.id] ?? segment.target_text,
            }}
            isActive={activeId === segment.id}
            projectId={project.id}
            docId={document.id}
            sourceLocale={project.source_locale}
            targetLocale={project.target_locale}
            onActivate={() => setActiveId(segment.id)}
            onTargetChange={(text) => setLiveTargets(prev => ({ ...prev, [segment.id]: text }))}
          />
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-white/50 glass-panel rounded-b-2xl">
        <TMPanel
          sourceText={activeSource}
          tmEntries={tmEntries}
          onApply={handleApplyTM}
        />
      </div>
    </div>
  )
}
