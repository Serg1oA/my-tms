import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { deleteDocument } from './actions'
import { createDocument } from './actions'
import UploadDocumentModal from '@/components/UploadDocumentModal'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-800 text-gray-400',
  in_progress: 'bg-yellow-950 text-yellow-400',
  done: 'bg-green-950 text-green-400',
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
        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          ← Projects
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-xl font-semibold text-white">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {project.source_language.toUpperCase()} → {project.target_language.toUpperCase()}
            </p>
          </div>
          <UploadDocumentModal projectId={id} createDocument={createDocument} />
        </div>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="border border-dashed border-gray-800 rounded-xl p-16 text-center">
          <p className="text-gray-400 text-sm">No documents yet.</p>
          <p className="text-gray-600 text-xs mt-1">Upload a .txt file to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const segmentCount = (doc.segments as unknown as [{ count: number }])[0]?.count ?? 0
            return (
              <div
                key={doc.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-700 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{segmentCount} segments</p>
                  </div>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_STYLES[doc.status]}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <form action={deleteDocument.bind(null, id, doc.id)}>
                    <button
                      type="submit"
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/projects/${id}/editor/${doc.id}`}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-3 py-1.5 transition-colors"
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