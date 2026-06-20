import { db } from '@/lib/firebase/admin'
import { getUser } from '@/lib/firebase/auth'
import { deleteProject } from './actions'
import { LANGUAGE_NAMES } from '@/lib/locale'
import CreateProjectModal from '@/components/CreateProjectModal'
import Link from 'next/link'

interface Project {
  id: string;
  name: string;
  source_locale: string;
  target_locale: string;
  owner_id: string;
  created_at: any;
}

export default async function DashboardPage() {
  const user = await getUser()
  const snap = user
    ? await db.collection('projects')
        .where('owner_id', '==', user.id)
        .orderBy('created_at', 'desc')
        .get()
    : null

    
  const projects: Project[] = snap?.docs.map(d => ({ 
    id: d.id, 
    ...d.data() 
  } as Project)) ?? []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your translation projects</p>
        </div>
        <CreateProjectModal />
      </div>

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center border-dashed border-2 border-white/60">
          <p className="text-slate-600 text-sm">No projects yet.</p>
          <p className="text-slate-500 text-xs mt-1">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl p-5 hover:shadow-lg hover:shadow-brand-500/15 transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="font-semibold text-slate-900 text-sm hover:text-brand-700 transition-colors line-clamp-2"
                >
                  {project.name}
                </Link>
                <form action={deleteProject.bind(null, project.id)}>
                  <button
                    type="submit"
                    className="text-slate-400 hover:text-red-600 transition-colors ml-3 text-xs opacity-0 group-hover:opacity-100 font-medium"
                  >
                    Delete
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="glass-inset rounded-lg px-2 py-0.5 font-medium">
                  {LANGUAGE_NAMES[project.source_locale] ?? project.source_locale}
                </span>
                <span className="text-slate-400">→</span>
                <span className="glass-inset rounded-lg px-2 py-0.5 font-medium">
                  {LANGUAGE_NAMES[project.target_locale] ?? project.target_locale}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-white/50">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="text-xs text-brand-700 hover:text-brand-900 font-semibold transition-colors"
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