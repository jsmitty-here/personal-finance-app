import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { RulesPage } from '@/pages/RulesPage'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { PlanningPage } from '@/pages/PlanningPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
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
