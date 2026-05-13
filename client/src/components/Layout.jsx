import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ScanLine, History, Target, Leaf, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/log',       icon: ScanLine,        label: 'Log Food'  },
  { to: '/history',   icon: History,         label: 'History'   },
  { to: '/goals',     icon: Target,          label: 'Goals'     },
]

export default function Layout() {
  const { user, signOut } = useAuth()

  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split('@')[0] ??
    'Account'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Aaharam</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden sm:block">{displayName}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign out</span>
          </button>
        </div>
      </header>

      {/* Page content — padded so it doesn't hide behind the bottom nav */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
