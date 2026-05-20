import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function NetWorthDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['net-worth-dashboard', toApiFilters],
    queryFn: () => apiClient.getNetWorthDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading net worth dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Net Worth Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Net Worth Over Time" emptyMessage="No net worth trend data." hasData={data.netWorthOverTime.length > 0}>
          <DashboardLine data={data.netWorthOverTime} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Assets vs Liabilities" emptyMessage="No assets/liabilities data." hasData={data.assetsVsLiabilities.length > 0}>
          <DashboardBar data={data.assetsVsLiabilities} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Net Worth Breakdown" emptyMessage="No net worth breakdown data." hasData={data.netWorthBreakdown.length > 0}>
          <DashboardDonut data={data.netWorthBreakdown} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Ownership-Adjusted Net Worth" emptyMessage="No ownership-adjusted data." hasData={data.ownershipAdjustedNetWorth.length > 0}>
          <DashboardBar data={data.ownershipAdjustedNetWorth} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Account Balance Trend" emptyMessage="No account balance data." hasData={data.accountBalanceTrend.length > 0}>
          <DashboardTable rows={data.accountBalanceTrend} />
        </DashboardCard>
        <DashboardCard title="Manual Asset Valuation Trend" emptyMessage="No manual asset valuation data." hasData={data.manualAssetValuationTrend.length > 0}>
          <DashboardLine data={data.manualAssetValuationTrend} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <DashboardCard title="Liability Trend" emptyMessage="No liability data." hasData={data.liabilityTrend.length > 0}>
        <DashboardLine data={data.liabilityTrend} onDrillDown={drillDown} />
      </DashboardCard>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
