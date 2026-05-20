import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function SpendingDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['spending-dashboard', toApiFilters],
    queryFn: () => apiClient.getSpendingDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading spending dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Spending Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Spending by Category" emptyMessage="No category spending data." hasData={data.spendingByCategory.length > 0}>
          <DashboardDonut data={data.spendingByCategory} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Category Trend" emptyMessage="No category trend data." hasData={data.categoryTrend.length > 0}>
          <DashboardBar data={data.categoryTrend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Month-over-Month Spending" emptyMessage="No MoM data." hasData={data.monthOverMonth.length > 0}>
          <DashboardBar data={data.monthOverMonth} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Year-over-Year Spending" emptyMessage="No YoY data." hasData={data.yearOverYear.length > 0}>
          <DashboardBar data={data.yearOverYear} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Merchant Spending" emptyMessage="No merchant spending data." hasData={data.merchantSpending.length > 0}>
          <DashboardTable rows={data.merchantSpending} />
        </DashboardCard>
        <DashboardCard title="Tag-Based Spending" emptyMessage="No tag spending data." hasData={data.tagSpending.length > 0}>
          <DashboardBar data={data.tagSpending} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Daily Spend Burn" emptyMessage="No daily spend data." hasData={data.dailyBurn.length > 0}>
          <DashboardLine data={data.dailyBurn} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Spending Heatmap (Daily)" emptyMessage="No heatmap data." hasData={data.spendingHeatmap.length > 0}>
          <DashboardBar data={data.spendingHeatmap} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <DashboardCard title="Uncategorized Spending" emptyMessage="No uncategorized spending." hasData={data.uncategorizedSpending.some(item => item.value > 0)}>
        <DashboardTable rows={data.uncategorizedSpending} />
      </DashboardCard>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}

