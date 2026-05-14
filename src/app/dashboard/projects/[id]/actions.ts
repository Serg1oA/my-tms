'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { extractDocumentSegments } from '@/lib/extract-document'
import { parseTmxUnits } from '@/lib/tmx'
import {
  MAX_SEGMENTS_PER_DOCUMENT,
  MAX_UPLOAD_FILE_BYTES,
  fileTooLargeMessage,
} from '@/lib/uploads'

/** Cap TMX units per upload to stay within Supabase request limits. */
const MAX_TMX_UNITS = 12_000

export async function createDocument(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .single()

  if (!project || project.owner_id !== user.id) return { error: 'Project not found' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'A document file is required' }

  const errSize = file.size > MAX_UPLOAD_FILE_BYTES ? fileTooLargeMessage('Document', file.size) : null
  if (errSize) return { error: errSize }

  const srxField = formData.get('srx')
  let srxXml: string | null = null
  if (srxField instanceof File && srxField.size > 0) {
    if (srxField.size > MAX_UPLOAD_FILE_BYTES) return { error: fileTooLargeMessage('SRX file', srxField.size) }
    srxXml = Buffer.from(await srxField.arrayBuffer()).toString('utf8')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const extracted = await extractDocumentSegments(buffer, file.name, srxXml)
  if (!extracted.ok) return { error: extracted.error }

  const segments = extracted.segments
  if (segments.length > MAX_SEGMENTS_PER_DOCUMENT) {
    return {
      error: `Too many segments (${segments.length}). Maximum is ${MAX_SEGMENTS_PER_DOCUMENT}. Try a smaller file or coarser SRX rules.`,
    }
  }

  const name = (formData.get('name') as string)?.trim() || file.name

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({ project_id: projectId, name, status: 'pending' })
    .select()
    .single()

  if (docError) return { error: docError.message }

  const rows = segments.map((source_text, i) => ({
    document_id: doc.id,
    order_index: i,
    source_text,
    target_text: '',
    status: 'untranslated',
  }))

  const insertChunk = 400
  for (let i = 0; i < rows.length; i += insertChunk) {
    const { error: segError } = await supabase.from('segments').insert(rows.slice(i, i + insertChunk))
    if (segError) {
      await supabase.from('documents').delete().eq('id', doc.id)
      return { error: segError.message }
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function deleteDocument(projectId: string, documentId: string) {
  const supabase = await createClient()
  await supabase.from('documents').delete().eq('id', documentId)
  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function importTmx(projectId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: project } = await supabase
    .from('projects')
    .select('id, owner_id, source_language, target_language')
    .eq('id', projectId)
    .single()

  if (!project || project.owner_id !== user.id) return { error: 'Project not found' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'A TMX file is required' }
  if (file.size > MAX_UPLOAD_FILE_BYTES) return { error: fileTooLargeMessage('TMX file', file.size) }

  const xml = Buffer.from(await file.arrayBuffer()).toString('utf8')
  const units = parseTmxUnits(xml, project.source_language, project.target_language)
  if (!units.length) return { error: 'No translation units matched this project’s language pair in the TMX.' }
  if (units.length > MAX_TMX_UNITS) {
    return { error: `TMX contains ${units.length} units; maximum per import is ${MAX_TMX_UNITS}.` }
  }

  const bySource = new Map<string, string>()
  for (const u of units) bySource.set(u.source_text, u.target_text)

  const sources = [...bySource.keys()]
  const existingBySource = new Map<string, string>()

  const chunkSize = 120
  for (let i = 0; i < sources.length; i += chunkSize) {
    const chunk = sources.slice(i, i + chunkSize)
    const { data: existing, error: selErr } = await supabase
      .from('translation_memory')
      .select('id, source_text')
      .eq('owner_id', user.id)
      .eq('source_language', project.source_language)
      .eq('target_language', project.target_language)
      .in('source_text', chunk)

    if (selErr) return { error: selErr.message }
    for (const row of existing ?? []) existingBySource.set(row.source_text, row.id)
  }

  const toInsert: {
    source_text: string
    target_text: string
    source_language: string
    target_language: string
    owner_id: string
  }[] = []

  const toUpdate: { id: string; target_text: string }[] = []

  for (const [source_text, target_text] of bySource) {
    const id = existingBySource.get(source_text)
    if (id) toUpdate.push({ id, target_text })
    else {
      toInsert.push({
        source_text,
        target_text,
        source_language: project.source_language,
        target_language: project.target_language,
        owner_id: user.id,
      })
    }
  }

  if (toInsert.length) {
    const insChunk = 200
    for (let i = 0; i < toInsert.length; i += insChunk) {
      const { error: insErr } = await supabase.from('translation_memory').insert(toInsert.slice(i, i + insChunk))
      if (insErr) return { error: insErr.message }
    }
  }

  const updateChunk = 25
  for (let i = 0; i < toUpdate.length; i += updateChunk) {
    const slice = toUpdate.slice(i, i + updateChunk)
    const results = await Promise.all(
      slice.map(u =>
        supabase.from('translation_memory').update({ target_text: u.target_text }).eq('id', u.id),
      ),
    )
    const failed = results.find(r => r.error)
    if (failed?.error) return { error: failed.error.message }
  }

  const { data: docs } = await supabase.from('documents').select('id').eq('project_id', projectId)
  for (const d of docs ?? []) {
    revalidatePath(`/dashboard/projects/${projectId}/editor/${d.id}`)
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
}
