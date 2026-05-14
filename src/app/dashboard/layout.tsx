import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/auth/actions'

async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-white/50 rounded-b-2xl mx-3 mt-3 md:mx-6 md:mt-4 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-slate-800 tracking-tight">my_tms</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600">{user?.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-slate-600 hover:text-brand-700 transition-colors font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-5 md:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
