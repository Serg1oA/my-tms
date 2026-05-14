'use client'

import { useState } from 'react'
import Link from 'next/link'
import SegmentRow from './SegmentRow'
import TMPanel from './TMPanel'
import { similarity } from '@/lib/tm'

interface Segment {
  id: string
  order_index: number
  source_text: string
  target_text: string
  status: string
}

interface TMEntry {
  id: string
  source_text: string
  target_text: string
}

interface Props {
  project: { id: string; name: string; source_language: string; target_language: string }
  document: { id: string; name: string }
  segments: Segment[]
  tmEntries: TMEntry[]
}

export default function EditorClient({ project, document, segments, tmEntries }: Props) {
  const [activeId, setActiveId] = useState<string | null>(segments[0]?.id ?? null)
  const [liveTargets, setLiveTargets] = useState<Record<string, string>>({})

  const activeSegment = segments.find(s => s.id === activeId)
  const activeSource = activeSegment?.source_text ?? ''

  const activeTMEntries = tmEntries.filter(e => similarity(activeSource, e.source_text) >= 0.5)

  function handleApplyTM(text: string) {
    if (!activeId) return
    setLiveTargets(prev => ({ ...prev, [activeId]: text }))
  }

  const translated = segments.filter(s => s.status === 'translated' || s.status === 'reviewed').length
  const progress = segments.length > 0 ? Math.round((translated / segments.length) * 100) : 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden glass-card !p-0">
      {/* Top bar */}
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
            <span className="text-xs text-slate-800 font-medium truncate">{document.name}</span>
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
          </div>
        </div>
      </header>

      {/* Column headers */}
      <div className="grid grid-cols-2 border-b border-white/50 glass-panel flex-shrink-0" style={{ paddingRight: '320px' }}>
        <div className="px-4 py-2.5 border-r border-white/50">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {project.source_language.toUpperCase()} — Source
          </span>
        </div>
        <div className="px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {project.target_language.toUpperCase()} — Target
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden min-h-0 bg-white/15">
        {/* Segments */}
        <div className="flex-1 overflow-y-auto">
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
              sourceLanguage={project.source_language}
              targetLanguage={project.target_language}
              onActivate={() => setActiveId(segment.id)}
              onTargetChange={(text) => setLiveTargets(prev => ({ ...prev, [segment.id]: text }))}
            />
          ))}
        </div>

        {/* TM Panel */}
        <div className="w-80 border-l border-white/50 glass-panel flex-shrink-0 overflow-hidden flex flex-col rounded-br-2xl">
          <TMPanel
            sourceText={activeSource}
            tmEntries={activeTMEntries}
            onApply={handleApplyTM}
          />
        </div>
      </div>
    </div>
  )
}
