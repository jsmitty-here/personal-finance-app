import type {
  IFinanceApiClient, Owner, Account, Transaction, CategorizationRule,
  Budget, NetWorthSummary, CashFlowSummary, SpendingByCategory,
  TransactionSplit, CategoryDefinition, SubcategoryDefinition,
} from './api-client';

// --- Stub Data ---
const owners: Owner[] = [
  { id: 'o1', name: 'Justin', color: '#6366f1' },
  { id: 'o2', name: 'Spouse', color: '#ec4899' },
  { id: 'o3', name: 'Joint', color: '#10b981' },
];

const accounts: Account[] = [
  { id: 'a1', displayName: 'Chase Checking', institution: 'Chase', type: 'checking', balance: 8500, ownershipAllocation: [{ ownerId: 'o1', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
  { id: 'a2', displayName: 'Joint Savings', institution: 'Ally', type: 'savings', balance: 24000, ownershipAllocation: [{ ownerId: 'o1', percentage: 50 }, { ownerId: 'o2', percentage: 50 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
  { id: 'a3', displayName: 'Visa Credit Card', institution: 'Chase', type: 'credit_card', balance: -1200, ownershipAllocation: [{ ownerId: 'o3', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
  { id: 'a4', displayName: '401(k)', institution: 'Fidelity', type: 'retirement', balance: 95000, ownershipAllocation: [{ ownerId: 'o1', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: false, includeInTaxPlanning: true },
  { id: 'a5', displayName: 'Brokerage', institution: 'Schwab', type: 'brokerage', balance: 42000, ownershipAllocation: [{ ownerId: 'o1', percentage: 70 }, { ownerId: 'o2', percentage: 30 }], isActive: true, includeInNetWorth: true, includeInBudgeting: false, includeInTaxPlanning: true },
  { id: 'a6', displayName: 'Mortgage', institution: 'Wells Fargo', type: 'mortgage', balance: -320000, ownershipAllocation: [{ ownerId: 'o3', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: true },
];

const transactions: Transaction[] = [
  { id: 't1', accountId: 'a1', date: '2026-05-15', amount: -85.40, description: 'WHOLEFDS #123', merchant: 'Whole Foods', type: 'expense', category: 'Food', subcategory: 'Groceries', tags: ['Household'], isManualOverride: false },
  { id: 't2', accountId: 'a1', date: '2026-05-14', amount: -52.00, description: 'NETFLIX.COM', merchant: 'Netflix', type: 'expense', category: 'Entertainment', subcategory: 'Streaming', tags: ['Subscription'], isManualOverride: false },
  { id: 't3', accountId: 'a1', date: '2026-05-13', amount: 5200.00, description: 'PAYROLL DIRECT DEPOSIT', merchant: undefined, type: 'income', category: 'Income', subcategory: 'Salary', tags: [], isManualOverride: false },
  { id: 't4', accountId: 'a3', date: '2026-05-12', amount: -200.00, description: 'COSTCO WHSE #456', merchant: 'Costco', type: 'expense', category: 'Food', subcategory: 'Groceries', tags: ['Household', 'Costco'], isManualOverride: true,
    splits: [
      { id: 'sp1', amount: 120, category: 'Food', subcategory: 'Groceries', tags: ['Household'] },
      { id: 'sp2', amount: 50, category: 'Household', subcategory: 'Supplies', tags: ['Household'] },
      { id: 'sp3', amount: 30, category: 'Personal', subcategory: 'Other', tags: [] },
    ]
  },
  { id: 't5', accountId: 'a3', date: '2026-05-11', amount: -45.00, description: 'SPOTIFY', merchant: 'Spotify', type: 'expense', category: 'Entertainment', subcategory: 'Streaming', tags: ['Subscription'], isManualOverride: false },
  { id: 't6', accountId: 'a1', date: '2026-05-10', amount: -120.00, description: 'ELECTRIC BILL', merchant: 'Con Edison', type: 'expense', category: 'Utilities', subcategory: 'Electric', tags: [], isManualOverride: false },
];

const categoryTaxonomy: CategoryDefinition[] = [
  { id: 'cat-food', name: 'Food', icon: '🍽️', subcategories: [{ id: 'sub-food-groceries', name: 'Groceries', icon: '🛒' }, { id: 'sub-food-dining', name: 'Dining Out', icon: '🍜' }, { id: 'sub-food-coffee', name: 'Coffee', icon: '☕' }] },
  { id: 'cat-housing', name: 'Housing', icon: '🏠', subcategories: [{ id: 'sub-housing-rent', name: 'Rent / Mortgage', icon: '🏡' }, { id: 'sub-housing-maintenance', name: 'Maintenance', icon: '🧰' }, { id: 'sub-housing-furnishings', name: 'Furnishings', icon: '🛋️' }] },
  { id: 'cat-utilities', name: 'Utilities', icon: '💡', subcategories: [{ id: 'sub-utilities-electric', name: 'Electric', icon: '⚡' }, { id: 'sub-utilities-gas', name: 'Gas', icon: '🔥' }, { id: 'sub-utilities-water', name: 'Water', icon: '🚿' }, { id: 'sub-utilities-internet', name: 'Internet', icon: '🌐' }] },
  { id: 'cat-transport', name: 'Transport', icon: '🚗', subcategories: [{ id: 'sub-transport-fuel', name: 'Fuel', icon: '⛽' }, { id: 'sub-transport-transit', name: 'Public Transit', icon: '🚆' }, { id: 'sub-transport-ride', name: 'Rideshare', icon: '🚕' }] },
  { id: 'cat-health', name: 'Health', icon: '🩺', subcategories: [{ id: 'sub-health-medical', name: 'Medical', icon: '🧑‍⚕️' }, { id: 'sub-health-pharmacy', name: 'Pharmacy', icon: '💊' }, { id: 'sub-health-fitness', name: 'Fitness', icon: '🏋️' }] },
  { id: 'cat-entertainment', name: 'Entertainment', icon: '🎬', subcategories: [{ id: 'sub-entertainment-streaming', name: 'Streaming', icon: '📺' }, { id: 'sub-entertainment-games', name: 'Games', icon: '🎮' }, { id: 'sub-entertainment-events', name: 'Events', icon: '🎟️' }] },
  { id: 'cat-personal', name: 'Personal', icon: '🧍', subcategories: [{ id: 'sub-personal-clothing', name: 'Clothing', icon: '👕' }, { id: 'sub-personal-care', name: 'Personal Care', icon: '🧴' }, { id: 'sub-personal-other', name: 'Other', icon: '📦' }] },
  { id: 'cat-household', name: 'Household', icon: '🧹', subcategories: [{ id: 'sub-household-supplies', name: 'Supplies', icon: '🧼' }, { id: 'sub-household-pets', name: 'Pets', icon: '🐾' }] },
  { id: 'cat-income', name: 'Income', icon: '💰', subcategories: [{ id: 'sub-income-salary', name: 'Salary', icon: '💵' }, { id: 'sub-income-bonus', name: 'Bonus', icon: '🎉' }, { id: 'sub-income-interest', name: 'Interest', icon: '🏦' }] },
  { id: 'cat-savings', name: 'Savings & Investments', icon: '📈', subcategories: [{ id: 'sub-savings-brokerage', name: 'Brokerage', icon: '📊' }, { id: 'sub-savings-retirement', name: 'Retirement', icon: '🧓' }, { id: 'sub-savings-emergency', name: 'Emergency Fund', icon: '🛟' }] },
];

const rules: CategorizationRule[] = [
  { id: 'r1', name: 'Grocery Stores', priority: 1, isActive: true, conditions: [{ field: 'merchant', operator: 'contains', value: 'WHOLEFDS' }], actions: [{ field: 'category', value: 'Food' }, { field: 'subcategory', value: 'Groceries' }] },
  { id: 'r2', name: 'Streaming Services', priority: 2, isActive: true, conditions: [{ field: 'tags', operator: 'contains', value: 'Subscription' }], actions: [{ field: 'category', value: 'Entertainment' }, { field: 'subcategory', value: 'Streaming' }] },
  { id: 'r3', name: 'Salary Income', priority: 3, isActive: true, conditions: [{ field: 'description', operator: 'contains', value: 'PAYROLL' }], actions: [{ field: 'type', value: 'income' }, { field: 'category', value: 'Income' }] },
];

const budgets: Budget[] = [
  { id: 'b1', name: 'May 2026 Budget', period: 'monthly', items: [
    { category: 'Food', plannedAmount: 600, actualAmount: 285 },
    { category: 'Entertainment', plannedAmount: 100, actualAmount: 97 },
    { category: 'Utilities', plannedAmount: 200, actualAmount: 120 },
    { category: 'Transport', plannedAmount: 300, actualAmount: 180 },
  ]},
];

function delay<T>(val: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(val), 100));
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

function cloneTaxonomy() {
  return categoryTaxonomy.map(category => ({
    ...category,
    subcategories: [...category.subcategories],
  }));
}

class StubFinanceApiClient implements IFinanceApiClient {
  // Owners
  getOwners() { return delay([...owners]); }
  createOwner(o: Omit<Owner, 'id'>) {
    const created = { ...o, id: makeId() };
    owners.push(created);
    return delay(created);
  }
  updateOwner(id: string, o: Partial<Owner>) {
    const idx = owners.findIndex(x => x.id === id);
    if (idx >= 0) owners[idx] = { ...owners[idx], ...o };
    return delay(owners[idx >= 0 ? idx : 0]);
  }
  deleteOwner(id: string) {
    const idx = owners.findIndex(x => x.id === id);
    if (idx >= 0) owners.splice(idx, 1);
    return delay(undefined);
  }

  // Accounts
  getAccounts() { return delay([...accounts]); }
  getAccount(id: string) { return delay(accounts.find(a => a.id === id) ?? accounts[0]); }
  createAccount(a: Omit<Account, 'id'>) {
    const created = { ...a, id: makeId() };
    accounts.push(created);
    return delay(created);
  }
  updateAccount(id: string, a: Partial<Account>) {
    const idx = accounts.findIndex(x => x.id === id);
    if (idx >= 0) accounts[idx] = { ...accounts[idx], ...a };
    return delay(accounts[idx >= 0 ? idx : 0]);
  }
  deleteAccount(id: string) {
    const idx = accounts.findIndex(x => x.id === id);
    if (idx >= 0) accounts.splice(idx, 1);
    return delay(undefined);
  }

  // Transactions
  getTransactions(filters?: { accountId?: string; ownerId?: string; dateFrom?: string; dateTo?: string }) {
    let result = [...transactions];
    if (filters?.accountId) result = result.filter(t => t.accountId === filters.accountId);
    return delay(result);
  }
  getTransaction(id: string) { return delay(transactions.find(t => t.id === id) ?? transactions[0]); }
  updateTransaction(id: string, tx: Partial<Transaction>) {
    const idx = transactions.findIndex(x => x.id === id);
    if (idx >= 0) transactions[idx] = { ...transactions[idx], ...tx };
    return delay(transactions[idx >= 0 ? idx : 0]);
  }
  splitTransaction(id: string, splits: Omit<TransactionSplit, 'id'>[]) {
    const idx = transactions.findIndex(x => x.id === id);
    if (idx >= 0) {
      transactions[idx] = { ...transactions[idx], splits: splits.map(s => ({ ...s, id: makeId() })), isManualOverride: true };
    }
    return delay(transactions[idx >= 0 ? idx : 0]);
  }
  getCategoryTaxonomy() {
    return delay(cloneTaxonomy());
  }
  createCategory(category: { name: string; icon: string }) {
    const created: CategoryDefinition = { id: makeId(), name: category.name, icon: category.icon, subcategories: [] };
    categoryTaxonomy.push(created);
    return delay({ ...created, subcategories: [] });
  }
  updateCategory(categoryId: string, category: { name?: string; icon?: string }) {
    const idx = categoryTaxonomy.findIndex(x => x.id === categoryId);
    if (idx >= 0) {
      categoryTaxonomy[idx] = {
        ...categoryTaxonomy[idx],
        ...category,
      };
    }
    const fallback = categoryTaxonomy[0] ?? { id: makeId(), name: category.name ?? 'Uncategorized', icon: category.icon ?? '🏷️', subcategories: [] };
    return delay({
      ...fallback,
      subcategories: [...fallback.subcategories],
    });
  }
  createSubcategory(categoryId: string, subcategory: { name: string; icon: string }) {
    const category = categoryTaxonomy.find(x => x.id === categoryId);
    const created: SubcategoryDefinition = { id: makeId(), name: subcategory.name, icon: subcategory.icon };
    if (category) category.subcategories.push(created);
    return delay(created);
  }
  updateSubcategory(categoryId: string, subcategoryId: string, subcategory: { name?: string; icon?: string }) {
    const category = categoryTaxonomy.find(x => x.id === categoryId);
    const idx = category?.subcategories.findIndex(x => x.id === subcategoryId) ?? -1;
    if (category && idx >= 0) {
      category.subcategories[idx] = {
        ...category.subcategories[idx],
        ...subcategory,
      };
    }
    const fallback = category?.subcategories[idx >= 0 ? idx : 0] ?? { id: subcategoryId, name: subcategory.name ?? 'Other', icon: subcategory.icon ?? '📦' };
    return delay({ ...fallback });
  }

  // Rules
  getRules() { return delay([...rules]); }
  getRule(id: string) { return delay(rules.find(r => r.id === id) ?? rules[0]); }
  createRule(r: Omit<CategorizationRule, 'id'>) {
    const created = { ...r, id: makeId() };
    rules.push(created);
    return delay(created);
  }
  updateRule(id: string, r: Partial<CategorizationRule>) {
    const idx = rules.findIndex(x => x.id === id);
    if (idx >= 0) rules[idx] = { ...rules[idx], ...r };
    return delay(rules[idx >= 0 ? idx : 0]);
  }
  deleteRule(id: string) {
    const idx = rules.findIndex(x => x.id === id);
    if (idx >= 0) rules.splice(idx, 1);
    return delay(undefined);
  }
  reorderRules(ids: string[]) {
    ids.forEach((id, priority) => {
      const idx = rules.findIndex(x => x.id === id);
      if (idx >= 0) rules[idx].priority = priority + 1;
    });
    return delay(undefined);
  }

  // Budgets
  getBudgets() { return delay([...budgets]); }
  getBudget(id: string) { return delay(budgets.find(b => b.id === id) ?? budgets[0]); }
  createBudget(b: Omit<Budget, 'id'>) {
    const created = { ...b, id: makeId() };
    budgets.push(created);
    return delay(created);
  }
  updateBudget(id: string, b: Partial<Budget>) {
    const idx = budgets.findIndex(x => x.id === id);
    if (idx >= 0) budgets[idx] = { ...budgets[idx], ...b };
    return delay(budgets[idx >= 0 ? idx : 0]);
  }
  deleteBudget(id: string) {
    const idx = budgets.findIndex(x => x.id === id);
    if (idx >= 0) budgets.splice(idx, 1);
    return delay(undefined);
  }

  // Dashboards
  getNetWorth(ownerId?: string) {
    let accs = accounts;
    if (ownerId && ownerId !== 'all') {
      accs = accounts.filter(a => a.ownershipAllocation.some(o => o.ownerId === ownerId));
    }
    const assets = accs.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
    const liabs = accs.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);
    return delay<NetWorthSummary>({ totalAssets: assets, totalLiabilities: liabs, netWorth: assets - liabs, asOf: new Date().toISOString() });
  }
  getCashFlow(period: string, _ownerId?: string) {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return delay<CashFlowSummary>({ income, expenses, net: income - expenses, period });
  }
  getSpendingByCategory(_period: string, _ownerId?: string) {
    const byCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category ?? 'Uncategorized';
      byCategory[cat] = (byCategory[cat] ?? 0) + Math.abs(t.amount);
    });
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const result: SpendingByCategory[] = Object.entries(byCategory).map(([category, amount]) => ({
      category, amount, percentage: total > 0 ? (amount / total) * 100 : 0,
    }));
    return delay(result);
  }
}

export const apiClient: IFinanceApiClient = new StubFinanceApiClient();
