import { getUser } from '@/lib/firebase/auth'
import LogoutButton from '@/components/LogoutButton'

async function Header() {
  const user = await getUser()

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-white/50 rounded-b-2xl mx-3 mt-3 md:mx-6 md:mt-4 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 md:px-6 h-14 flex items-center justify-between">
        <span className="font-display text-lg font-semibold text-slate-800 tracking-tight">my_tms</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-600">{user?.email}</span>
          <LogoutButton />
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
