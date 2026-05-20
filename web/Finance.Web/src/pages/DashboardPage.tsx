import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { apiClient } from '@/lib/stub-client'
import { useTheme } from '@/context/useTheme'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardPage() {
  const [ownerId, setOwnerId] = useState<string>('all')
  const { resolvedTheme } = useTheme()

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

  const isDark = resolvedTheme === 'dark'
  const tooltipStyle = isDark
    ? { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }
    : undefined
  const legendStyle = isDark ? { color: '#f1f5f9' } : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <select
          className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground"
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
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-subtle rounded-md">
              <DollarSign size={18} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Net Worth</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{netWorth ? fmt(netWorth.netWorth) : '—'}</p>
          {netWorth && (
            <p className="text-xs text-muted-foreground mt-1">
              Assets {fmt(netWorth.totalAssets)} · Liabilities {fmt(netWorth.totalLiabilities)}
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success-subtle rounded-md">
              <TrendingUp size={18} className="text-success" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Income (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{cashFlow ? fmt(cashFlow.income) : '—'}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive-subtle rounded-md">
              <TrendingDown size={18} className="text-destructive" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Expenses (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{cashFlow ? fmt(cashFlow.expenses) : '—'}</p>
          {cashFlow && (
            <p className={`text-xs mt-1 ${cashFlow.net >= 0 ? 'text-success' : 'text-destructive'}`}>
              Net: {fmt(cashFlow.net)}
            </p>
          )}
        </div>
      </div>

      {/* Spending by category */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">Spending by Category</h3>
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
              <Tooltip
                formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)}
                contentStyle={tooltipStyle}
              />
              <Legend wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No spending data available.</p>
        )}
      </div>
    </div>
  )
}
