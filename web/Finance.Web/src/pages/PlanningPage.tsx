import { TrendingUp } from 'lucide-react'

export function PlanningPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Planning</h2>
      <div className="bg-card rounded-lg border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-primary-subtle rounded-full mb-4">
          <TrendingUp size={32} className="text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">What-If Planning</h3>
        <p className="text-muted-foreground max-w-md">
          Model future financial scenarios — simulate savings goals, debt payoff strategies,
          and investment growth projections. Coming soon.
        </p>
      </div>
    </div>
  )
}
