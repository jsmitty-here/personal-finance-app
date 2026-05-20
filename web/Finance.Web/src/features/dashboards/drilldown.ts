import type { ChartPoint } from '@/lib/api-client'

export function drillDown(point: ChartPoint) {
  const params = new URLSearchParams()
  if (point.drilldown?.transactionIds?.length) params.set('txIds', point.drilldown.transactionIds.join(','))
  if (point.drilldown?.accountIds?.length) params.set('accountIds', point.drilldown.accountIds.join(','))
  if (point.drilldown?.loanAccountIds?.length) params.set('loanIds', point.drilldown.loanAccountIds.join(','))
  if (point.drilldown?.holdingIds?.length) params.set('holdingIds', point.drilldown.holdingIds.join(','))
  const query = params.toString()
  window.location.hash = query ? `/transactions?${query}` : '/transactions'
}

