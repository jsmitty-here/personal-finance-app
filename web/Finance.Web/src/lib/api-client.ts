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
}
