import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AccountsPage } from '@/pages/AccountsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { RulesPage } from '@/pages/RulesPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { PlanningPage } from '@/pages/PlanningPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { DashboardFoundationProvider, DashboardRouteLayout } from '@/features/dashboards/foundation'
import { OverviewDashboardPage } from '@/pages/OverviewDashboardPage'
import { SpendingDashboardPage } from '@/pages/SpendingDashboardPage'
import { NetWorthDashboardPage } from '@/pages/NetWorthDashboardPage'
import { BudgetDashboardPage } from '@/pages/BudgetDashboardPage'
import { LoansDashboardPage } from '@/pages/LoansDashboardPage'
import { InvestmentsDashboardPage } from '@/pages/InvestmentsDashboardPage'
import { IncomeDashboardPage } from '@/pages/IncomeDashboardPage'
import { TaxesDashboardPage } from '@/pages/TaxesDashboardPage'
import { PlanningDashboardPage } from '@/pages/PlanningDashboardPage'
import { ReviewDashboardPage } from '@/pages/ReviewDashboardPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
        <Route
          path="/dashboard"
          element={(
            <DashboardFoundationProvider>
              <DashboardRouteLayout />
            </DashboardFoundationProvider>
          )}
        >
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<OverviewDashboardPage />} />
          <Route path="net-worth" element={<NetWorthDashboardPage />} />
          <Route path="spending" element={<SpendingDashboardPage />} />
          <Route path="budget" element={<BudgetDashboardPage />} />
          <Route path="loans" element={<LoansDashboardPage />} />
          <Route path="investments" element={<InvestmentsDashboardPage />} />
          <Route path="income" element={<IncomeDashboardPage />} />
          <Route path="taxes" element={<TaxesDashboardPage />} />
          <Route path="planning" element={<PlanningDashboardPage />} />
          <Route path="review" element={<ReviewDashboardPage />} />
        </Route>
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/planning" element={<PlanningPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  )
}
