'use client'

import { useState, useRef } from 'react'

export default function UploadDocumentModal({ projectId, createDocument }: { 
  projectId: string
  createDocument: (projectId: string, formData: FormData) => Promise<{ error: string } | undefined>
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please select a file'); setLoading(false); return }

    const content = await file.text()
    const formData = new FormData()
    formData.set('name', file.name)
    formData.set('content', content)

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
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
      >
        + Upload document
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-semibold text-white mb-5">Upload document</h2>
            <p className="text-xs text-gray-400 mb-5">
              Upload a <span className="text-gray-300">.txt</span> file. Each line will become a translatable segment.
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <label className="block w-full border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFile}
                />
                {fileName ? (
                  <div>
                    <p className="text-sm text-white font-medium">{fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-400">Click to select a <span className="text-white">.txt</span> file</p>
                    <p className="text-xs text-gray-600 mt-1">Each line becomes a segment</p>
                  </div>
                )}
              </label>

              {error && (
                <p className="text-red-400 text-xs bg-red-950 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !fileName}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
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