import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardLine, DashboardTable, KpiCard, fmtCurrency } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function PlanningDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['planning-dashboard', toApiFilters],
    queryFn: () => apiClient.getPlanningDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading planning dashboard…</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Planning Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Emergency Fund Target" value={fmtCurrency(data.emergencyFundProjection[data.emergencyFundProjection.length - 1]?.value ?? 0)} />
        <KpiCard label="Projected Investment Value" value={fmtCurrency(data.investmentGrowthProjection[data.investmentGrowthProjection.length - 1]?.value ?? 0)} />
        <KpiCard label="Best Scenario Outcome" value={fmtCurrency(Math.max(...data.scenarioComparison.map(point => point.value), 0))} />
        <KpiCard label="Estimated Tax Impact" value={fmtCurrency(data.taxImpactEstimate.reduce((sum, point) => sum + point.value, 0))} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Scenario Comparison" emptyMessage="No scenario comparison data." hasData={data.scenarioComparison.length > 0}>
          <DashboardBar data={data.scenarioComparison} />
        </DashboardCard>
        <DashboardCard title="Pay Down Debt vs Invest" emptyMessage="No debt-vs-invest projection data." hasData={data.payDownDebtVsInvest.length > 0}>
          <DashboardBar data={data.payDownDebtVsInvest} />
        </DashboardCard>
        <DashboardCard title="Emergency Fund Projection" emptyMessage="No emergency fund projection data." hasData={data.emergencyFundProjection.length > 0}>
          <DashboardLine data={data.emergencyFundProjection} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Investment Growth Projection" emptyMessage="No investment growth projection data." hasData={data.investmentGrowthProjection.length > 0}>
          <DashboardLine data={data.investmentGrowthProjection} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Break-Even Point" emptyMessage="No break-even data." hasData={data.breakEvenPoint.length > 0}>
          <DashboardTable rows={data.breakEvenPoint} />
        </DashboardCard>
        <DashboardCard title="Tax Impact Estimate" emptyMessage="No tax impact estimate data." hasData={data.taxImpactEstimate.length > 0}>
          <DashboardBar data={data.taxImpactEstimate} />
        </DashboardCard>
      </div>
      <DashboardCard title="Risk Range Projection" emptyMessage="No risk range projection data." hasData={data.riskRangeProjection.length > 0}>
        <DashboardLine data={data.riskRangeProjection} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
      </DashboardCard>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
