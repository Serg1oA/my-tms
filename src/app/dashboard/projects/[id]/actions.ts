'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDocument(projectId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const content = formData.get('content') as string

  if (!name || !content) return { error: 'Name and content are required' }

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({ project_id: projectId, name, status: 'pending' })
    .select()
    .single()

  if (docError) return { error: docError.message }

  // Split content into segments by sentence / line
  const lines = content
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  const segments = lines.map((line, i) => ({
    document_id: doc.id,
    order_index: i,
    source_text: line,
    target_text: '',
    status: 'untranslated',
  }))

  const { error: segError } = await supabase.from('segments').insert(segments)
  if (segError) return { error: segError.message }

  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function deleteDocument(projectId: string, documentId: string) {
  const supabase = await createClient()
  await supabase.from('documents').delete().eq('id', documentId)
  revalidatePath(`/dashboard/projects/${projectId}`)
}