import type { ChartPoint, DashboardFiltersInput } from '@/lib/api-client'

export function validateDashboardFilters(filters: DashboardFiltersInput) {
  if (filters.period === 'custom' && (!filters.dateFrom || !filters.dateTo)) {
    console.warn('[DashboardValidation] Custom period selected without full date range.')
  }
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    console.warn('[DashboardValidation] dateFrom is after dateTo.')
  }
  if (filters.ownerId && filters.ownershipView && filters.ownershipView !== 'household') {
    console.warn('[DashboardValidation] ownerId and ownershipView are both specified; ownership view takes precedence in adjusted calculations.')
  }
}

export function validateChartPoints(name: string, points: ChartPoint[]) {
  const invalid = points.find(point => Number.isNaN(point.value))
  if (invalid) {
    console.warn(`[DashboardValidation] ${name} contains NaN value for key ${invalid.key}.`)
  }
}
