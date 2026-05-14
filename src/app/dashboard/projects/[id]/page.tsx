import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { deleteDocument, createDocument, importTmx } from './actions'
import UploadDocumentModal from '@/components/UploadDocumentModal'
import UploadTmxModal from '@/components/UploadTmxModal'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-200/90 text-slate-700 border border-slate-300/50',
  in_progress: 'bg-amber-100/95 text-amber-900 border border-amber-200/60',
  done: 'bg-emerald-100/95 text-emerald-900 border border-emerald-200/60',
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = (await params)
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, segments(count)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard" className="text-xs text-slate-600 hover:text-brand-700 transition-colors font-medium">
          ← Projects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">{project.name}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {project.source_language.toUpperCase()} → {project.target_language.toUpperCase()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UploadDocumentModal projectId={id} createDocument={createDocument} />
            <UploadTmxModal projectId={id} importTmx={importTmx} />
          </div>
        </div>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="glass-card rounded-2xl p-16 text-center border-dashed border-2 border-white/60">
          <p className="text-slate-600 text-sm">No documents yet.</p>
          <p className="text-slate-500 text-xs mt-1">Upload .txt, .docx, or XLIFF — or import a TMX for translation memory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const segmentCount = (doc.segments as unknown as [{ count: number }])[0]?.count ?? 0
            return (
              <div
                key={doc.id}
                className="glass-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-lg hover:shadow-brand-500/15 transition-shadow group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{segmentCount} segments</p>
                  </div>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold w-fit ${STATUS_STYLES[doc.status]}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <form action={deleteDocument.bind(null, id, doc.id)}>
                    <button
                      type="submit"
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 font-medium"
                    >
                      Delete
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/projects/${id}/editor/${doc.id}`}
                    className="text-xs glass-inset hover:bg-white/55 text-slate-800 font-semibold rounded-xl px-3 py-2 transition-colors shadow-sm"
                  >
                    Open editor →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
