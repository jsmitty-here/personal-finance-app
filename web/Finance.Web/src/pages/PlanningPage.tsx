import { TrendingUp } from 'lucide-react'

export function PlanningPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Planning</h2>
      <div className="bg-white rounded-lg border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
        <div className="p-4 bg-indigo-100 rounded-full mb-4">
          <TrendingUp size={32} className="text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">What-If Planning</h3>
        <p className="text-gray-500 max-w-md">
          Model future financial scenarios — simulate savings goals, debt payoff strategies,
          and investment growth projections. Coming soon.
        </p>
      </div>
    </div>
  )
}
