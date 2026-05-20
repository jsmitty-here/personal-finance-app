import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable, KpiCard, fmtCurrency } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function IncomeDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['income-dashboard', toApiFilters],
    queryFn: () => apiClient.getIncomeDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading income dashboard…</p>

  const totalIncome = data.incomeTrend.reduce((sum, point) => sum + point.value, 0)
  const grossIncome = data.grossVsNetIncome.find(point => point.key === 'gross')?.value ?? 0
  const netIncome = data.grossVsNetIncome.find(point => point.key === 'net')?.value ?? 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Income Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Income (Selected Period)" value={fmtCurrency(totalIncome)} />
        <KpiCard label="Gross Income" value={fmtCurrency(grossIncome)} />
        <KpiCard label="Net Income" value={fmtCurrency(netIncome)} />
        <KpiCard label="Irregular Income" value={fmtCurrency(data.irregularIncome.reduce((sum, point) => sum + point.value, 0))} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Income Trend" emptyMessage="No income trend data." hasData={data.incomeTrend.length > 0}>
          <DashboardLine data={data.incomeTrend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Income by Source" emptyMessage="No income source data." hasData={data.incomeBySource.length > 0}>
          <DashboardDonut data={data.incomeBySource} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Gross vs Net Income" emptyMessage="No gross/net income data." hasData={data.grossVsNetIncome.length > 0}>
          <DashboardBar data={data.grossVsNetIncome} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Income Stability" emptyMessage="No income stability data." hasData={data.incomeStability.length > 0}>
          <DashboardTable rows={data.incomeStability} />
        </DashboardCard>
      </div>
      <DashboardCard title="Irregular Income" emptyMessage="No irregular income activity." hasData={data.irregularIncome.length > 0}>
        <DashboardTable rows={data.irregularIncome} />
      </DashboardCard>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
