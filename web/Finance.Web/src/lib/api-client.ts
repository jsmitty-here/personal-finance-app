export interface Owner {
  id: string;
  name: string;
  color?: string;
}

export interface Account {
  id: string;
  displayName: string;
  institution: string;
  type: 'checking' | 'savings' | 'credit_card' | 'brokerage' | 'retirement' | 'mortgage' | 'loan' | 'manual_asset' | 'manual_liability';
  balance: number;
  ownershipAllocation: OwnershipAllocation[];
  isActive: boolean;
  includeInNetWorth: boolean;
  includeInBudgeting: boolean;
  includeInTaxPlanning: boolean;
}

export interface OwnershipAllocation {
  ownerId: string;
  percentage: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  merchant?: string;
  type: TransactionType;
  category?: string;
  subcategory?: string;
  subSubcategory?: string;
  tags: string[];
  isReimbursable?: boolean;
  isInvestmentTransfer?: boolean;
  isManualOverride: boolean;
  ownershipOverride?: OwnershipAllocation[];
  splits?: TransactionSplit[];
}

export interface TransactionSplit {
  id: string;
  amount: number;
  category?: string;
  subcategory?: string;
  tags: string[];
  ownershipAllocation?: OwnershipAllocation[];
}

export interface SubcategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color?: string;
  transactionType: TransactionType;
  subcategories: SubcategoryDefinition[];
}

export interface CategoryPresentation {
  icon: string;
  color: string;
  categoryLabel: string;
  detailLabel: string;
}

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Housing: '#0f766e',
  Utilities: '#0284c7',
  Transport: '#7c3aed',
  Health: '#dc2626',
  Entertainment: '#db2777',
  Personal: '#8b5cf6',
  Household: '#16a34a',
  Income: '#059669',
  'Savings & Investments': '#2563eb',
}

export function getDefaultCategoryColor(categoryName?: string) {
  if (!categoryName) return '#64748b'
  return DEFAULT_CATEGORY_COLORS[categoryName] ?? '#64748b'
}

export function getCategoryPresentation(
  taxonomy: CategoryDefinition[],
  category?: string,
  subcategory?: string,
): CategoryPresentation {
  const resolvedCategory = taxonomy.find((entry) => entry.name === category)
  const resolvedSubcategory = resolvedCategory?.subcategories.find((entry) => entry.name === subcategory)
  const categoryColor = resolvedCategory?.color ?? getDefaultCategoryColor(category)

  return {
    icon: resolvedSubcategory?.icon ?? resolvedCategory?.icon ?? '🏷️',
    color: categoryColor,
    categoryLabel: category ?? 'Uncategorized',
    detailLabel: subcategory ? `${category ?? 'Uncategorized'} - ${subcategory}` : (category ?? 'Uncategorized'),
  }
}

export interface CategorizationRule {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'date' | 'account' | 'type' | 'category' | 'tags';
  operator: 'contains' | 'equals' | 'startsWith' | 'greaterThan' | 'lessThan';
  value: string;
}

export interface RuleAction {
  field: 'type' | 'category' | 'subcategory' | 'tags' | 'merchant';
  value: string;
}

export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'annual';
  ownerId?: string;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  category: string;
  subcategory?: string;
  parentItemId?: string;
  plannedAmount: number;
  actualAmount: number;
}

export interface BudgetCategoryGroup {
  parent: BudgetItem;
  children: BudgetItem[];
  other?: BudgetItem;
}

export function normalizeBudgetHierarchy(items: BudgetItem[], createId: () => string): BudgetItem[] {
  const normalized = items.map((item) => ({
    ...item,
    id: item.id || createId(),
    category: item.category.trim(),
    subcategory: item.subcategory?.trim() || undefined,
    plannedAmount: Number(item.plannedAmount || 0),
    actualAmount: Number(item.actualAmount || 0),
  }))

  const categoryOrder: string[] = []
  const categoryOrderSet = new Set<string>()
  const explicitParentsByCategory = new Map<string, BudgetItem>()
  const childrenByCategory = new Map<string, BudgetItem[]>()

  normalized.forEach((item) => {
    if (!item.category) return
    if (!categoryOrderSet.has(item.category)) {
      categoryOrderSet.add(item.category)
      categoryOrder.push(item.category)
    }
    if (item.subcategory) {
      const children = childrenByCategory.get(item.category) ?? []
      children.push({ ...item })
      childrenByCategory.set(item.category, children)
      return
    }
    if (!explicitParentsByCategory.has(item.category)) {
      explicitParentsByCategory.set(item.category, { ...item, parentItemId: undefined })
    }
  })

  return categoryOrder.flatMap((category) => {
    const children = (childrenByCategory.get(category) ?? []).map((item) => ({ ...item }))
    const childPlannedTotal = children.reduce((sum, item) => sum + item.plannedAmount, 0)
    const parent = explicitParentsByCategory.get(category)
      ? { ...explicitParentsByCategory.get(category)!, parentItemId: undefined }
      : {
          id: createId(),
          category,
          subcategory: undefined,
          parentItemId: undefined,
          plannedAmount: childPlannedTotal,
          actualAmount: 0,
        }

    if (parent.plannedAmount < childPlannedTotal) {
      parent.plannedAmount = childPlannedTotal
    }

    const attachedChildren = children.map((item) => ({
      ...item,
      parentItemId: parent.id,
    }))

    return [parent, ...attachedChildren]
  })
}

export function getTopLevelBudgetItems(items: BudgetItem[]): BudgetItem[] {
  return items.filter((item) => !item.subcategory)
}

export function getBudgetTotals(items: BudgetItem[]) {
  const topLevelItems = getTopLevelBudgetItems(items)
  const planned = topLevelItems.reduce((sum, item) => sum + item.plannedAmount, 0)
  const actual = topLevelItems.reduce((sum, item) => sum + item.actualAmount, 0)
  return { planned, actual, variance: planned - actual }
}

export function getBudgetCategoryGroups(items: BudgetItem[]): BudgetCategoryGroup[] {
  const parentById = new Map<string, BudgetItem>()
  const parentByCategory = new Map<string, BudgetItem>()

  items.forEach((item) => {
    if (!item.subcategory) {
      parentById.set(item.id, item)
      parentByCategory.set(item.category, item)
    }
  })

  const childrenByParentId = new Map<string, BudgetItem[]>()
  items.forEach((item) => {
    if (!item.subcategory) return
    const parent = item.parentItemId ? parentById.get(item.parentItemId) : parentByCategory.get(item.category)
    if (!parent) return
    const children = childrenByParentId.get(parent.id) ?? []
    children.push(item)
    childrenByParentId.set(parent.id, children)
  })

  return getTopLevelBudgetItems(items).map((parent) => {
    const children = childrenByParentId.get(parent.id) ?? []
    const childPlanned = children.reduce((sum, item) => sum + item.plannedAmount, 0)
    const childActual = children.reduce((sum, item) => sum + item.actualAmount, 0)
    const remainingPlanned = Math.max(0, parent.plannedAmount - childPlanned)
    const remainingActual = Math.max(0, parent.actualAmount - childActual)
    const other = children.length > 0 && (remainingPlanned > 0 || remainingActual > 0)
      ? {
          id: `${parent.id}-other`,
          category: parent.category,
          subcategory: 'Other',
          parentItemId: parent.id,
          plannedAmount: remainingPlanned,
          actualAmount: remainingActual,
        }
      : undefined

    return {
      parent,
      children,
      other,
    }
  })
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  asOf: string;
}

export interface CashFlowSummary {
  income: number;
  expenses: number;
  net: number;
  period: string;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface DrilldownReference {
  transactionIds?: string[];
  accountIds?: string[];
  loanAccountIds?: string[];
  holdingIds?: string[];
}

export interface ChartPoint {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
  tertiaryValue?: number;
  drilldown?: DrilldownReference;
}

export interface DataQualityFlags {
  uncategorized: number;
  excluded: number;
  pending: number;
  duplicate: number;
  estimated: number;
  manuallyEntered: number;
  syncNeeded: number;
}

export interface OverviewDashboardData {
  netWorthSnapshot: {
    netWorth: number;
    assets: number;
    liabilities: number;
    trend: ChartPoint[];
    drilldown?: DrilldownReference;
  };
  monthlyCashFlow: ChartPoint[];
  spendingByCategory: ChartPoint[];
  savingsRate: ChartPoint[];
  debtBalanceSummary: ChartPoint[];
  investmentAllocation: ChartPoint[];
  alerts: { id: string; severity: 'low' | 'medium' | 'high'; message: string; drilldown?: DrilldownReference }[];
  dataQuality: DataQualityFlags;
}

export interface SpendingDashboardData {
  spendingByCategory: ChartPoint[];
  categoryTrend: ChartPoint[];
  monthOverMonth: ChartPoint[];
  yearOverYear: ChartPoint[];
  merchantSpending: ChartPoint[];
  tagSpending: ChartPoint[];
  dailyBurn: ChartPoint[];
  spendingHeatmap: ChartPoint[];
  uncategorizedSpending: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface NetWorthDashboardData {
  netWorthOverTime: ChartPoint[];
  assetsVsLiabilities: ChartPoint[];
  netWorthBreakdown: ChartPoint[];
  ownershipAdjustedNetWorth: ChartPoint[];
  accountBalanceTrend: ChartPoint[];
  manualAssetValuationTrend: ChartPoint[];
  liabilityTrend: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface BudgetDashboardData {
  budgetVsActual: ChartPoint[];
  budgetVarianceTrend: ChartPoint[];
  budgetUtilization: ChartPoint[];
  categoryOverrunRanking: ChartPoint[];
  remainingBudgetBurndown: ChartPoint[];
  flexibleVsFixedSplit: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface LoanDashboardData {
  debtBalanceOverTime: ChartPoint[];
  debtBreakdown: ChartPoint[];
  principalVsInterest: ChartPoint[];
  payoffTimeline: ChartPoint[];
  interestCostProjection: ChartPoint[];
  extraPaymentImpact: ChartPoint[];
  debtStrategyComparison: ChartPoint[];
  debtToAssetsRatio: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface InvestmentsDashboardData {
  portfolioValueTrend: ChartPoint[];
  assetAllocation: ChartPoint[];
  accountAllocation: ChartPoint[];
  contributionsOverTime: ChartPoint[];
  investmentReturnEstimate: ChartPoint[];
  holdingsConcentration: ChartPoint[];
  retirementAccountTrend: ChartPoint[];
  taxableVsTaxAdvantagedSplit: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface IncomeDashboardData {
  incomeTrend: ChartPoint[];
  incomeBySource: ChartPoint[];
  grossVsNetIncome: ChartPoint[];
  irregularIncome: ChartPoint[];
  incomeStability: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface TaxesDashboardData {
  taxRelevantTransactions: ChartPoint[];
  deductibleExpenseSummary: ChartPoint[];
  estimatedTaxWithholding: ChartPoint[];
  taxableIncomeCategories: ChartPoint[];
  taxTreatmentBreakdown: ChartPoint[];
  retirementContributionTaxView: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface PlanningDashboardData {
  scenarioComparison: ChartPoint[];
  payDownDebtVsInvest: ChartPoint[];
  emergencyFundProjection: ChartPoint[];
  investmentGrowthProjection: ChartPoint[];
  breakEvenPoint: ChartPoint[];
  taxImpactEstimate: ChartPoint[];
  riskRangeProjection: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface ReviewDashboardData {
  categorizationCoverage: ChartPoint[];
  ruleMatchVolume: ChartPoint[];
  ruleConflictFrequency: ChartPoint[];
  manualOverrideTrend: ChartPoint[];
  topMerchantsWithoutRules: ChartPoint[];
  transactionsNeedingReview: ChartPoint[];
  dataQuality: DataQualityFlags;
}

export interface DashboardFiltersInput {
  period?: 'current-month' | 'trailing-3-months' | 'trailing-12-months' | 'ytd' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
  accountId?: string;
  accountType?: Account['type'];
  categories?: string[];
  subcategories?: string[];
  tag?: string;
  transactionType?: TransactionType;
  ownershipView?: 'household' | 'owner1' | 'owner2' | 'joint' | 'adjusted';
}

export interface IFinanceApiClient {
  // Owners
  getOwners(): Promise<Owner[]>;
  createOwner(owner: Omit<Owner, 'id'>): Promise<Owner>;
  updateOwner(id: string, owner: Partial<Owner>): Promise<Owner>;
  deleteOwner(id: string): Promise<void>;

  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account>;
  createAccount(account: Omit<Account, 'id'>): Promise<Account>;
  updateAccount(id: string, account: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Transactions
  getTransactions(filters?: { accountId?: string; ownerId?: string; dateFrom?: string; dateTo?: string }): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction>;
  updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction>;
  splitTransaction(id: string, splits: Omit<TransactionSplit, 'id'>[]): Promise<Transaction>;
  getCategoryTaxonomy(): Promise<CategoryDefinition[]>;
  createCategory(category: { name: string; icon: string; color?: string; transactionType?: TransactionType }): Promise<CategoryDefinition>;
  updateCategory(categoryId: string, category: { name?: string; icon?: string; color?: string; transactionType?: TransactionType }): Promise<CategoryDefinition>;
  createSubcategory(categoryId: string, subcategory: { name: string; icon: string; color?: string }): Promise<SubcategoryDefinition>;
  updateSubcategory(categoryId: string, subcategoryId: string, subcategory: { name?: string; icon?: string; color?: string }): Promise<SubcategoryDefinition>;

  // Rules
  getRules(): Promise<CategorizationRule[]>;
  getRule(id: string): Promise<CategorizationRule>;
  createRule(rule: Omit<CategorizationRule, 'id'>): Promise<CategorizationRule>;
  updateRule(id: string, rule: Partial<CategorizationRule>): Promise<CategorizationRule>;
  deleteRule(id: string): Promise<void>;
  reorderRules(ids: string[]): Promise<void>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget>;
  createBudget(budget: Omit<Budget, 'id'>): Promise<Budget>;
  updateBudget(id: string, budget: Partial<Budget>): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Dashboards
  getNetWorth(ownerId?: string): Promise<NetWorthSummary>;
  getCashFlow(period: string, ownerId?: string): Promise<CashFlowSummary>;
  getSpendingByCategory(period: string, ownerId?: string): Promise<SpendingByCategory[]>;
  getOverviewDashboard(filters?: DashboardFiltersInput): Promise<OverviewDashboardData>;
  getSpendingDashboard(filters?: DashboardFiltersInput): Promise<SpendingDashboardData>;
  getNetWorthDashboard(filters?: DashboardFiltersInput): Promise<NetWorthDashboardData>;
  getBudgetDashboard(filters?: DashboardFiltersInput): Promise<BudgetDashboardData>;
  getLoanDashboard(filters?: DashboardFiltersInput): Promise<LoanDashboardData>;
  getInvestmentsDashboard(filters?: DashboardFiltersInput): Promise<InvestmentsDashboardData>;
  getIncomeDashboard(filters?: DashboardFiltersInput): Promise<IncomeDashboardData>;
  getTaxesDashboard(filters?: DashboardFiltersInput): Promise<TaxesDashboardData>;
  getPlanningDashboard(filters?: DashboardFiltersInput): Promise<PlanningDashboardData>;
  getReviewDashboard(filters?: DashboardFiltersInput): Promise<ReviewDashboardData>;
}
