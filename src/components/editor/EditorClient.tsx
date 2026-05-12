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
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← {project.name}
            </Link>
            <span className="text-gray-700">/</span>
            <span className="text-xs text-gray-300">{document.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{progress}%</span>
            </div>
            <span className="text-xs text-gray-500">
              {translated}/{segments.length} segments
            </span>
          </div>
        </div>
      </header>

      {/* Column headers */}
      <div className="grid grid-cols-2 border-b border-gray-800 bg-gray-900 flex-shrink-0" style={{ paddingRight: '320px' }}>
        <div className="px-4 py-2 border-r border-gray-800">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {project.source_language.toUpperCase()} — Source
          </span>
        </div>
        <div className="px-4 py-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {project.target_language.toUpperCase()} — Target
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
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
        <div className="w-80 border-l border-gray-800 bg-gray-900 flex-shrink-0 overflow-hidden flex flex-col">
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