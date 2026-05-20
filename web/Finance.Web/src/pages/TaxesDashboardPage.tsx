import { DashboardShellPage } from '@/pages/dashboard-shells'

export function TaxesDashboardPage() {
  return (
    <DashboardShellPage
      title="Taxes Dashboard"
      summary="Phase 2 shell using shared global filters and chart framework; tax views are awareness-focused and not tax filing workflows."
      plannedCharts={[
        'Tax-Relevant Transactions',
        'Deductible Expense Summary',
        'Estimated Tax Withholding',
        'Taxable Income Categories',
        'Tax Treatment Breakdown',
        'Retirement Contribution Tax View',
      ]}
    />
  )
}
