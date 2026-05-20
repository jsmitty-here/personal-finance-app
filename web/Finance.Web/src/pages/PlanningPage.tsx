import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'

type ScenarioType =
  | 'loan_vs_invest'
  | 'emergency_fund'
  | 'mortgage_prepayment'
  | 'retirement_contribution'
  | 'debt_payoff'
  | 'investment_growth'
  | 'tax_aware_income'

interface ScenarioForm {
  name: string
  type: ScenarioType
  startingAmount: number
  monthlyContribution: number
  timeHorizonMonths: number
  expectedReturn: number
  interestRate: number
  savingsYield: number
  taxRate: number
  inflation: number
  riskPreference: 'low' | 'medium' | 'high'
  ownerAllocation: 'household' | 'owner1' | 'owner2' | 'joint'
  assumptionProfile: string
}

export function PlanningPage() {
  const [form, setForm] = useState<ScenarioForm>({
    name: 'New Scenario',
    type: 'investment_growth',
    startingAmount: 10000,
    monthlyContribution: 500,
    timeHorizonMonths: 60,
    expectedReturn: 6,
    interestRate: 7,
    savingsYield: 4,
    taxRate: 24,
    inflation: 2.5,
    riskPreference: 'medium',
    ownerAllocation: 'household',
    assumptionProfile: 'User Entered',
  })
  const [savedScenarios, setSavedScenarios] = useState<ScenarioForm[]>([])

  const projection = useMemo(() => {
    const monthlyReturn = form.expectedReturn / 100 / 12
    let value = form.startingAmount
    for (let i = 0; i < form.timeHorizonMonths; i += 1) {
      value = (value + form.monthlyContribution) * (1 + monthlyReturn)
    }
    const totalContributions = form.startingAmount + form.monthlyContribution * form.timeHorizonMonths
    const interestEarned = value - totalContributions
    const taxImpact = interestEarned * (form.taxRate / 100)
    const presentValue = value / Math.pow(1 + form.inflation / 100, form.timeHorizonMonths / 12)
    const netBenefit = value - taxImpact
    let breakEvenMonths = 0
    if (form.monthlyContribution > 0) {
      let running = form.startingAmount
      const monthlyContribution = form.monthlyContribution
      const monthlyReturnForBreakEven = form.expectedReturn / 100 / 12
      for (let month = 1; month <= form.timeHorizonMonths; month += 1) {
        running = (running + monthlyContribution) * (1 + monthlyReturnForBreakEven)
        const contributionsToDate = form.startingAmount + monthlyContribution * month
        if (running >= contributionsToDate) {
          breakEvenMonths = month
          break
        }
      }
    }
    return { value, interestEarned, taxImpact, presentValue, netBenefit, breakEvenMonths }
  }, [form])

  const scenarioTypeLabel: Record<ScenarioType, string> = {
    loan_vs_invest: 'Loan vs Invest',
    emergency_fund: 'Emergency Fund',
    mortgage_prepayment: 'Mortgage Prepayment',
    retirement_contribution: 'Retirement Contribution',
    debt_payoff: 'Debt Payoff',
    investment_growth: 'Investment Growth',
    tax_aware_income: 'Tax-Aware Income',
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Planning</h2>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 xl:col-span-2 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Scenario Builder</h3>
              <p className="text-sm text-muted-foreground">Configure assumptions and compare projected outcomes.</p>
            </div>
            <div className="p-3 bg-primary-subtle rounded-full">
              <TrendingUp size={20} className="text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Scenario name" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as ScenarioType }))}>
              {Object.entries(scenarioTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.ownerAllocation} onChange={e => setForm(prev => ({ ...prev, ownerAllocation: e.target.value as ScenarioForm['ownerAllocation'] }))}>
              <option value="household">Household</option>
              <option value="owner1">Owner 1</option>
              <option value="owner2">Owner 2</option>
              <option value="joint">Joint</option>
            </select>
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.startingAmount} onChange={e => setForm(prev => ({ ...prev, startingAmount: Number(e.target.value || 0) }))} placeholder="Starting amount" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.monthlyContribution} onChange={e => setForm(prev => ({ ...prev, monthlyContribution: Number(e.target.value || 0) }))} placeholder="Monthly contribution" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.timeHorizonMonths} onChange={e => setForm(prev => ({ ...prev, timeHorizonMonths: Number(e.target.value || 0) }))} placeholder="Time horizon (months)" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.expectedReturn} onChange={e => setForm(prev => ({ ...prev, expectedReturn: Number(e.target.value || 0) }))} placeholder="Expected return %" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.interestRate} onChange={e => setForm(prev => ({ ...prev, interestRate: Number(e.target.value || 0) }))} placeholder="Interest rate %" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.savingsYield} onChange={e => setForm(prev => ({ ...prev, savingsYield: Number(e.target.value || 0) }))} placeholder="Savings yield %" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.taxRate} onChange={e => setForm(prev => ({ ...prev, taxRate: Number(e.target.value || 0) }))} placeholder="Tax rate %" />
            <input type="number" className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.inflation} onChange={e => setForm(prev => ({ ...prev, inflation: Number(e.target.value || 0) }))} placeholder="Inflation %" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.riskPreference} onChange={e => setForm(prev => ({ ...prev, riskPreference: e.target.value as ScenarioForm['riskPreference'] }))}>
              <option value="low">Risk: Low</option>
              <option value="medium">Risk: Medium</option>
              <option value="high">Risk: High</option>
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={form.assumptionProfile} onChange={e => setForm(prev => ({ ...prev, assumptionProfile: e.target.value }))}>
              <option>User Entered</option>
              <option>API Provided Baseline</option>
              <option>Saved Conservative Profile</option>
              <option>Saved Aggressive Profile</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSavedScenarios(prev => [...prev, { ...form, name: form.name || `Scenario ${prev.length + 1}` }])}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Save Scenario
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Projection Output</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Projected ending value: <span className="text-foreground font-semibold">{fmt(projection.value)}</span></p>
            <p>Interest saved/earned: <span className="text-foreground font-semibold">{fmt(projection.interestEarned)}</span></p>
            <p>Tax impact: <span className="text-foreground font-semibold">{fmt(projection.taxImpact)}</span></p>
            <p>Net benefit comparison: <span className="text-foreground font-semibold">{fmt(projection.netBenefit)}</span></p>
            <p>Inflation-adjusted present value: <span className="text-foreground font-semibold">{fmt(projection.presentValue)}</span></p>
            <p>Break-even point: <span className="text-foreground font-semibold">{projection.breakEvenMonths} months</span></p>
            <p>Risk notes: {form.riskPreference === 'high' ? 'Higher volatility expected.' : form.riskPreference === 'medium' ? 'Moderate volatility expected.' : 'Lower volatility expected.'}</p>
          </div>
          <p className="text-xs text-muted-foreground border border-border rounded-md p-2 bg-muted/40">
            Disclaimer: projections are estimates only and are not guaranteed.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-base font-semibold text-foreground mb-3">Saved Scenarios</h3>
        {savedScenarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved scenarios yet.</p>
        ) : (
          <div className="space-y-2">
            {savedScenarios.map((scenario, index) => (
              <div key={`${scenario.name}-${index}`} className="flex flex-col gap-2 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground">{scenarioTypeLabel[scenario.type]} · {scenario.ownerAllocation} · {scenario.timeHorizonMonths} months</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button type="button" onClick={() => setForm(scenario)} className="text-primary hover:underline">Load</button>
                  <button type="button" onClick={() => setSavedScenarios(prev => prev.filter((_, i) => i !== index))} className="text-destructive hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
