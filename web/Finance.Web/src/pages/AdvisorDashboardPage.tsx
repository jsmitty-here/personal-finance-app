import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/client'
import { useDashboardFoundation } from '@/features/dashboards/foundation'
import { DashboardCard, KpiCard } from '@/features/dashboards/charts'
import { buildAdvisorInsights, type AdvisorSeverity, type AdvisorStatus } from '@/features/advisor/insights'

const statusClassByType: Record<AdvisorStatus, string> = {
  'on-track': 'border-success/40 bg-success-subtle text-success',
  watch: 'border-info/40 bg-info-subtle text-info',
  'action-needed': 'border-destructive/40 bg-destructive-subtle text-destructive',
}

const severityClassByType: Record<AdvisorSeverity, string> = {
  low: 'border-secondary/40 bg-secondary-subtle text-secondary',
  medium: 'border-info/40 bg-info-subtle text-info',
  high: 'border-destructive/40 bg-destructive-subtle text-destructive',
}

export function AdvisorDashboardPage() {
  const { toApiFilters } = useDashboardFoundation()
  const [completedRecommendations, setCompletedRecommendations] = useState<string[]>([])

  const overview = useQuery({
    queryKey: ['advisor-overview-dashboard', toApiFilters],
    queryFn: () => apiClient.getOverviewDashboard(toApiFilters),
  })
  const spending = useQuery({
    queryKey: ['advisor-spending-dashboard', toApiFilters],
    queryFn: () => apiClient.getSpendingDashboard(toApiFilters),
  })
  const loans = useQuery({
    queryKey: ['advisor-loan-dashboard', toApiFilters],
    queryFn: () => apiClient.getLoanDashboard(toApiFilters),
  })
  const investments = useQuery({
    queryKey: ['advisor-investments-dashboard', toApiFilters],
    queryFn: () => apiClient.getInvestmentsDashboard(toApiFilters),
  })
  const taxes = useQuery({
    queryKey: ['advisor-taxes-dashboard', toApiFilters],
    queryFn: () => apiClient.getTaxesDashboard(toApiFilters),
  })
  const planning = useQuery({
    queryKey: ['advisor-planning-dashboard', toApiFilters],
    queryFn: () => apiClient.getPlanningDashboard(toApiFilters),
  })

  const isLoading = overview.isLoading || spending.isLoading || loans.isLoading || investments.isLoading || taxes.isLoading || planning.isLoading
  if (isLoading || !overview.data || !spending.data || !loans.data || !investments.data || !taxes.data || !planning.data) {
    return <p className="text-sm text-muted-foreground">Loading advisor dashboard…</p>
  }

  const insights = useMemo(
    () => buildAdvisorInsights({
      overview: overview.data,
      spending: spending.data,
      loans: loans.data,
      investments: investments.data,
      taxes: taxes.data,
      planning: planning.data,
    }),
    [investments.data, loans.data, overview.data, planning.data, spending.data, taxes.data],
  )

  const topRecommendation = insights.recommendations[0]
  const onTrackCount = insights.capabilities.filter(item => item.status === 'on-track').length

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-2xl font-bold text-foreground">Advisor Action Center</h2>
        <p className="text-sm text-muted-foreground">Mock capability layer: detect risks, simulate outcomes, rank next best actions, and track execution.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Active Guardrails" value={String(insights.guardrails.length)} />
        <KpiCard label="Capabilities On-Track" value={`${onTrackCount}/${insights.capabilities.length}`} />
        <KpiCard label="Retirement Readiness" value={`${insights.retirementReadinessScore}%`} />
        <KpiCard label="Top Lever Impact" value={topRecommendation ? `+${topRecommendation.estimatedImpact.toFixed(0)} pts` : '—'} />
      </div>

      <DashboardCard title="Capability Status" emptyMessage="No capability status available." hasData={insights.capabilities.length > 0}>
        <div className="grid gap-2 md:grid-cols-2">
          {insights.capabilities.map(item => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusClassByType[item.status]}`}>
                  {item.status.replace('-', ' ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Decision Guardrails" emptyMessage="No guardrails currently triggered." hasData={insights.guardrails.length > 0}>
        <div className="space-y-2">
          {insights.guardrails.map(item => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${severityClassByType[item.severity]}`}>
                  {item.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Ranked Next Best Actions" emptyMessage="No recommendations available." hasData={insights.recommendations.length > 0}>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Action</th>
                <th className="py-2 pr-2 font-medium">Category</th>
                <th className="py-2 pr-2 font-medium">Estimated Impact</th>
                <th className="py-2 font-medium text-right">Track</th>
              </tr>
            </thead>
            <tbody>
              {insights.recommendations.map(item => {
                const isCompleted = completedRecommendations.includes(item.id)
                return (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-2 pr-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.rationale}</p>
                    </td>
                    <td className="py-2 pr-2 text-foreground">{item.category}</td>
                    <td className="py-2 pr-2 text-foreground">+{item.estimatedImpact.toFixed(0)} pts</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedRecommendations(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])
                        }}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {isCompleted ? 'Acted' : 'Mark done'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <p className="text-xs text-muted-foreground">
        Tax items are educational guidance for planning context, not individualized tax advice.
      </p>
    </div>
  )
}
