import { db } from './admin'

export async function getProject(projectId: string) {
  const snap = await db.collection('projects').doc(projectId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as {
    id: string
    owner_id: string
    name: string
    source_locale: string
    target_locale: string
    created_at: string
  }
}

export async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId)
  if (!project || project.owner_id !== userId) return null
  return project
}

export async function deleteSegmentsForDocument(documentId: string) {
  const snap = await db.collection('segments').where('document_id', '==', documentId).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export async function deleteDocumentAndSegments(documentId: string) {
  await deleteSegmentsForDocument(documentId)
  await db.collection('documents').doc(documentId).delete()
}

export async function deleteProjectCascade(projectId: string) {
  const docs = await db.collection('documents').where('project_id', '==', projectId).get()
  for (const doc of docs.docs) {
    await deleteDocumentAndSegments(doc.id)
  }
  await db.collection('projects').doc(projectId).delete()
}
