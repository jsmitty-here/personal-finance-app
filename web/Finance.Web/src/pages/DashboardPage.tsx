import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { apiClient } from '@/lib/stub-client'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardPage() {
  const [ownerId, setOwnerId] = useState<string>('all')

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: netWorth } = useQuery({
    queryKey: ['netWorth', ownerId],
    queryFn: () => apiClient.getNetWorth(ownerId === 'all' ? undefined : ownerId),
  })

  const { data: cashFlow } = useQuery({
    queryKey: ['cashFlow', ownerId],
    queryFn: () => apiClient.getCashFlow('current-month', ownerId === 'all' ? undefined : ownerId),
  })

  const { data: spending = [] } = useQuery({
    queryKey: ['spending', ownerId],
    queryFn: () => apiClient.getSpendingByCategory('current-month', ownerId === 'all' ? undefined : ownerId),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <select
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
          value={ownerId}
          onChange={e => setOwnerId(e.target.value)}
        >
          <option value="all">All Owners</option>
          {owners.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-md">
              <DollarSign size={18} className="text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Net Worth</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{netWorth ? fmt(netWorth.netWorth) : '—'}</p>
          {netWorth && (
            <p className="text-xs text-gray-500 mt-1">
              Assets {fmt(netWorth.totalAssets)} · Liabilities {fmt(netWorth.totalLiabilities)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-md">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Income (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{cashFlow ? fmt(cashFlow.income) : '—'}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-md">
              <TrendingDown size={18} className="text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Expenses (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{cashFlow ? fmt(cashFlow.expenses) : '—'}</p>
          {cashFlow && (
            <p className={`text-xs mt-1 ${cashFlow.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Net: {fmt(cashFlow.net)}
            </p>
          )}
        </div>
      </div>

      {/* Spending by category */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
        {spending.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={spending}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: PieLabelRenderProps) => {
                  const cat = String(props.name ?? '')
                  const pct = typeof props.percent === 'number' ? (props.percent * 100).toFixed(1) : '0.0'
                  return `${cat} ${pct}%`
                }}
              >
                {spending.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">No spending data available.</p>
        )}
      </div>
    </div>
  )
}
