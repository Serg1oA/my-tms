'use client'

import { useState, useRef, useEffect } from 'react'
import { saveSegment } from '@/app/dashboard/projects/[id]/actions'

interface Segment {
  id: string
  position: number
  source_text: string
  target_text: string
}

interface Props {
  segment: Segment
  isActive: boolean
  projectId: string
  docId: string
  onActivate: () => void
  onTargetChange: (text: string) => void
}

export default function SegmentRow({
  segment, isActive, projectId, docId,
  onActivate, onTargetChange
}: Props) {
  const [target, setTarget] = useState(segment.target_text)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const translated = target.trim().length > 0

  useEffect(() => {
    if (isActive) textareaRef.current?.focus()
  }, [isActive])

  useEffect(() => {
    setTarget(segment.target_text)
  }, [segment.target_text])

  async function handleConfirm() {
    if (!target.trim()) return
    setSaving(true)
    await saveSegment(segment.id, target, projectId, docId)
    setSaving(false)
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      await handleConfirm()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTarget(e.target.value)
    onTargetChange(e.target.value)
  }

  return (
    <div
      className={`grid grid-cols-2 border-b border-white/40 transition-colors cursor-pointer
        ${isActive ? 'bg-brand-100/45 backdrop-blur-sm' : 'hover:bg-white/25'}`}
      onClick={onActivate}
    >
      <div className="col-span-2 flex items-center gap-2 px-4 pt-2">
        <span className="text-xs text-slate-500 font-mono tabular-nums">{segment.position + 1}</span>
        <span className={`text-xs rounded-md px-1.5 py-0.5 font-semibold border ${
          translated
            ? 'bg-sky-100/95 text-sky-900 border-sky-200/60'
            : 'bg-slate-200/90 text-slate-700 border-slate-300/50'
        }`}>
          {translated ? 'translated' : 'untranslated'}
        </span>
      </div>

      <div className="px-4 py-2 border-r border-white/40">
        <p className="text-sm text-slate-800 leading-relaxed">{segment.source_text}</p>
      </div>

      <div className="px-4 py-2">
        {isActive ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={target}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full glass-inset border-brand-300/80 rounded-xl px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/50 transition-shadow placeholder-slate-400"
              placeholder="Enter translation…"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">⌘+Enter to confirm</p>
              <button
                onClick={e => { e.stopPropagation(); handleConfirm() }}
                disabled={saving || !target.trim()}
                className="text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-lg px-3 py-1.5 shadow-sm transition-colors"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${target ? 'text-slate-900' : 'text-slate-400 italic'}`}>
            {target || 'Click to translate…'}
          </p>
        )}
      </div>
    </div>
  )
}
