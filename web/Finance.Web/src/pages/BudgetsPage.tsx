import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BudgetsPage() {
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiClient.getBudgets(),
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>

      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}

      {budgets.map(budget => {
        const totalPlanned = budget.items.reduce((s, i) => s + i.plannedAmount, 0)
        const totalActual = budget.items.reduce((s, i) => s + i.actualAmount, 0)
        return (
          <div key={budget.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                <span className="text-xs text-gray-500 capitalize">{budget.period}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {fmt(totalActual)} <span className="text-gray-400">/ {fmt(totalPlanned)}</span>
                </p>
                <p className="text-xs text-gray-500">spent of planned</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {budget.items.map(item => {
                const pct = item.plannedAmount > 0 ? Math.min((item.actualAmount / item.plannedAmount) * 100, 100) : 0
                const over = item.actualAmount > item.plannedAmount
                return (
                  <div key={item.category} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{item.category}</span>
                      <span className={`text-sm font-medium ${over ? 'text-red-600' : 'text-gray-700'}`}>
                        {fmt(item.actualAmount)}
                        <span className="text-gray-400 font-normal"> / {fmt(item.plannedAmount)}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% used</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!isLoading && budgets.length === 0 && (
        <p className="text-gray-500 text-sm">No budgets found.</p>
      )}
    </div>
  )
}
