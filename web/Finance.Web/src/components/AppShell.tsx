import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ListFilter,
  PiggyBank,
  TrendingUp,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/rules', label: 'Rules', icon: ListFilter },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/planning', label: 'Planning', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isMobileSidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileSidebarOpen])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    )

  return (
    <div className="relative flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden bg-white border-r border-gray-200 md:flex md:flex-col transition-all duration-200',
          isDesktopCollapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        <div className="px-3 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            {!isDesktopCollapsed ? (
              <div>
                <h1 className="text-lg font-bold text-indigo-600">Finance</h1>
                <p className="text-xs text-gray-500">Personal Finance App</p>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-indigo-600">F</h1>
            )}
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDesktopCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass} title={label}>
              <Icon size={16} />
              {!isDesktopCollapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-base font-semibold text-indigo-600">Finance</h1>
      </header>

      {/* Mobile overlay sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-30 md:hidden transition-opacity',
          isMobileSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!isMobileSidebarOpen}
      >
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="absolute inset-0 bg-black/30"
          aria-label="Close sidebar overlay"
        />
        <aside
          className={cn(
            'relative h-full w-72 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-indigo-600">Finance</h1>
              <p className="text-xs text-gray-500">Personal Finance App</p>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={navLinkClass}
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 pt-14 md:p-6 md:pt-6">{children}</div>
      </main>
    </div>
  )
}
