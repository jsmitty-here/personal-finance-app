import { DashboardShellPage } from '@/pages/dashboard-shells'

export function PlanningDashboardPage() {
  return (
    <DashboardShellPage
      title="Planning Dashboard"
      summary="Phase 2 shell using shared global filters and chart framework; projections are explicitly presented as non-guaranteed estimates."
      plannedCharts={[
        'Scenario Comparison',
        'Pay Down Debt vs Invest',
        'Emergency Fund Projection',
        'Investment Growth Projection',
        'Break-Even Point',
        'Tax Impact Estimate',
        'Risk Range Projection',
      ]}
    />
  )
}
