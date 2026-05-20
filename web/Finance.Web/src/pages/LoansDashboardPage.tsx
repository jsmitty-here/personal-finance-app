import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardLine, DashboardTable } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function LoansDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['loan-dashboard', toApiFilters],
    queryFn: () => apiClient.getLoanDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading loans dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Loans Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Debt Balance Over Time" emptyMessage="No debt trend data." hasData={data.debtBalanceOverTime.length > 0}>
          <DashboardLine data={data.debtBalanceOverTime} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Debt Breakdown" emptyMessage="No debt breakdown data." hasData={data.debtBreakdown.length > 0}>
          <DashboardBar data={data.debtBreakdown} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Principal vs Interest" emptyMessage="No payment composition data." hasData={data.principalVsInterest.length > 0}>
          <DashboardBar data={data.principalVsInterest} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Payoff Timeline" emptyMessage="No payoff timeline data." hasData={data.payoffTimeline.length > 0}>
          <DashboardLine data={data.payoffTimeline} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Interest Cost Projection" emptyMessage="No interest projection data." hasData={data.interestCostProjection.length > 0}>
          <DashboardLine data={data.interestCostProjection} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Extra Payment Impact" emptyMessage="No extra payment scenario data." hasData={data.extraPaymentImpact.length > 0}>
          <DashboardTable rows={data.extraPaymentImpact} />
        </DashboardCard>
        <DashboardCard title="Debt Avalanche/Snowball Comparison" emptyMessage="No strategy comparison data." hasData={data.debtStrategyComparison.length > 0}>
          <DashboardBar data={data.debtStrategyComparison} />
        </DashboardCard>
        <DashboardCard title="Debt-to-Assets Ratio" emptyMessage="No debt-to-assets data." hasData={data.debtToAssetsRatio.length > 0}>
          <DashboardTable rows={data.debtToAssetsRatio} />
        </DashboardCard>
      </div>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
