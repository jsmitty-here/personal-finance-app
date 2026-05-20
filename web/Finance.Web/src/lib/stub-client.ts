import type {
  IFinanceApiClient, Owner, Account, Transaction, CategorizationRule,
  Budget, NetWorthSummary, CashFlowSummary, SpendingByCategory,
  TransactionSplit, CategoryDefinition, SubcategoryDefinition,
  DashboardFiltersInput, DataQualityFlags, OverviewDashboardData,
  SpendingDashboardData, NetWorthDashboardData, BudgetDashboardData,
  LoanDashboardData, ChartPoint,
} from './api-client';

// --- Stub Data ---
const owners: Owner[] = [
  { id: 'o1', name: 'Justin', color: '#6366f1' },
  { id: 'o2', name: 'Spouse', color: '#ec4899' },
  { id: 'o3', name: 'Joint', color: '#10b981' },
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

function createSeededRandom(seed: number) {
  let current = seed >>> 0
  return () => {
    current += 0x6D2B79F5
    let t = current
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function withJitter(base: number, pctRange: number, random: () => number) {
  const jitter = (random() * 2 - 1) * pctRange
  return Math.round(base * (1 + jitter) * 100) / 100
}

function formatDate(date: Date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function monthStartOffset(monthsAgo: number) {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  monthStart.setUTCMonth(monthStart.getUTCMonth() - monthsAgo)
  return monthStart
}

function getMonthlyActual(transactions: Transaction[], monthKey: string, category: string) {
  return transactions
    .filter(tx => tx.type === 'expense' && tx.category === category && tx.date.startsWith(monthKey))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
}

function simulateInvestmentBalance(start: number, monthlyContribution: number, months: number, annualReturn: number, monthlyJitter: number, random: () => number) {
  const MIN_MONTHLY_RETURN = -0.04
  const MAX_MONTHLY_RETURN = 0.06
  let balance = start
  const monthlyBaseReturn = Math.pow(1 + annualReturn, 1 / 12) - 1
  for (let i = 0; i < months; i += 1) {
    const monthlyReturn = clamp(monthlyBaseReturn + (random() * 2 - 1) * monthlyJitter, MIN_MONTHLY_RETURN, MAX_MONTHLY_RETURN)
    balance = (balance + monthlyContribution) * (1 + monthlyReturn)
  }
  return Math.round(balance * 100) / 100
}

function generateSyntheticFinancialData() {
  const random = createSeededRandom(20260520)
  const generatedTransactions: Transaction[] = []
  let txCounter = 1
  const nextTxId = () => `t${txCounter++}`

  for (let monthsAgo = 35; monthsAgo >= 0; monthsAgo -= 1) {
    const monthStart = monthStartOffset(monthsAgo)
    const year = monthStart.getUTCFullYear()
    const month = monthStart.getUTCMonth()
    const day = (n: number) => formatDate(new Date(Date.UTC(year, month, n)))

    generatedTransactions.push(
      { id: nextTxId(), accountId: 'a1', date: day(2), amount: withJitter(5200, 0.08, random), description: 'PAYROLL DIRECT DEPOSIT', merchant: undefined, type: 'income', category: 'Income', subcategory: 'Salary', tags: ['Payroll'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(16), amount: withJitter(5200, 0.08, random), description: 'PAYROLL DIRECT DEPOSIT', merchant: undefined, type: 'income', category: 'Income', subcategory: 'Salary', tags: ['Payroll'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(4), amount: -withJitter(88, 0.22, random), description: 'WHOLEFDS #123', merchant: 'Whole Foods', type: 'expense', category: 'Food', subcategory: 'Groceries', tags: ['Household'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a3', date: day(11), amount: -withJitter(142, 0.25, random), description: 'COSTCO WHSE #456', merchant: 'Costco', type: 'expense', category: 'Food', subcategory: 'Groceries', tags: ['Household', 'Costco'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(22), amount: -withJitter(62, 0.25, random), description: 'TRADER JOES', merchant: 'Trader Joe\'s', type: 'expense', category: 'Food', subcategory: 'Groceries', tags: ['Household'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(7), amount: -withJitter(74, 0.3, random), description: 'LOCAL BISTRO', merchant: 'Local Bistro', type: 'expense', category: 'Food', subcategory: 'Dining Out', tags: ['Dining'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(19), amount: -withJitter(68, 0.3, random), description: 'RAMEN HOUSE', merchant: 'Ramen House', type: 'expense', category: 'Food', subcategory: 'Dining Out', tags: ['Dining'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(3), amount: -withJitter(1250, 0.01, random), description: 'MORTGAGE PAYMENT', merchant: 'Wells Fargo', type: 'expense', category: 'Housing', subcategory: 'Rent / Mortgage', tags: ['Housing'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(10), amount: -withJitter(120, 0.15, random), description: 'ELECTRIC BILL', merchant: 'Con Edison', type: 'expense', category: 'Utilities', subcategory: 'Electric', tags: ['Utility'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(13), amount: -withJitter(70, 0.08, random), description: 'INTERNET BILL', merchant: 'Verizon', type: 'expense', category: 'Utilities', subcategory: 'Internet', tags: ['Utility'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a3', date: day(9), amount: -withJitter(58, 0.2, random), description: 'SHELL GAS', merchant: 'Shell', type: 'expense', category: 'Transport', subcategory: 'Fuel', tags: ['Auto'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a3', date: day(24), amount: -withJitter(61, 0.2, random), description: 'CHEVRON GAS', merchant: 'Chevron', type: 'expense', category: 'Transport', subcategory: 'Fuel', tags: ['Auto'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(5), amount: -withJitter(52, 0.02, random), description: 'NETFLIX.COM', merchant: 'Netflix', type: 'expense', category: 'Entertainment', subcategory: 'Streaming', tags: ['Subscription'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(6), amount: -withJitter(16, 0.03, random), description: 'SPOTIFY', merchant: 'Spotify', type: 'expense', category: 'Entertainment', subcategory: 'Streaming', tags: ['Subscription'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(18), amount: -withJitter(42, 0.25, random), description: 'TARGET #315', merchant: 'Target', type: 'expense', category: 'Household', subcategory: 'Supplies', tags: ['Household'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(20), amount: -withJitter(750, 0.05, random), description: '401K CONTRIBUTION', merchant: undefined, type: 'investment', category: 'Savings & Investments', subcategory: 'Retirement', tags: ['Investment'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a1', date: day(21), amount: -withJitter(500, 0.06, random), description: 'BROKERAGE TRANSFER', merchant: 'Schwab', type: 'investment', category: 'Savings & Investments', subcategory: 'Brokerage', tags: ['Investment'], isManualOverride: false },
      { id: nextTxId(), accountId: 'a5', date: day(26), amount: withJitter(82, 0.4, random), description: 'DIVIDEND PAYMENT', merchant: 'Schwab', type: 'income', category: 'Income', subcategory: 'Interest', tags: ['Investment Income'], isManualOverride: false },
    )

    if ((month + 1) % 3 === 0) {
      generatedTransactions.push(
        { id: nextTxId(), accountId: 'a4', date: day(27), amount: withJitter(240, 0.35, random), description: 'RETIREMENT DIVIDEND', merchant: 'Fidelity', type: 'income', category: 'Income', subcategory: 'Interest', tags: ['Investment Income'], isManualOverride: false },
      )
    }
  }

  const latestMonthKey = formatDate(new Date()).slice(0, 7)
  const splitBase = generatedTransactions
    .filter(tx => tx.type === 'expense' && tx.category === 'Food' && tx.date.startsWith(latestMonthKey))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
  if (splitBase) {
    splitBase.isManualOverride = true
    splitBase.splits = [
      { id: 'sp1', amount: Math.round(Math.abs(splitBase.amount) * 0.6 * 100) / 100, category: 'Food', subcategory: 'Groceries', tags: ['Household'] },
      { id: 'sp2', amount: Math.round(Math.abs(splitBase.amount) * 0.25 * 100) / 100, category: 'Household', subcategory: 'Supplies', tags: ['Household'] },
      { id: 'sp3', amount: Math.round(Math.abs(splitBase.amount) * 0.15 * 100) / 100, category: 'Personal', subcategory: 'Other', tags: [] },
    ]
  }

  generatedTransactions.sort((a, b) => b.date.localeCompare(a.date))

  const retirementBalance = simulateInvestmentBalance(91000, 750, 36, 0.07, 0.018, random)
  const brokerageBalance = simulateInvestmentBalance(39000, 500, 36, 0.08, 0.022, random)

  const generatedAccounts: Account[] = [
    { id: 'a1', displayName: 'Chase Checking', institution: 'Chase', type: 'checking', balance: 9800, ownershipAllocation: [{ ownerId: 'o1', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
    { id: 'a2', displayName: 'Joint Savings', institution: 'Ally', type: 'savings', balance: 28800, ownershipAllocation: [{ ownerId: 'o1', percentage: 50 }, { ownerId: 'o2', percentage: 50 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
    { id: 'a3', displayName: 'Visa Credit Card', institution: 'Chase', type: 'credit_card', balance: -1860, ownershipAllocation: [{ ownerId: 'o3', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: false },
    { id: 'a4', displayName: '401(k)', institution: 'Fidelity', type: 'retirement', balance: retirementBalance, ownershipAllocation: [{ ownerId: 'o1', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: false, includeInTaxPlanning: true },
    { id: 'a5', displayName: 'Brokerage', institution: 'Schwab', type: 'brokerage', balance: brokerageBalance, ownershipAllocation: [{ ownerId: 'o1', percentage: 70 }, { ownerId: 'o2', percentage: 30 }], isActive: true, includeInNetWorth: true, includeInBudgeting: false, includeInTaxPlanning: true },
    { id: 'a6', displayName: 'Mortgage', institution: 'Wells Fargo', type: 'mortgage', balance: -301000, ownershipAllocation: [{ ownerId: 'o3', percentage: 100 }], isActive: true, includeInNetWorth: true, includeInBudgeting: true, includeInTaxPlanning: true },
  ]

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const currentMonthKey = formatDate(new Date()).slice(0, 7)
  const generatedBudgets: Budget[] = [
    {
      id: 'b1',
      name: `${monthLabel} Budget`,
      period: 'monthly',
      items: [
        { category: 'Food', plannedAmount: 980, actualAmount: Math.round(getMonthlyActual(generatedTransactions, currentMonthKey, 'Food')) },
        { category: 'Housing', plannedAmount: 1300, actualAmount: Math.round(getMonthlyActual(generatedTransactions, currentMonthKey, 'Housing')) },
        { category: 'Utilities', plannedAmount: 260, actualAmount: Math.round(getMonthlyActual(generatedTransactions, currentMonthKey, 'Utilities')) },
        { category: 'Transport', plannedAmount: 220, actualAmount: Math.round(getMonthlyActual(generatedTransactions, currentMonthKey, 'Transport')) },
        { category: 'Entertainment', plannedAmount: 120, actualAmount: Math.round(getMonthlyActual(generatedTransactions, currentMonthKey, 'Entertainment')) },
      ],
    },
  ]

  return {
    accounts: generatedAccounts,
    transactions: generatedTransactions,
    budgets: generatedBudgets,
  }
}

const { accounts, transactions, budgets } = generateSyntheticFinancialData()

const rules: CategorizationRule[] = [
  { id: 'r1', name: 'Grocery Stores', priority: 1, isActive: true, conditions: [{ field: 'merchant', operator: 'contains', value: 'WHOLEFDS' }], actions: [{ field: 'category', value: 'Food' }, { field: 'subcategory', value: 'Groceries' }] },
  { id: 'r2', name: 'Streaming Services', priority: 2, isActive: true, conditions: [{ field: 'tags', operator: 'contains', value: 'Subscription' }], actions: [{ field: 'category', value: 'Entertainment' }, { field: 'subcategory', value: 'Streaming' }] },
  { id: 'r3', name: 'Salary Income', priority: 3, isActive: true, conditions: [{ field: 'description', operator: 'contains', value: 'PAYROLL' }], actions: [{ field: 'type', value: 'income' }, { field: 'category', value: 'Income' }] },
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

function monthKey(date: string) {
  return date.slice(0, 7)
}

function asChartPoints(map: Record<string, number>, drilldownIdsByKey?: Record<string, string[]>): ChartPoint[] {
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      label: key,
      value,
      drilldown: drilldownIdsByKey?.[key] ? { transactionIds: drilldownIdsByKey[key] } : undefined,
    }))
}

function getDateRange(period?: DashboardFiltersInput['period']) {
  const now = new Date()
  const to = formatDate(now)
  if (!period || period === 'current-month') {
    const from = formatDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
    return { from, to }
  }
  if (period === 'trailing-3-months') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
    return { from: formatDate(d), to }
  }
  if (period === 'trailing-12-months') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
    return { from: formatDate(d), to }
  }
  if (period === 'ytd') {
    return { from: formatDate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to }
  }
  return { from: '', to }
}

function getOwnerIdForOwnershipView(ownershipView?: DashboardFiltersInput['ownershipView']) {
  if (ownershipView === 'owner1') return 'o1'
  if (ownershipView === 'owner2') return 'o2'
  if (ownershipView === 'joint') return 'o3'
  return undefined
}

function applyDashboardFilters(filters?: DashboardFiltersInput) {
  const ownerFromView = getOwnerIdForOwnershipView(filters?.ownershipView)
  const ownerId = filters?.ownerId && filters.ownerId !== 'all' ? filters.ownerId : ownerFromView
  const resolvedRange = filters?.period === 'custom'
    ? { from: filters?.dateFrom ?? '', to: filters?.dateTo ?? '' }
    : getDateRange(filters?.period)
  const selectedAccountIds = accounts
    .filter(account => {
      if (filters?.accountId && filters.accountId !== 'all' && account.id !== filters.accountId) return false
      if (filters?.accountType && account.type !== filters.accountType) return false
      if (ownerId && !account.ownershipAllocation.some(o => o.ownerId === ownerId)) return false
      return true
    })
    .map(account => account.id)

  const filteredAccounts = accounts.filter(a => selectedAccountIds.includes(a.id))
  const filteredTransactions = transactions.filter(tx => {
    if (!selectedAccountIds.includes(tx.accountId)) return false
    if (filters?.transactionType && tx.type !== filters.transactionType) return false
    if (filters?.categories?.length && !filters.categories.includes(tx.category ?? '')) return false
    if (filters?.subcategories?.length && !filters.subcategories.includes(tx.subcategory ?? '')) return false
    if (filters?.tag && filters.tag !== 'all' && !tx.tags.includes(filters.tag)) return false
    if (resolvedRange.from && tx.date < resolvedRange.from) return false
    if (resolvedRange.to && tx.date > resolvedRange.to) return false
    return true
  })

  return { filteredAccounts, filteredTransactions }
}

function getDataQualityFlags(filteredTransactions: Transaction[], filteredAccounts: Account[]): DataQualityFlags {
  const duplicates = new Set<string>()
  let duplicateCount = 0
  filteredTransactions.forEach(tx => {
    const key = `${tx.date}|${tx.amount}|${tx.description}`
    if (duplicates.has(key)) {
      duplicateCount += 1
    } else {
      duplicates.add(key)
    }
  })
  return {
    uncategorized: filteredTransactions.filter(t => !t.category).length,
    excluded: filteredAccounts.filter(a => !a.includeInBudgeting).length,
    pending: filteredTransactions.filter(t => t.description.toLowerCase().includes('pending')).length,
    duplicate: duplicateCount,
    estimated: filteredTransactions.filter(t => t.tags.some(tag => tag.toLowerCase().includes('estimated'))).length,
    manuallyEntered: filteredTransactions.filter(t => t.isManualOverride).length,
    syncNeeded: filteredAccounts.filter(a => a.type === 'manual_asset' || a.type === 'manual_liability').length,
  }
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
    if (filters?.ownerId) {
      const accountIds = accounts
        .filter(account => account.ownershipAllocation.some(allocation => allocation.ownerId === filters.ownerId))
        .map(account => account.id)
      result = result.filter(t => accountIds.includes(t.accountId))
    }
    const dateFrom = filters?.dateFrom
    const dateTo = filters?.dateTo
    if (dateFrom) result = result.filter(t => t.date >= dateFrom);
    if (dateTo) result = result.filter(t => t.date <= dateTo);
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
    if (idx < 0) throw new Error(`Category ${categoryId} not found`);
    categoryTaxonomy[idx] = {
      ...categoryTaxonomy[idx],
      ...category,
    };
    const fallback = categoryTaxonomy[idx];
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
    if (!category) throw new Error(`Category ${categoryId} not found`);
    const idx = category.subcategories.findIndex(x => x.id === subcategoryId);
    if (idx < 0) throw new Error(`Subcategory ${subcategoryId} not found`);
    category.subcategories[idx] = {
      ...category.subcategories[idx],
      ...subcategory,
    };
    const fallback = category.subcategories[idx];
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

  getOverviewDashboard(filters?: DashboardFiltersInput) {
    const { filteredAccounts, filteredTransactions } = applyDashboardFilters(filters)
    const assets = filteredAccounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
    const liabilities = Math.abs(filteredAccounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0))
    const netWorth = assets - liabilities

    const monthlyIncomeMap: Record<string, number> = {}
    const monthlyExpenseMap: Record<string, number> = {}
    const monthTxIds: Record<string, string[]> = {}
    filteredTransactions.forEach(tx => {
      const key = monthKey(tx.date)
      monthTxIds[key] = monthTxIds[key] ?? []
      monthTxIds[key].push(tx.id)
      if (tx.type === 'income') monthlyIncomeMap[key] = (monthlyIncomeMap[key] ?? 0) + tx.amount
      if (tx.type === 'expense') monthlyExpenseMap[key] = (monthlyExpenseMap[key] ?? 0) + Math.abs(tx.amount)
    })
    const months = Array.from(new Set([...Object.keys(monthlyIncomeMap), ...Object.keys(monthlyExpenseMap)])).sort((a, b) => a.localeCompare(b))
    const monthlyCashFlow = months.map(key => ({
      key,
      label: key,
      value: monthlyIncomeMap[key] ?? 0,
      secondaryValue: monthlyExpenseMap[key] ?? 0,
      tertiaryValue: (monthlyIncomeMap[key] ?? 0) - (monthlyExpenseMap[key] ?? 0),
      drilldown: { transactionIds: monthTxIds[key] ?? [] },
    }))
    const spendingByCategory: Record<string, number> = {}
    const spendingDrilldown: Record<string, string[]> = {}
    filteredTransactions.filter(t => t.type === 'expense').forEach(tx => {
      const category = tx.category ?? 'Uncategorized'
      spendingByCategory[category] = (spendingByCategory[category] ?? 0) + Math.abs(tx.amount)
      spendingDrilldown[category] = spendingDrilldown[category] ?? []
      spendingDrilldown[category].push(tx.id)
    })
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    const debtBreakdown: Record<string, number> = {}
    filteredAccounts.filter(a => a.balance < 0).forEach(account => {
      debtBreakdown[account.displayName] = Math.abs(account.balance)
    })
    const investmentBreakdown: Record<string, number> = {}
    filteredAccounts
      .filter(a => a.type === 'brokerage' || a.type === 'retirement')
      .forEach(account => {
        investmentBreakdown[account.displayName] = account.balance
      })
    const alerts: OverviewDashboardData['alerts'] = []
    const dataQuality = getDataQualityFlags(filteredTransactions, filteredAccounts)
    if (dataQuality.uncategorized > 0) alerts.push({ id: 'uncategorized', severity: 'high', message: `${dataQuality.uncategorized} uncategorized transactions`, drilldown: { transactionIds: filteredTransactions.filter(t => !t.category).map(t => t.id) } })
    if (dataQuality.pending > 0) alerts.push({ id: 'pending', severity: 'medium', message: `${dataQuality.pending} pending transactions`, drilldown: { transactionIds: filteredTransactions.filter(t => t.description.toLowerCase().includes('pending')).map(t => t.id) } })
    if (dataQuality.syncNeeded > 0) alerts.push({ id: 'sync', severity: 'low', message: `${dataQuality.syncNeeded} manual account(s) may need sync review`, drilldown: { accountIds: filteredAccounts.filter(a => a.type === 'manual_asset' || a.type === 'manual_liability').map(a => a.id) } })
    return delay<OverviewDashboardData>({
      netWorthSnapshot: {
        netWorth,
        assets,
        liabilities,
        trend: months.map(key => ({
          key,
          label: key,
          value: (monthlyIncomeMap[key] ?? 0) - (monthlyExpenseMap[key] ?? 0),
          drilldown: { transactionIds: monthTxIds[key] ?? [] },
        })),
        drilldown: { accountIds: filteredAccounts.map(a => a.id) },
      },
      monthlyCashFlow,
      spendingByCategory: asChartPoints(spendingByCategory, spendingDrilldown),
      savingsRate: [{ key: 'savings-rate', label: 'Savings Rate', value: savingsRate }],
      debtBalanceSummary: asChartPoints(debtBreakdown),
      investmentAllocation: asChartPoints(investmentBreakdown),
      alerts,
      dataQuality,
    })
  }

  getSpendingDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const expenses = filteredTransactions.filter(t => t.type === 'expense')
    const byCategory: Record<string, number> = {}
    const byCategoryMonth: Record<string, number> = {}
    const byMerchant: Record<string, number> = {}
    const byTag: Record<string, number> = {}
    const byDay: Record<string, number> = {}
    expenses.forEach(tx => {
      const category = tx.category ?? 'Uncategorized'
      byCategory[category] = (byCategory[category] ?? 0) + Math.abs(tx.amount)
      const categoryMonthKey = `${monthKey(tx.date)} · ${category}`
      byCategoryMonth[categoryMonthKey] = (byCategoryMonth[categoryMonthKey] ?? 0) + Math.abs(tx.amount)
      const merchant = tx.merchant ?? 'Unknown Merchant'
      byMerchant[merchant] = (byMerchant[merchant] ?? 0) + Math.abs(tx.amount)
      if (tx.tags.length === 0) byTag['(none)'] = (byTag['(none)'] ?? 0) + Math.abs(tx.amount)
      tx.tags.forEach(tag => {
        byTag[tag] = (byTag[tag] ?? 0) + Math.abs(tx.amount)
      })
      byDay[tx.date] = (byDay[tx.date] ?? 0) + Math.abs(tx.amount)
    })
    const monthly = asChartPoints(
      Object.entries(byDay).reduce<Record<string, number>>((acc, [date, value]) => {
        const key = monthKey(date)
        acc[key] = (acc[key] ?? 0) + value
        return acc
      }, {}),
    )
    const monthOverMonth = monthly.map((point, index) => ({
      ...point,
      secondaryValue: index > 0 ? monthly[index - 1].value : point.value,
      tertiaryValue: index > 0 ? point.value - monthly[index - 1].value : 0,
    }))
    return delay<SpendingDashboardData>({
      spendingByCategory: asChartPoints(byCategory),
      categoryTrend: asChartPoints(byCategoryMonth),
      monthOverMonth,
      yearOverYear: monthOverMonth,
      merchantSpending: asChartPoints(byMerchant),
      tagSpending: asChartPoints(byTag),
      dailyBurn: asChartPoints(byDay),
      spendingHeatmap: asChartPoints(byDay),
      uncategorizedSpending: asChartPoints({ Uncategorized: byCategory.Uncategorized ?? 0 }),
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getNetWorthDashboard(filters?: DashboardFiltersInput) {
    const { filteredAccounts, filteredTransactions } = applyDashboardFilters(filters)
    const months = Array.from(new Set(filteredTransactions.map(tx => monthKey(tx.date)))).sort((a, b) => a.localeCompare(b))
    const netWorthOverTime = months.map(key => {
      const monthTransactions = filteredTransactions.filter(tx => monthKey(tx.date) === key)
      const monthNet = monthTransactions.reduce((sum, tx) => {
        if (tx.type === 'income') return sum + tx.amount
        if (tx.type === 'expense') return sum - Math.abs(tx.amount)
        return sum
      }, 0)
      return { key, label: key, value: monthNet, drilldown: { transactionIds: monthTransactions.map(tx => tx.id) } }
    })
    const assets = filteredAccounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0)
    const liabilities = Math.abs(filteredAccounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0))
    const byType: Record<string, number> = {}
    filteredAccounts.forEach(account => {
      byType[account.type] = (byType[account.type] ?? 0) + account.balance
    })
    const owner1 = filteredAccounts.reduce((sum, account) => {
      const allocation = account.ownershipAllocation.find(o => o.ownerId === 'o1')?.percentage ?? 0
      return sum + account.balance * (allocation / 100)
    }, 0)
    const owner2 = filteredAccounts.reduce((sum, account) => {
      const allocation = account.ownershipAllocation.find(o => o.ownerId === 'o2')?.percentage ?? 0
      return sum + account.balance * (allocation / 100)
    }, 0)
    const liabilitiesByAccount: Record<string, number> = {}
    filteredAccounts.filter(a => a.balance < 0).forEach(a => {
      liabilitiesByAccount[a.displayName] = Math.abs(a.balance)
    })
    return delay<NetWorthDashboardData>({
      netWorthOverTime,
      assetsVsLiabilities: [
        { key: 'assets', label: 'Assets', value: assets, drilldown: { accountIds: filteredAccounts.filter(a => a.balance >= 0).map(a => a.id) } },
        { key: 'liabilities', label: 'Liabilities', value: liabilities, drilldown: { accountIds: filteredAccounts.filter(a => a.balance < 0).map(a => a.id) } },
      ],
      netWorthBreakdown: asChartPoints(byType),
      ownershipAdjustedNetWorth: [
        { key: 'owner1', label: 'Owner 1', value: owner1 },
        { key: 'owner2', label: 'Owner 2', value: owner2 },
      ],
      accountBalanceTrend: asChartPoints(Object.fromEntries(filteredAccounts.map(a => [a.displayName, a.balance]))),
      manualAssetValuationTrend: asChartPoints(Object.fromEntries(filteredAccounts.filter(a => a.type === 'manual_asset').map(a => [a.displayName, a.balance]))),
      liabilityTrend: asChartPoints(liabilitiesByAccount),
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getBudgetDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const budgetItems = budgets.flatMap(b => b.items)
    const budgetVsActual = budgetItems.map(item => ({
      key: item.category,
      label: item.category,
      value: item.plannedAmount,
      secondaryValue: item.actualAmount,
      tertiaryValue: item.plannedAmount - item.actualAmount,
    }))
    const utilization = budgetItems.map(item => ({
      key: item.category,
      label: item.category,
      value: item.plannedAmount > 0 ? (item.actualAmount / item.plannedAmount) * 100 : 0,
      drilldown: { transactionIds: filteredTransactions.filter(tx => tx.category === item.category).map(tx => tx.id) },
    }))
    const overrun = [...budgetVsActual]
      .map(item => ({ ...item, value: Math.max(0, -(item.tertiaryValue ?? 0)) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
    const dailySpend = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.date] = (acc[tx.date] ?? 0) + Math.abs(tx.amount)
        return acc
      }, {})
    let remaining = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0)
    const burndown = Object.entries(dailySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        remaining -= amount
        return { key: date, label: date, value: remaining }
      })
    const fixedBudget = budgetItems.filter(item => ['Housing', 'Utilities', 'Transport'].includes(item.category)).reduce((sum, item) => sum + item.plannedAmount, 0)
    const variableBudget = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0) - fixedBudget
    return delay<BudgetDashboardData>({
      budgetVsActual,
      budgetVarianceTrend: budgetVsActual,
      budgetUtilization: utilization,
      categoryOverrunRanking: overrun,
      remainingBudgetBurndown: burndown,
      flexibleVsFixedSplit: [
        { key: 'fixed', label: 'Fixed', value: fixedBudget },
        { key: 'flexible', label: 'Flexible', value: variableBudget },
      ],
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getLoanDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const loans = filteredAccounts.filter(a => a.type === 'loan' || a.type === 'mortgage' || a.type === 'credit_card')
    const debtByLoan: Record<string, number> = {}
    loans.forEach(loan => {
      debtByLoan[loan.displayName] = Math.abs(loan.balance)
    })
    const monthlyDebt: Record<string, number> = {}
    filteredTransactions.forEach(tx => {
      if (tx.type === 'loan_payment' || (tx.type === 'expense' && tx.category === 'Housing')) {
        const key = monthKey(tx.date)
        monthlyDebt[key] = (monthlyDebt[key] ?? 0) + Math.abs(tx.amount)
      }
    })
    const debtTotal = loans.reduce((sum, loan) => sum + Math.abs(loan.balance), 0)
    const assetsTotal = filteredAccounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
    const debtToAssets = assetsTotal > 0 ? debtTotal / assetsTotal : 0
    return delay<LoanDashboardData>({
      debtBalanceOverTime: asChartPoints(monthlyDebt),
      debtBreakdown: asChartPoints(debtByLoan),
      principalVsInterest: asChartPoints(Object.fromEntries(Object.entries(monthlyDebt).map(([key, value]) => [key, value * 0.65]))).map((point) => ({
        ...point,
        secondaryValue: monthlyDebt[point.key] * 0.35,
      })),
      payoffTimeline: asChartPoints(Object.fromEntries(Object.entries(monthlyDebt).map(([key, value], index) => [key, Math.max(0, debtTotal - ((index + 1) * value))]))),
      interestCostProjection: asChartPoints(Object.fromEntries(Object.entries(monthlyDebt).map(([key, value], index) => [key, value * (index + 1) * 0.15]))),
      extraPaymentImpact: [
        { key: 'base', label: 'Base', value: debtTotal },
        { key: 'accelerated', label: 'Accelerated', value: debtTotal * 0.9 },
      ],
      debtStrategyComparison: [
        { key: 'avalanche', label: 'Avalanche', value: debtTotal * 0.88 },
        { key: 'snowball', label: 'Snowball', value: debtTotal * 0.91 },
      ],
      debtToAssetsRatio: [{ key: 'ratio', label: 'Debt / Assets', value: debtToAssets * 100 }],
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }
}

export const apiClient: IFinanceApiClient = new StubFinanceApiClient();
