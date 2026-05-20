interface DashboardShellPageProps {
  title: string
  summary: string
  plannedCharts: string[]
}

export function DashboardShellPage({ title, summary, plannedCharts }: DashboardShellPageProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-2xl font-bold text-foreground">{title}</h2>
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">Planned Chart Set</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {plannedCharts.map(chart => <li key={chart}>{chart}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
