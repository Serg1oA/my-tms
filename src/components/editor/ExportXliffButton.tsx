'use client'

import { useState } from 'react'
import { exportXliff } from '@/app/dashboard/projects/[id]/actions'

export default function ExportXliffButton({
  projectId,
  docId,
}: {
  projectId: string
  docId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const result = await exportXliff(projectId, docId)
    if ('error' in result && result.error) {
      setLoading(false)
      return
    }
    if ('xml' in result && result.xml) {
      const blob = new Blob([result.xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? 'export.xliff'
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="text-xs glass-inset hover:bg-white/55 text-slate-800 font-semibold rounded-xl px-3 py-1.5 transition-colors shadow-sm disabled:opacity-50"
    >
      {loading ? 'Exporting…' : 'Export XLIFF'}
    </button>
  )
}
