import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DataQualityCard, DashboardBar, DashboardCard, DashboardDonut, DashboardLine, DashboardTable, KpiCard, fmtCurrency } from '@/features/dashboards/charts'
import { drillDown } from '@/features/dashboards/drilldown'

export function InvestmentsDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const { data, isLoading } = useQuery({
    queryKey: ['investments-dashboard', toApiFilters],
    queryFn: () => apiClient.getInvestmentsDashboard(toApiFilters),
  })

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading investments dashboard…</p>

  const totalPortfolioValue = data.accountAllocation.reduce((sum, point) => sum + point.value, 0)
  const latestReturnEstimate = data.investmentReturnEstimate[data.investmentReturnEstimate.length - 1]?.value ?? 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">Investments Dashboard</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Portfolio Value" value={fmtCurrency(totalPortfolioValue)} />
        <KpiCard label="Estimated Return" value={fmtCurrency(latestReturnEstimate)} />
        <KpiCard label="Taxable" value={fmtCurrency(data.taxableVsTaxAdvantagedSplit.find(point => point.key === 'taxable')?.value ?? 0)} />
        <KpiCard label="Tax-Advantaged" value={fmtCurrency(data.taxableVsTaxAdvantagedSplit.find(point => point.key === 'tax-advantaged')?.value ?? 0)} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard title="Portfolio Value Trend" emptyMessage="No portfolio trend data." hasData={data.portfolioValueTrend.length > 0}>
          <DashboardLine data={data.portfolioValueTrend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Asset Allocation" emptyMessage="No asset allocation data." hasData={data.assetAllocation.length > 0}>
          <DashboardDonut data={data.assetAllocation} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Account Allocation" emptyMessage="No account allocation data." hasData={data.accountAllocation.length > 0}>
          <DashboardBar data={data.accountAllocation} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Contributions Over Time" emptyMessage="No contribution data." hasData={data.contributionsOverTime.length > 0}>
          <DashboardBar data={data.contributionsOverTime} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Investment Return Estimate" emptyMessage="No return estimate data." hasData={data.investmentReturnEstimate.length > 0}>
          <DashboardLine data={data.investmentReturnEstimate} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Retirement Account Trend" emptyMessage="No retirement trend data." hasData={data.retirementAccountTrend.length > 0}>
          <DashboardLine data={data.retirementAccountTrend} onDrillDown={drillDown} />
        </DashboardCard>
        <DashboardCard title="Taxable vs Tax-Advantaged Split" emptyMessage="No tax treatment split data." hasData={data.taxableVsTaxAdvantagedSplit.length > 0}>
          <DashboardDonut data={data.taxableVsTaxAdvantagedSplit} onDrillDown={drillDown} />
        </DashboardCard>
      </div>
      <DashboardCard title="Holdings Concentration" emptyMessage="No holdings concentration data." hasData={data.holdingsConcentration.length > 0}>
        <DashboardTable rows={data.holdingsConcentration} />
      </DashboardCard>
      <DataQualityCard dataQuality={data.dataQuality} />
    </div>
  )
}
