'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/firebase/admin'
import { getUser } from '@/lib/firebase/auth'
import { deleteProjectCascade } from '@/lib/firebase/db'

export async function createProject(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const source_locale = formData.get('source_locale') as string
  const target_locale = formData.get('target_locale') as string

  if (!name || !source_locale || !target_locale)
    return { error: 'All fields are required' }

  await db.collection('projects').add({
    name,
    source_locale,
    target_locale,
    owner_id: user.id,
    created_at: new Date().toISOString(),
  })

  revalidatePath('/dashboard')
}

export async function deleteProject(id: string) {
  const user = await getUser()
  if (!user) return

  const snap = await db.collection('projects').doc(id).get()
  if (!snap.exists || snap.data()?.owner_id !== user.id) return

  await deleteProjectCascade(id)
  revalidatePath('/dashboard')
}
