'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSegment(
  segmentId: string,
  targetText: string,
  status: string,
  projectId: string,
  docId: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('segments')
    .update({ target_text: targetText, status })
    .eq('id', segmentId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/projects/${projectId}/editor/${docId}`)
}

export async function addToTM(
  sourceText: string,
  targetText: string,
  sourceLanguage: string,
  targetLanguage: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Upsert: if exact source already exists, update it
  const { data: existing } = await supabase
    .from('translation_memory')
    .select('id')
    .eq('source_text', sourceText)
    .eq('source_language', sourceLanguage)
    .eq('target_language', targetLanguage)
    .eq('owner_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('translation_memory')
      .update({ target_text: targetText })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('translation_memory')
      .insert({ source_text: sourceText, target_text: targetText, source_language: sourceLanguage, target_language: targetLanguage, owner_id: user.id })
  }
}