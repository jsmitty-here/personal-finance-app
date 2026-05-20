import { DashboardShellPage } from '@/pages/dashboard-shells'

export function InvestmentsDashboardPage() {
  return (
    <DashboardShellPage
      title="Investments Dashboard"
      summary="Phase 2 shell using shared global filters and chart framework; this route is intentionally staged after core household dashboards."
      plannedCharts={[
        'Portfolio Value Trend',
        'Asset Allocation',
        'Account Allocation',
        'Contributions Over Time',
        'Investment Return Estimate',
        'Holdings Concentration',
        'Retirement Account Trend',
        'Taxable vs Tax-Advantaged Split',
      ]}
    />
  )
}
