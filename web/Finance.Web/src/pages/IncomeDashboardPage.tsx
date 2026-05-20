import { DashboardShellPage } from '@/pages/dashboard-shells'

export function IncomeDashboardPage() {
  return (
    <DashboardShellPage
      title="Income Dashboard"
      summary="Phase 2 shell using shared global filters and chart framework; this route is intentionally staged after phase-1 delivery."
      plannedCharts={[
        'Income Trend',
        'Income by Source',
        'Gross vs Net Income',
        'Irregular Income',
        'Income Stability',
      ]}
    />
  )
}

