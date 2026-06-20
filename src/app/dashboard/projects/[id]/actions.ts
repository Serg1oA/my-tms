'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/firebase/admin'
import { getUser } from '@/lib/firebase/auth'
import {
  assertProjectOwner,
  deleteDocumentAndSegments,
} from '@/lib/firebase/db'
import {
  DEMO_XLIFF,
  extractXliff,
  applyTargetsToXliff,
  buildXliffFromSegments,
} from '@/lib/xliff'

const MAX_UPLOAD_FILE_BYTES = 1000 * 1024 // 1 MB
const MAX_SEGMENTS_PER_DOCUMENT = 8000
const INSERT_CHUNK = 400

function fileTooLargeMessage(label: string, size: number): string {
  const mb = Math.round(size / (102.4 * 102.4)) / 10
  return `${label} is too large (${mb} MB). Maximum per file is 1 MB.`
}

async function insertXliffDocument(
  projectId: string,
  filename: string,
  xml: string,
): Promise<{ error: string } | undefined> {
  const extracted = extractXliff(Buffer.from(xml, 'utf8'), filename)
  if (!extracted.ok) return { error: extracted.error }

  const units = extracted.units
  if (units.length > MAX_SEGMENTS_PER_DOCUMENT) {
    return { error: `Too many segments (${units.length}). Maximum is ${MAX_SEGMENTS_PER_DOCUMENT}.` }
  }

  const docRef = await db.collection('documents').add({
    project_id: projectId,
    filename,
    xliff_xml: xml,
    created_at: new Date().toISOString(),
  })

  try {
    for (let i = 0; i < units.length; i += INSERT_CHUNK) {
      const batch = db.batch()
      const slice = units.slice(i, i + INSERT_CHUNK)
      slice.forEach(({ source, target }, j) => {
        const ref = db.collection('segments').doc()
        batch.set(ref, {
          document_id: docRef.id,
          position: i + j,
          source_text: source,
          target_text: target,
        })
      })
      await batch.commit()
    }
  } catch (err) {
    await deleteDocumentAndSegments(docRef.id)
    return { error: err instanceof Error ? err.message : 'Failed to save segments' }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function createDocument(projectId: string, formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!await assertProjectOwner(projectId, user.id)) return { error: 'Project not found' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'An XLIFF file is required' }
  if (file.size > MAX_UPLOAD_FILE_BYTES) return { error: fileTooLargeMessage('XLIFF file', file.size) }

  const xml = Buffer.from(await file.arrayBuffer()).toString('utf8')
  const filename = (formData.get('filename') as string)?.trim() || file.name
  return insertXliffDocument(projectId, filename, xml)
}

export async function loadDemoDocument(projectId: string) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!await assertProjectOwner(projectId, user.id)) return { error: 'Project not found' }

  return insertXliffDocument(projectId, 'demo.xliff', DEMO_XLIFF)
}

export async function deleteDocument(projectId: string, documentId: string) {
  const user = await getUser()
  if (!user) return

  const doc = await db.collection('documents').doc(documentId).get()
  if (!doc.exists) return
  if (!await assertProjectOwner(doc.data()!.project_id, user.id)) return

  await deleteDocumentAndSegments(documentId)
  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function saveSegment(
  segmentId: string,
  targetText: string,
  projectId: string,
  docId: string
) {
  await db.collection('segments').doc(segmentId).update({ target_text: targetText })
  revalidatePath(`/dashboard/projects/${projectId}/editor/${docId}`)
}

export async function exportXliff(projectId: string, docId: string) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const project = await assertProjectOwner(projectId, user.id)
  if (!project) return { error: 'Project not found' }

  const docSnap = await db.collection('documents').doc(docId).get()
  if (!docSnap.exists || docSnap.data()?.project_id !== projectId) {
    return { error: 'Document not found' }
  }
  const document = docSnap.data()!

  const segSnap = await db.collection('segments')
    .where('document_id', '==', docId)
    .orderBy('position')
    .get()

  const segments = segSnap.docs.map(d => d.data())
  const sources = segments.map(s => s.source_text as string)
  const targets = segments.map(s => s.target_text as string)

  const xml = document.xliff_xml
    ? applyTargetsToXliff(document.xliff_xml as string, targets)
    : buildXliffFromSegments(sources, targets, project.source_locale, project.target_locale)

  const base = (document.filename as string).replace(/\.(xliff|xlf)$/i, '')
  return { xml, filename: `${base}-translated.xliff` }
}
