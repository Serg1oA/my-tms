import { db } from '@/lib/firebase/admin'
import { getUser } from '@/lib/firebase/auth'
import { getProject } from '@/lib/firebase/db'
import { notFound } from 'next/navigation'
import EditorClient from '@/components/editor/EditorClient'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id, docId } = await params
  const user = await getUser()
  const project = await getProject(id)
  if (!project || !user || project.owner_id !== user.id) notFound()

  const docSnap = await db.collection('documents').doc(docId).get()
  if (!docSnap.exists || docSnap.data()?.project_id !== id) notFound()
  const document = { id: docSnap.id, filename: docSnap.data()!.filename as string }

  const segSnap = await db.collection('segments')
    .where('document_id', '==', docId)
    .orderBy('position')
    .get()

  const segments = segSnap.docs.map(d => ({
    id: d.id,
    position: d.data().position as number,
    source_text: d.data().source_text as string,
    target_text: d.data().target_text as string,
  }))

  const docsSnap = await db.collection('documents').where('project_id', '==', id).get()
  const docIds = docsSnap.docs.map(d => d.id)

  const tmEntries: { id: string; source_text: string; target_text: string }[] = []
  if (docIds.length) {
    // ponytail: Firestore "in" queries cap at 30 IDs; fine for a solo TMS.
    const chunks: string[][] = []
    for (let i = 0; i < docIds.length; i += 30) chunks.push(docIds.slice(i, i + 30))
    for (const chunk of chunks) {
      const tmSnap = await db.collection('segments')
        .where('document_id', 'in', chunk)
        .get()
      for (const d of tmSnap.docs) {
        const data = d.data()
        if ((data.target_text as string)?.trim()) {
          tmEntries.push({
            id: d.id,
            source_text: data.source_text as string,
            target_text: data.target_text as string,
          })
        }
      }
    }
  }

  return (
    <EditorClient
      project={project}
      document={document}
      segments={segments}
      tmEntries={tmEntries}
    />
  )
}
