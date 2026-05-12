import { createClient } from '@/lib/supabase/server'
import { deleteProject } from './actions'
import CreateProjectModal from '@/components/CreateProjectModal'
import Link from 'next/link'

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', ru: 'Russian', nl: 'Dutch',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your translation projects</p>
        </div>
        <CreateProjectModal />
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="border border-dashed border-gray-800 rounded-xl p-16 text-center">
          <p className="text-gray-400 text-sm">No projects yet.</p>
          <p className="text-gray-600 text-xs mt-1">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="font-medium text-white text-sm hover:text-indigo-400 transition-colors line-clamp-2"
                >
                  {project.name}
                </Link>
                <form action={deleteProject.bind(null, project.id)}>
                  <button
                    type="submit"
                    className="text-gray-600 hover:text-red-400 transition-colors ml-3 text-xs opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-800 rounded px-2 py-0.5">
                  {LANGUAGE_NAMES[project.source_language] ?? project.source_language}
                </span>
                <span>→</span>
                <span className="bg-gray-800 rounded px-2 py-0.5">
                  {LANGUAGE_NAMES[project.target_language] ?? project.target_language}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open project →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}