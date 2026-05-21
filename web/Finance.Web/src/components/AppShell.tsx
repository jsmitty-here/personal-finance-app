import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import {
  ArrowLeftRight,
  ChartPie,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  HandCoins,
  Landmark,
  LayoutDashboard,
  ListFilter,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  ReceiptText,
  Settings,
  ShieldAlert,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const dashboardNavItems = [
  { to: '/dashboard/advisor', label: 'Advisor', icon: ShieldAlert },
  { to: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/net-worth', label: 'Net Worth', icon: Landmark },
  { to: '/dashboard/spending', label: 'Spending', icon: ChartPie },
  { to: '/dashboard/budget', label: 'Budget', icon: PiggyBank },
  { to: '/dashboard/loans', label: 'Loans', icon: HandCoins },
  { to: '/dashboard/investments', label: 'Investments', icon: TrendingUp },
  { to: '/dashboard/income', label: 'Income', icon: Wallet },
  { to: '/dashboard/taxes', label: 'Taxes', icon: ReceiptText },
  { to: '/dashboard/planning', label: 'Planning', icon: Target },
  { to: '/dashboard/review', label: 'Review', icon: CheckSquare },
]

const navItems = [
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
  const location = useLocation()
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true)
  const mobileSidebarRef = useRef<HTMLElement>(null)
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null)
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (isMobileSidebarOpen) mobileCloseButtonRef.current?.focus()
  }, [isMobileSidebarOpen])

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isDashboardRoute) {
      setIsDashboardExpanded(true)
    }
  }, [isDashboardRoute])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary-subtle text-primary-subtle-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )

  const childNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-primary-subtle text-primary-subtle-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )

  const treeButtonClass = cn(
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isDashboardRoute
      ? 'bg-primary-subtle text-primary-subtle-foreground'
      : 'text-foreground hover:bg-muted',
  )

  const renderNavItems = (onNavigate?: () => void) => (
    <>
      {isDesktopCollapsed && !onNavigate ? (
        <NavLink to="/dashboard/overview" className={navLinkClass} title="Dashboard">
          <LayoutDashboard size={16} />
        </NavLink>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setIsDashboardExpanded((value) => !value)}
            className={treeButtonClass}
            aria-expanded={isDashboardExpanded}
            aria-controls={onNavigate ? 'mobile-dashboard-nav-group' : 'desktop-dashboard-nav-group'}
          >
            <LayoutDashboard size={16} />
            <span className="flex-1 text-left">Dashboard</span>
            {isDashboardExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isDashboardExpanded ? (
            <div
              id={onNavigate ? 'mobile-dashboard-nav-group' : 'desktop-dashboard-nav-group'}
              className="ml-4 space-y-1 border-l border-border pl-3"
            >
              {dashboardNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={childNavLinkClass}
                  title={label}
                  onClick={onNavigate}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={navLinkClass} title={label} onClick={onNavigate}>
          <Icon size={16} />
          {(!isDesktopCollapsed || onNavigate) && label}
        </NavLink>
      ))}
    </>
  )

  const handleMobileSidebarKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      setIsMobileSidebarOpen(false)
      return
    }

    if (event.key !== 'Tab') return

    const container = mobileSidebarRef.current
    if (!container) return

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )

    if (focusableElements.length === 0) return

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey && activeElement === first) {
      event.preventDefault()
      last.focus()
      return
    }

    if (!event.shiftKey && activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden bg-card border-r border-border md:flex md:flex-col transition-all duration-200',
          isDesktopCollapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        <div className="px-3 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-2">
            {!isDesktopCollapsed ? (
              <div>
                <h1 className="text-lg font-bold text-primary">Finance</h1>
                <p className="text-xs text-muted-foreground">Personal Finance App</p>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-primary">F</h1>
            )}
            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDesktopCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>
        <nav className="scrollbar-hidden flex-1 space-y-2 overflow-y-auto px-3 py-4">{renderNavItems()}</nav>
        <div className="px-3 py-3 border-t border-border">
          <ThemeToggle collapsed={isDesktopCollapsed} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-base font-semibold text-primary">Finance</h1>
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
          tabIndex={-1}
        />
        <aside
          ref={mobileSidebarRef}
          className={cn(
            'relative h-full w-72 max-w-[85vw] bg-card border-r border-border flex flex-col transform transition-transform duration-200',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          onKeyDown={handleMobileSidebarKeyDown}
        >
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-primary">Finance</h1>
              <p className="text-xs text-muted-foreground">Personal Finance App</p>
            </div>
            <button
              ref={mobileCloseButtonRef}
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="scrollbar-hidden flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {renderNavItems(() => setIsMobileSidebarOpen(false))}
          </nav>
          <div className="px-3 py-3 border-t border-border">
            <ThemeToggle />
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full min-w-0 max-w-screen-2xl p-3 pt-14 sm:p-4 md:p-6 md:pt-6">{children}</div>
      </main>
    </div>
  )
}
