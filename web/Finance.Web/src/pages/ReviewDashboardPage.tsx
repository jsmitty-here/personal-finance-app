import { DashboardShellPage } from '@/pages/dashboard-shells'

export function ReviewDashboardPage() {
  return (
    <DashboardShellPage
      title="Review Dashboard"
      summary="Phase 2 shell using shared global filters and chart framework for rules/data-quality cleanup workflows."
      plannedCharts={[
        'Categorization Coverage',
        'Rule Match Volume',
        'Rule Conflict Frequency',
        'Manual Override Trend',
        'Top Merchants Without Rules',
        'Transactions Needing Review',
      ]}
    />
  )
}

