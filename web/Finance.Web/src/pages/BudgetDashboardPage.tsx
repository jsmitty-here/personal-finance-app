import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function BudgetDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['budget-dashboard', toApiFilters],
    queryFn: () => apiClient.getBudgetDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading budget dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Budget Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Budget vs Actual" emptyMessage="No budget vs actual data." hasData={data.budgetVsActual.length > 0}>
          <DashboardBar data={data.budgetVsActual} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Budget Variance Trend" emptyMessage="No variance trend data." hasData={data.budgetVarianceTrend.length > 0}>
          <DashboardLine data={data.budgetVarianceTrend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Budget Utilization" emptyMessage="No utilization data." hasData={data.budgetUtilization.length > 0}>
          <DashboardTable rows={data.budgetUtilization} />
        </DashboardCard>
        <DashboardCard title="Category Overrun Ranking" emptyMessage="No overruns found." hasData={data.categoryOverrunRanking.length > 0}>
          <DashboardBar data={data.categoryOverrunRanking} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Remaining Budget Burn-Down" emptyMessage="No burn-down data." hasData={data.remainingBudgetBurndown.length > 0}>
          <DashboardLine data={data.remainingBudgetBurndown} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Flexible vs Fixed Budget Split" emptyMessage="No fixed/flexible data." hasData={data.flexibleVsFixedSplit.length > 0}>
          <DashboardDonut data={data.flexibleVsFixedSplit} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
