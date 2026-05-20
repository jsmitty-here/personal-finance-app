import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, KpiCard, fmtCurrency } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function OverviewDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['overview-dashboard', toApiFilters],
    queryFn: () => apiClient.getOverviewDashboard(toApiFilters),
  })

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading overview dashboard…</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Overview Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Net Worth Snapshot" value={fmtCurrency(data.netWorthSnapshot.netWorth)} subtitle={`Assets ${fmtCurrency(data.netWorthSnapshot.assets)} · Liabilities ${fmtCurrency(data.netWorthSnapshot.liabilities)}`} />
        <KpiCard label="Savings Rate" value={`${(data.savingsRate[0]?.value ?? 0).toFixed(1)}%`} />
        <KpiCard label="Debt Balance Summary" value={fmtCurrency(data.debtBalanceSummary.reduce((sum, point) => sum + point.value, 0))} />
        <KpiCard label="Investment Allocation" value={fmtCurrency(data.investmentAllocation.reduce((sum, point) => sum + point.value, 0))} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Net Worth Trend" emptyMessage="No net worth trend data." hasData={data.netWorthSnapshot.trend.length > 0}>
          <DashboardLine data={data.netWorthSnapshot.trend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Monthly Cash Flow" emptyMessage="No monthly cash flow data." hasData={data.monthlyCashFlow.length > 0}>
          <DashboardBar data={data.monthlyCashFlow} dataKey="value" secondaryDataKey="secondaryValue" onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Spending by Category" emptyMessage="No spending by category data." hasData={data.spendingByCategory.length > 0}>
          <DashboardDonut data={data.spendingByCategory} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Investment Allocation" emptyMessage="No investment allocation data." hasData={data.investmentAllocation.length > 0}>
          <DashboardDonut data={data.investmentAllocation} onDrillDown={drillDown} />
        </DashboardCard>
      </div>

      <DashboardCard title="Alerts / Review Needed" emptyMessage="No alerts in the selected filters." hasData={data.alerts.length > 0}>
        <div className="space-y-2">
          {data.alerts.map(alert => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                if (!alert.drilldown?.transactionIds?.length && !alert.drilldown?.accountIds?.length) return
                drillDown({ key: alert.id, label: alert.message, value: 0, drilldown: alert.drilldown })
              }}
              className="w-full rounded-md border border-border bg-muted/40 p-2 text-left text-sm"
            >
              <span className="font-medium capitalize">{alert.severity}</span>: {alert.message}
            </button>
          ))}
        </div>
      </DashboardCard>

      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
