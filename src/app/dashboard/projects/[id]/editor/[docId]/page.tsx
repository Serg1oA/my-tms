import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditorClient from '@/components/editor/EditorClient'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id, docId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', docId)
    .single()

  if (!document) notFound()

  const { data: segments } = await supabase
    .from('segments')
    .select('*')
    .eq('document_id', docId)
    .order('order_index', { ascending: true })

  const { data: tmEntries } = await supabase
    .from('translation_memory')
    .select('*')
    .eq('source_language', project.source_language)
    .eq('target_language', project.target_language)

  return (
    <EditorClient
      project={project}
      document={document}
      segments={segments ?? []}
      tmEntries={tmEntries ?? []}
    />
  )
}