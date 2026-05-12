'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const source_language = formData.get('source_language') as string
  const target_language = formData.get('target_language') as string

  if (!name || !source_language || !target_language)
    return { error: 'All fields are required' }

  const { error } = await supabase.from('projects').insert({
    name,
    source_language,
    target_language,
    owner_id: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  await supabase.from('projects').delete().eq('id', id)
  revalidatePath('/dashboard')
}