import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable, KpiCard } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function ReviewDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['review-dashboard', toApiFilters],
    queryFn: () => apiClient.getReviewDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading review dashboard…</p>

  const categorizedCoverage = data.categorizationCoverage.find(point => point.key === 'categorized')?.value ?? 0
  const uncategorizedCoverage = data.categorizationCoverage.find(point => point.key === 'uncategorized')?.value ?? 0
  const coverageTotal = categorizedCoverage + uncategorizedCoverage
  const coveragePct = coverageTotal > 0 ? (categorizedCoverage / coverageTotal) * 100 : 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Review Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Categorization Coverage" value={`${coveragePct.toFixed(1)}%`} />
        <KpiCard label="Rule Matches" value={String(data.ruleMatchVolume.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Manual Overrides" value={String(data.manualOverrideTrend.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Needs Review" value={String(data.transactionsNeedingReview.reduce((sum, point) => sum + point.value, 0))} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Categorization Coverage" emptyMessage="No categorization coverage data." hasData={data.categorizationCoverage.length > 0}>
          <DashboardDonut data={data.categorizationCoverage} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Rule Match Volume" emptyMessage="No rule match volume data." hasData={data.ruleMatchVolume.length > 0}>
          <DashboardBar data={data.ruleMatchVolume} />
        </DashboardCard>
        <DashboardCard title="Rule Conflict Frequency" emptyMessage="No rule conflict data." hasData={data.ruleConflictFrequency.length > 0}>
          <DashboardBar data={data.ruleConflictFrequency} />
        </DashboardCard>
        <DashboardCard title="Manual Override Trend" emptyMessage="No manual override trend data." hasData={data.manualOverrideTrend.length > 0}>
          <DashboardLine data={data.manualOverrideTrend} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Top Merchants Without Rules" emptyMessage="No uncaptured merchants identified." hasData={data.topMerchantsWithoutRules.length > 0}>
          <DashboardTable rows={data.topMerchantsWithoutRules} />
        </DashboardCard>
        <DashboardCard title="Transactions Needing Review" emptyMessage="No transactions need review." hasData={data.transactionsNeedingReview.length > 0}>
          <DashboardTable rows={data.transactionsNeedingReview} />
        </DashboardCard>
      </div>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
