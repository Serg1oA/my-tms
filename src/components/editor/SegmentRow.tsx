'use client'

import { useState, useRef, useEffect } from 'react'
import { saveSegment, addToTM } from '@/lib/editor-actions'

interface Segment {
  id: string
  order_index: number
  source_text: string
  target_text: string
  status: string
}

interface Props {
  segment: Segment
  isActive: boolean
  projectId: string
  docId: string
  sourceLanguage: string
  targetLanguage: string
  onActivate: () => void
  onTargetChange: (text: string) => void
}

const STATUS_STYLES: Record<string, string> = {
  untranslated: 'bg-gray-800 text-gray-400',
  draft: 'bg-yellow-950 text-yellow-400',
  translated: 'bg-blue-950 text-blue-400',
  reviewed: 'bg-green-950 text-green-400',
}

export default function SegmentRow({
  segment, isActive, projectId, docId,
  sourceLanguage, targetLanguage,
  onActivate, onTargetChange
}: Props) {
  const [target, setTarget] = useState(segment.target_text)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive) textareaRef.current?.focus()
  }, [isActive])

  useEffect(() => {
    setTarget(segment.target_text)
  }, [segment.target_text])

  async function handleConfirm() {
    if (!target.trim()) return
    setSaving(true)
    await saveSegment(segment.id, target, 'translated', projectId, docId)
    await addToTM(segment.source_text, target, sourceLanguage, targetLanguage)
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
      className={`grid grid-cols-2 border-b border-gray-800 transition-colors cursor-pointer
        ${isActive ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}
      onClick={onActivate}
    >
      {/* Index */}
      <div className="col-span-2 flex items-center gap-2 px-4 pt-2">
        <span className="text-xs text-gray-600 font-mono">{segment.order_index + 1}</span>
        <span className={`text-xs rounded px-1.5 py-0.5 ${STATUS_STYLES[segment.status]}`}>
          {segment.status}
        </span>
      </div>

      {/* Source */}
      <div className="px-4 py-2 border-r border-gray-800">
        <p className="text-sm text-gray-300 leading-relaxed">{segment.source_text}</p>
      </div>

      {/* Target */}
      <div className="px-4 py-2">
        {isActive ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={target}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full bg-gray-900 border border-indigo-500 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-400 transition-colors"
              placeholder="Enter translation…"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">⌘+Enter to confirm</p>
              <button
                onClick={e => { e.stopPropagation(); handleConfirm() }}
                disabled={saving || !target.trim()}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 transition-colors"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${target ? 'text-white' : 'text-gray-600 italic'}`}>
            {target || 'Click to translate…'}
          </p>
        )}
      </div>
    </div>
  )
}