import type {
  InvestmentsDashboardData,
  LoanDashboardData,
  OverviewDashboardData,
  PlanningDashboardData,
  SpendingDashboardData,
  TaxesDashboardData,
} from '@/lib/api-client'

export type AdvisorStatus = 'on-track' | 'watch' | 'action-needed'
export type AdvisorSeverity = 'low' | 'medium' | 'high'

export interface AdvisorCapability {
  id: string
  title: string
  status: AdvisorStatus
  summary: string
}

export interface AdvisorGuardrail {
  id: string
  severity: AdvisorSeverity
  title: string
  detail: string
}

export interface AdvisorRecommendation {
  id: string
  category: string
  title: string
  rationale: string
  estimatedImpact: number
}

export interface AdvisorInsights {
  retirementReadinessScore: number
  capabilities: AdvisorCapability[]
  guardrails: AdvisorGuardrail[]
  recommendations: AdvisorRecommendation[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function sumValues(points: { value: number }[]) {
  return points.reduce((sum, point) => sum + point.value, 0)
}

export function buildAdvisorInsights(input: {
  overview: OverviewDashboardData
  spending: SpendingDashboardData
  loans: LoanDashboardData
  investments: InvestmentsDashboardData
  taxes: TaxesDashboardData
  planning: PlanningDashboardData
}): AdvisorInsights {
  const { overview, spending, loans, investments, taxes, planning } = input

  const latestCashFlow = overview.monthlyCashFlow[overview.monthlyCashFlow.length - 1]
  const monthlyIncome = latestCashFlow?.value ?? 0
  const monthlyExpenses = latestCashFlow?.secondaryValue ?? 0
  const monthlyNet = latestCashFlow?.tertiaryValue ?? (monthlyIncome - monthlyExpenses)
  const savingsRate = overview.savingsRate[0]?.value ?? 0
  const debtToAssets = loans.debtToAssetsRatio[0]?.value ?? 0

  const totalPortfolio = sumValues(investments.accountAllocation)
  const equities = investments.assetAllocation.find(point => point.label.toLowerCase().includes('equit'))?.value ?? 0
  const equityShare = totalPortfolio > 0 ? (equities / totalPortfolio) * 100 : 0
  const topHolding = investments.holdingsConcentration[0]?.value ?? 0
  const topHoldingShare = totalPortfolio > 0 ? (topHolding / totalPortfolio) * 100 : 0

  const taxable = taxes.taxTreatmentBreakdown.find(point => point.key === 'taxable')?.value ?? 0
  const taxAdvantaged = taxes.taxTreatmentBreakdown.find(point => point.key === 'tax-advantaged')?.value ?? 0
  const taxableShare = taxable + taxAdvantaged > 0 ? (taxable / (taxable + taxAdvantaged)) * 100 : 0

  const scenarioValues = planning.scenarioComparison.map(point => point.value)
  const worstScenario = Math.min(...scenarioValues, 0)
  const bestScenario = Math.max(...scenarioValues, 0)
  const baseScenario = planning.scenarioComparison.find(point => point.key === 'base')?.value ?? scenarioValues[0] ?? 0
  const retirementReadinessScore = bestScenario > worstScenario
    ? clamp(((baseScenario - worstScenario) / (bestScenario - worstScenario)) * 100, 5, 95)
    : 50
  const emergencyTargetMonths = planning.breakEvenPoint.find(point => point.key === 'emergency-target')?.value ?? 0

  const monthOverMonthLatest = spending.monthOverMonth[spending.monthOverMonth.length - 1]
  const monthOverMonthChange = monthOverMonthLatest?.tertiaryValue ?? 0
  const priorMonthSpend = monthOverMonthLatest?.secondaryValue ?? 0
  const spendingSpikePct = priorMonthSpend > 0 ? (monthOverMonthChange / priorMonthSpend) * 100 : 0

  const guardrails: AdvisorGuardrail[] = []
  if (monthlyNet < 0) {
    guardrails.push({
      id: 'cash-depletion',
      severity: 'high',
      title: 'Cash depletion risk',
      detail: `Recent monthly cash flow is negative (${Math.round(monthlyNet)}).`,
    })
  }
  if (spendingSpikePct > 15) {
    guardrails.push({
      id: 'spending-spike',
      severity: 'medium',
      title: 'Spending anomaly',
      detail: `Spending is ${spendingSpikePct.toFixed(1)}% above the prior month.`,
    })
  }
  if (debtToAssets > 35) {
    guardrails.push({
      id: 'debt-burden',
      severity: 'high',
      title: 'Debt burden elevated',
      detail: `Debt-to-assets is ${debtToAssets.toFixed(1)}%.`,
    })
  }
  if (topHoldingShare > 20) {
    guardrails.push({
      id: 'concentration',
      severity: 'medium',
      title: 'Concentration risk',
      detail: `Largest holding is ${topHoldingShare.toFixed(1)}% of portfolio assets.`,
    })
  }
  if (retirementReadinessScore < 70) {
    guardrails.push({
      id: 'retirement-gap',
      severity: 'medium',
      title: 'Retirement readiness gap',
      detail: `Scenario readiness score is ${retirementReadinessScore.toFixed(0)}%.`,
    })
  }
  if (guardrails.length === 0) {
    guardrails.push({
      id: 'stable',
      severity: 'low',
      title: 'No critical guardrails currently triggered',
      detail: 'Continue tracking monthly changes and keep plan assumptions up to date.',
    })
  }

  const recommendations: AdvisorRecommendation[] = [
    {
      id: 'increase-savings',
      category: 'Cash Flow',
      title: 'Increase automated savings by $500/mo',
      rationale: 'Improves resilience and scenario outcomes from controllable behavior.',
      estimatedImpact: clamp((15 - savingsRate) * 1.4 + 6, 2, 20),
    },
    {
      id: 'debt-acceleration',
      category: 'Debt',
      title: 'Apply an extra $250/mo toward high-interest debt',
      rationale: 'Reduces interest drag and improves debt flexibility.',
      estimatedImpact: clamp((debtToAssets - 20) * 0.5 + 4, 1, 16),
    },
    {
      id: 'rebalance',
      category: 'Investments',
      title: 'Rebalance toward target allocation bands',
      rationale: 'Brings risk back in line with long-term plan.',
      estimatedImpact: clamp(Math.abs(equityShare - 60) * 0.35 + Math.abs(topHoldingShare - 12) * 0.4, 1, 12),
    },
    {
      id: 'asset-location',
      category: 'Taxes',
      title: 'Shift tax-inefficient assets into tax-advantaged accounts',
      rationale: 'Reduces avoidable tax drag over time.',
      estimatedImpact: clamp((taxableShare - 45) * 0.3 + 2, 1, 10),
    },
    {
      id: 'retirement-timeline',
      category: 'Long-Term Plan',
      title: 'Model retiring 1-2 years later in scenario planning',
      rationale: 'Higher contribution horizon and shorter withdrawal horizon improve odds.',
      estimatedImpact: clamp((75 - retirementReadinessScore) * 0.35 + 2, 1, 14),
    },
  ].sort((a, b) => b.estimatedImpact - a.estimatedImpact)

  const capabilities: AdvisorCapability[] = [
    {
      id: 'behavioral-coaching',
      title: 'Behavioral Coaching',
      status: guardrails.some(item => item.severity === 'high') ? 'action-needed' : guardrails.some(item => item.severity === 'medium') ? 'watch' : 'on-track',
      summary: `${guardrails.length} active guardrail${guardrails.length === 1 ? '' : 's'} in current filters.`,
    },
    {
      id: 'holistic-planning',
      title: 'Holistic Planning',
      status: monthlyNet >= 0 && savingsRate >= 10 ? 'on-track' : 'watch',
      summary: `Monthly net ${monthlyNet >= 0 ? 'surplus' : 'deficit'} and savings rate ${savingsRate.toFixed(1)}%.`,
    },
    {
      id: 'tax-optimization',
      title: 'Tax-Aware Guidance',
      status: taxableShare <= 55 ? 'on-track' : 'watch',
      summary: `${taxableShare.toFixed(1)}% of investable assets currently taxable.`,
    },
    {
      id: 'portfolio-discipline',
      title: 'Portfolio Discipline',
      status: topHoldingShare > 20 || equityShare > 75 || equityShare < 40 ? 'action-needed' : 'on-track',
      summary: `Equity share ${equityShare.toFixed(1)}%, top holding ${topHoldingShare.toFixed(1)}%.`,
    },
    {
      id: 'retirement-planning',
      title: 'Retirement & Long-Term Planning',
      status: retirementReadinessScore >= 75 ? 'on-track' : retirementReadinessScore >= 60 ? 'watch' : 'action-needed',
      summary: `Readiness ${retirementReadinessScore.toFixed(0)}% with emergency target ${Math.round(emergencyTargetMonths)} months away.`,
    },
  ]

  return {
    retirementReadinessScore: Math.round(retirementReadinessScore),
    capabilities,
    guardrails,
    recommendations,
  }
}
