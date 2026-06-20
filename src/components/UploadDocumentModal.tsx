'use client'

import { useState, useRef } from 'react'

const MAX_UPLOAD_BYTES = 1000 * 1024 // 1 MB — keep in sync with actions.ts

export default function UploadDocumentModal({
  projectId,
  createDocument,
}: {
  projectId: string
  createDocument: (projectId: string, formData: FormData) => Promise<{ error: string } | undefined>
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Please select a file')
      setLoading(false)
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('File is too large. Maximum per file is 1 MB.')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    const result = await createDocument(projectId, formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setFileName(null)
      formRef.current?.reset()
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 shadow-lg shadow-brand-500/25 transition-colors w-fit"
      >
        + Upload XLIFF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative glass-card rounded-2xl p-6 md:p-7 w-full max-w-md shadow-2xl shadow-brand-900/15">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-2">Upload XLIFF</h2>
            <p className="text-xs text-slate-600 mb-4">
              One segment per <span className="font-semibold text-slate-800">trans-unit</span> (XLIFF 1.2) or{' '}
              <span className="font-semibold text-slate-800">unit</span> (XLIFF 2). Max 1 MB.
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <label className="block w-full border-2 border-dashed border-white/70 hover:border-brand-300 rounded-2xl p-8 text-center cursor-pointer transition-colors glass-inset">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xliff,.xlf,application/xliff+xml,text/xml"
                  className="hidden"
                  onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
                />
                {fileName ? (
                  <div>
                    <p className="text-sm text-slate-900 font-semibold">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">.xliff or .xlf</p>
                )}
              </label>

              {error && (
                <p className="text-red-700 text-xs bg-red-50/90 border border-red-200/80 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 glass-inset hover:bg-white/55 text-slate-800 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !fileName}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-brand-500/20 transition-colors"
                >
                  {loading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
