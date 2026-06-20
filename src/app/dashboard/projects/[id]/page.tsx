import { db } from '@/lib/firebase/admin'
import { getUser } from '@/lib/firebase/auth'
import { getProject } from '@/lib/firebase/db'
import { notFound } from 'next/navigation'
import { deleteDocument, createDocument, loadDemoDocument } from './actions'
import UploadDocumentModal from '@/components/UploadDocumentModal'
import Link from 'next/link'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  const project = await getProject(id)
  if (!project || !user || project.owner_id !== user.id) notFound()

  const docsSnap = await db.collection('documents')
    .where('project_id', '==', id)
    .orderBy('created_at', 'desc')
    .get()

  const documents = await Promise.all(
    docsSnap.docs.map(async (d) => {
      const countSnap = await db.collection('segments')
        .where('document_id', '==', d.id)
        .count()
        .get()
      return {
        id: d.id,
        filename: d.data().filename as string,
        segmentCount: countSnap.data().count,
      }
    }),
  )

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
              {project.source_locale.toUpperCase()} → {project.target_locale.toUpperCase()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={loadDemoDocument.bind(null, id)}>
              <button
                type="submit"
                className="rounded-xl glass-inset hover:bg-white/55 text-slate-800 text-sm font-semibold px-4 py-2 transition-colors border border-white/60"
              >
                Try demo file
              </button>
            </form>
            <UploadDocumentModal projectId={id} createDocument={createDocument} />
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border-dashed border-2 border-white/60">
          <p className="text-slate-600 text-sm">No documents yet.</p>
          <p className="text-slate-500 text-xs mt-1">Try the demo file or upload your own XLIFF.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="glass-card rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:shadow-lg hover:shadow-brand-500/15 transition-shadow group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{doc.filename}</p>
                <p className="text-xs text-slate-500 mt-0.5">{doc.segmentCount} segments</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
