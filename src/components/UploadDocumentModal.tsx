'use client'

import { useState, useRef } from 'react'
import { MAX_UPLOAD_FILE_BYTES, formatSize } from '@/lib/uploads'

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
  const [srxName, setSrxName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const srxRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
  }

  function handleSrx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setSrxName(file ? file.name : null)
  }

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
    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      setError(`Document is too large (${formatSize(file.size)}). Max ${formatSize(MAX_UPLOAD_FILE_BYTES)}.`)
      setLoading(false)
      return
    }

    const srx = srxRef.current?.files?.[0]
    if (srx && srx.size > MAX_UPLOAD_FILE_BYTES) {
      setError(`SRX file is too large (${formatSize(srx.size)}). Max ${formatSize(MAX_UPLOAD_FILE_BYTES)}.`)
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    if (srx && srx.size > 0) formData.append('srx', srx)

    const result = await createDocument(projectId, formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setFileName(null)
      setSrxName(null)
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
        + Upload document
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative glass-card rounded-2xl p-6 md:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl shadow-brand-900/15">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-2">Upload document</h2>
            <p className="text-xs text-slate-600 mb-4">
              For <span className="font-semibold text-slate-800">.txt</span> and{' '}
              <span className="font-semibold text-slate-800">.docx</span> files, segments are split after{' '} <span className="font-semibold">. ! ? : ;</span> and line breaks.{' '}
              <br />
              For <span className="font-semibold text-slate-800">.xliff / .xlf</span> files, segments are split per{' '} <span className="font-semibold">trans-unit</span>.
              <br />
              <br />
              Max 1 MB per file.
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <label className="block w-full border-2 border-dashed border-white/70 hover:border-brand-300 rounded-2xl p-6 text-center cursor-pointer transition-colors glass-inset">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.docx,.xliff,.xlf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={handleFile}
                />
                {fileName ? (
                  <div>
                    <p className="text-sm text-slate-900 font-semibold">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600">Document: .txt, .docx, .xliff, .xlf</p>
                  </div>
                )}
              </label>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">Optional SRX (segmentation rules)</p>
                <label className="block w-full border border-white/60 hover:border-brand-300 rounded-xl px-3 py-2.5 text-center cursor-pointer transition-colors glass-inset text-xs text-slate-600">
                  <input
                    ref={srxRef}
                    type="file"
                    accept=".srx,.xml,application/xml,text/xml"
                    className="hidden"
                    onChange={handleSrx}
                  />
                  {srxName ?? 'No SRX selected'}
                </label>
              </div>

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
