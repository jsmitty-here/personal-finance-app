import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable, KpiCard, fmtCurrency } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function TaxesDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['taxes-dashboard', toApiFilters],
    queryFn: () => apiClient.getTaxesDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading taxes dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Taxes Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Tax-Relevant Activity" value={fmtCurrency(data.taxRelevantTransactions.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Deductible Expenses" value={fmtCurrency(data.deductibleExpenseSummary.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Estimated Withholding" value={fmtCurrency(data.estimatedTaxWithholding.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Retirement Contributions" value={fmtCurrency(data.retirementContributionTaxView.reduce((sum, point) => sum + point.value, 0))} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Tax-Relevant Transactions" emptyMessage="No tax-relevant transaction data." hasData={data.taxRelevantTransactions.length > 0}>
          <DashboardLine data={data.taxRelevantTransactions} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Deductible Expense Summary" emptyMessage="No deductible expense data." hasData={data.deductibleExpenseSummary.length > 0}>
          <DashboardDonut data={data.deductibleExpenseSummary} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Estimated Tax Withholding" emptyMessage="No withholding estimates available." hasData={data.estimatedTaxWithholding.length > 0}>
          <DashboardBar data={data.estimatedTaxWithholding} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Taxable Income Categories" emptyMessage="No taxable income category data." hasData={data.taxableIncomeCategories.length > 0}>
          <DashboardBar data={data.taxableIncomeCategories} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Tax Treatment Breakdown" emptyMessage="No tax treatment breakdown data." hasData={data.taxTreatmentBreakdown.length > 0}>
          <DashboardDonut data={data.taxTreatmentBreakdown} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Retirement Contribution Tax View" emptyMessage="No retirement tax-view data." hasData={data.retirementContributionTaxView.length > 0}>
          <DashboardTable rows={data.retirementContributionTaxView} />
        </DashboardCard>
      </div>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
