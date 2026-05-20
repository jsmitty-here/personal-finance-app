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

export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment' | 'loan_payment' | 'fee' | 'tax' | 'refund' | 'reimbursement' | 'adjustment';

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
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  subcategories: SubcategoryDefinition[];
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
  field: 'merchant' | 'description' | 'amount' | 'account' | 'type' | 'category' | 'tags';
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
  category: string;
  plannedAmount: number;
  actualAmount: number;
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
  createCategory(category: { name: string; icon: string }): Promise<CategoryDefinition>;
  updateCategory(categoryId: string, category: { name?: string; icon?: string }): Promise<CategoryDefinition>;
  createSubcategory(categoryId: string, subcategory: { name: string; icon: string }): Promise<SubcategoryDefinition>;
  updateSubcategory(categoryId: string, subcategoryId: string, subcategory: { name?: string; icon?: string }): Promise<SubcategoryDefinition>;

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
