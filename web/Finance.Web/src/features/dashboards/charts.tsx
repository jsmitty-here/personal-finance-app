/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '@/context/useTheme'
import type { ChartPoint, DataQualityFlags } from '@/lib/api-client'

function drillDownFromSeriesPayload(onDrillDown: ((point: ChartPoint) => void) | undefined, state: unknown) {
  if (!onDrillDown) return
  const point = (state as { payload?: ChartPoint })?.payload
  if (point) onDrillDown(point)
}

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const getCssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const tooltipStyle = isDark ? { backgroundColor: getCssVar('--card'), borderColor: getCssVar('--border'), color: getCssVar('--foreground') } : undefined
  const colors = [
    getCssVar('--primary'),
    getCssVar('--info'),
    getCssVar('--success'),
    getCssVar('--secondary'),
    getCssVar('--destructive'),
    getCssVar('--primary-subtle-foreground'),
    getCssVar('--secondary-subtle-foreground'),
    getCssVar('--info-subtle-foreground'),
  ].filter(Boolean)
  return { getCssVar, tooltipStyle, colors: colors.length > 0 ? colors : ['#6366f1'] }
}

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardCard({ title, children, emptyMessage, hasData = true }: { title: string; children: React.ReactNode; emptyMessage: string; hasData?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-base font-semibold text-foreground mb-3">{title}</h3>
      {hasData ? children : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
    </div>
  )
}

export function KpiCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

export function DataQualityCard({ dataQuality }: { dataQuality: DataQualityFlags }) {
  const entries = Object.entries(dataQuality)
  return (
    <DashboardCard title="Data Quality Flags" emptyMessage="No data-quality issues detected." hasData={entries.length > 0}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-md border border-border p-2">
            <p className="text-xs text-muted-foreground capitalize">{key}</p>
            <p className="text-lg font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}

export function DashboardLine({ data, dataKey = 'value', secondaryDataKey, onDrillDown }: { data: ChartPoint[]; dataKey?: keyof ChartPoint; secondaryDataKey?: keyof ChartPoint; onDrillDown?: (point: ChartPoint) => void }) {
  const { getCssVar, tooltipStyle } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
        <XAxis dataKey="label" stroke={getCssVar('--muted-foreground')} />
        <YAxis stroke={getCssVar('--muted-foreground')} />
        <Tooltip formatter={(value) => typeof value === 'number' ? fmtCurrency(value) : String(value)} contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey={String(dataKey)}
          stroke={getCssVar('--primary')}
          strokeWidth={2}
          dot={false}
          onClick={(lineState) => drillDownFromSeriesPayload(onDrillDown, lineState)}
        />
        {secondaryDataKey ? (
          <Line
            type="monotone"
            dataKey={String(secondaryDataKey)}
            stroke={getCssVar('--info')}
            strokeWidth={2}
            dot={false}
            onClick={(lineState) => drillDownFromSeriesPayload(onDrillDown, lineState)}
          />
        ) : null}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function DashboardBar({ data, dataKey = 'value', secondaryDataKey, onDrillDown }: { data: ChartPoint[]; dataKey?: keyof ChartPoint; secondaryDataKey?: keyof ChartPoint; onDrillDown?: (point: ChartPoint) => void }) {
  const { getCssVar, tooltipStyle } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
        <XAxis dataKey="label" stroke={getCssVar('--muted-foreground')} />
        <YAxis stroke={getCssVar('--muted-foreground')} />
        <Tooltip formatter={(value) => typeof value === 'number' ? fmtCurrency(value) : String(value)} contentStyle={tooltipStyle} />
        <Legend />
        <Bar
          dataKey={String(dataKey)}
          fill={getCssVar('--primary')}
          radius={[6, 6, 0, 0]}
          onClick={(barState) => drillDownFromSeriesPayload(onDrillDown, barState)}
        />
        {secondaryDataKey ? (
          <Bar
            dataKey={String(secondaryDataKey)}
            fill={getCssVar('--info')}
            radius={[6, 6, 0, 0]}
            onClick={(barState) => drillDownFromSeriesPayload(onDrillDown, barState)}
          />
        ) : null}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DashboardDonut({ data, onDrillDown }: { data: ChartPoint[]; onDrillDown?: (point: ChartPoint) => void }) {
  const { tooltipStyle, colors } = useChartTheme()
  const chartData = useMemo(() => data.map(point => ({ ...point, name: point.label, amount: point.value })), [data])
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={95}
          onClick={(entry) => {
            if (!onDrillDown) return
            const point = data.find(item => item.key === entry.key)
            if (point) onDrillDown(point)
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={entry.key} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => typeof value === 'number' ? fmtCurrency(value) : String(value)} contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DashboardTable({ rows }: { rows: ChartPoint[] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 font-medium">Label</th>
            <th className="py-2 font-medium text-right">Value</th>
            <th className="py-2 font-medium text-right">Secondary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.key} className="border-b border-border/60">
              <td className="py-2 text-foreground">{row.label}</td>
              <td className="py-2 text-right text-foreground">{fmtCurrency(row.value)}</td>
              <td className="py-2 text-right text-muted-foreground">{typeof row.secondaryValue === 'number' ? fmtCurrency(row.secondaryValue) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
