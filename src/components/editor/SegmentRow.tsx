'use client'

import { useState, useRef, useEffect } from 'react'
import { saveSegment, getMT, evaluateSegment } from '@/app/dashboard/projects/[id]/actions'

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
  sourceLocale: string
  targetLocale: string
  onActivate: () => void
  onTargetChange: (text: string) => void
}

export default function SegmentRow({
  segment, isActive, projectId, docId, sourceLocale, targetLocale,
  onActivate, onTargetChange
}: Props) {
  const [target, setTarget] = useState(segment.target_text)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [score, setScore] = useState('') // Volatile local state memory for now (score resets if layout unmounts). Upgradable to a DB property later.
  
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

  async function runMT(engine: 'deepl' | 'gemini') {
    setBusy(true)
    const res = await getMT(segment.source_text, sourceLocale, targetLocale, engine)
    if (res) {
      setTarget(res)
      onTargetChange(res)
    }
    setBusy(false)
  }

  async function runEval() {
    setBusy(true)
    const res = await evaluateSegment(segment.source_text, target, sourceLocale, targetLocale)
    setScore(res)
    setBusy(false)
  }

  return (
    <div
      className={`grid grid-cols-2 border-b border-white/40 transition-colors cursor-pointer
        ${isActive ? 'bg-brand-100/45 backdrop-blur-sm' : 'hover:bg-white/25'}`}
      onClick={onActivate}
    >
      <div className="col-span-2 flex items-center justify-between px-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono tabular-nums">{segment.position + 1}</span>
          <span className={`text-xs rounded-md px-1.5 py-0.5 font-semibold border ${
            translated ? 'bg-sky-100/95 text-sky-900 border-sky-200/60' : 'bg-slate-200/90 text-slate-700 border-slate-300/50'
          }`}>
            {translated ? 'translated' : 'untranslated'}
          </span>
        </div>
        {score && !isActive && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">{score.split('|')[0]}</span>}
      </div>

      <div className="px-4 py-2 border-r border-white/40">
        <p className="text-sm text-slate-800 leading-relaxed">{segment.source_text}</p>
      </div>

      <div className="px-4 py-2">
        {isActive ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 border-b border-dashed border-slate-200 pb-2" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                disabled={busy}
                onClick={() => runMT('deepl')}
                className="text-xs bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg px-3 py-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                DeepL MT
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runMT('gemini')}
                className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg px-3 py-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                Gemini MT
              </button>
              <button
                type="button"
                disabled={busy || !target.trim()}
                onClick={runEval}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5 shadow-sm transition-colors ml-auto disabled:opacity-50"
              >
                {busy ? 'Evaluating…' : 'Quality Score'}
              </button>
            </div>

            {score && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-slate-900">{score.split('|')[0]}</span>
                <p className="text-slate-500 mt-0.5">{score.split('|')[1] || ''}</p>
              </div>
            )}

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
          <div>
            <p className={`text-sm leading-relaxed ${target ? 'text-slate-900' : 'text-slate-400 italic'}`}>
              {target || 'Click to translate…'}
            </p>
            {score && <p className="text-[11px] text-slate-400 italic mt-1">{score}</p>}
          </div>
        )}
      </div>
    </div>
  )
}