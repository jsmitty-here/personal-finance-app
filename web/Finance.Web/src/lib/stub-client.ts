import type {
  IFinanceApiClient, Owner, Account, Transaction, CategorizationRule,
  Budget, NetWorthSummary, CashFlowSummary, SpendingByCategory,
  TransactionSplit, CategoryDefinition, SubcategoryDefinition,
  DashboardFiltersInput, DataQualityFlags, OverviewDashboardData,
  SpendingDashboardData, NetWorthDashboardData, BudgetDashboardData,
  LoanDashboardData, InvestmentsDashboardData, IncomeDashboardData,
  TaxesDashboardData, PlanningDashboardData, ReviewDashboardData, ChartPoint,
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

function getMonthKeyFromDate(date: string) {
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

const ESTIMATED_APR_BY_ACCOUNT_TYPE: Record<Account['type'], number> = {
  checking: 0,
  savings: 0,
  credit_card: 0.209,
  brokerage: 0,
  retirement: 0,
  mortgage: 0.064,
  loan: 0.089,
  manual_asset: 0,
  manual_liability: 0.08,
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function simulatePayoff(balance: number, monthlyPayment: number, monthlyRate: number, maxMonths = 600) {
  let remaining = Math.max(0, balance)
  let months = 0
  let totalInterest = 0
  while (remaining > 0 && months < maxMonths) {
    const interest = remaining * monthlyRate
    const payment = Math.max(monthlyPayment, 0)
    const principal = Math.max(0, payment - interest)
    if (principal <= 0) break
    remaining = Math.max(0, remaining - principal)
    totalInterest += interest
    months += 1
  }
  return { months, totalInterest: roundCurrency(totalInterest), remaining: roundCurrency(remaining) }
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
      const key = getMonthKeyFromDate(tx.date)
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
    const monthlyNetByMonth = months.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (monthlyIncomeMap[key] ?? 0) - (monthlyExpenseMap[key] ?? 0)
      return acc
    }, {})
    let runningNetWorth = netWorth - Object.values(monthlyNetByMonth).reduce((sum, value) => sum + value, 0)
    const netWorthTrend = months.map(key => {
      runningNetWorth += monthlyNetByMonth[key] ?? 0
      return {
        key,
        label: key,
        value: roundCurrency(runningNetWorth),
        drilldown: { transactionIds: monthTxIds[key] ?? [] },
      }
    })
    return delay<OverviewDashboardData>({
      netWorthSnapshot: {
        netWorth,
        assets,
        liabilities,
        trend: netWorthTrend,
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
      const categoryMonthKey = `${getMonthKeyFromDate(tx.date)} · ${category}`
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
        const key = getMonthKeyFromDate(date)
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
    const months = Array.from(new Set(filteredTransactions.map(tx => getMonthKeyFromDate(tx.date)))).sort((a, b) => a.localeCompare(b))
    const netWorthOverTime = months.map(key => {
      const monthTransactions = filteredTransactions.filter(tx => getMonthKeyFromDate(tx.date) === key)
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
        const key = getMonthKeyFromDate(tx.date)
        monthlyDebt[key] = (monthlyDebt[key] ?? 0) + Math.abs(tx.amount)
      }
    })
    const debtTotal = loans.reduce((sum, loan) => sum + Math.abs(loan.balance), 0)
    const assetsTotal = filteredAccounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
    const debtToAssets = assetsTotal > 0 ? debtTotal / assetsTotal : 0
    const weightedApr = debtTotal > 0
      ? loans.reduce((sum, loan) => sum + (Math.abs(loan.balance) * ESTIMATED_APR_BY_ACCOUNT_TYPE[loan.type]), 0) / debtTotal
      : 0
    const monthlyRate = weightedApr / 12
    const debtMonths = Object.keys(monthlyDebt).sort((a, b) => a.localeCompare(b))
    const avgMonthlyPayment = debtMonths.length > 0
      ? debtMonths.reduce((sum, key) => sum + (monthlyDebt[key] ?? 0), 0) / debtMonths.length
      : (debtTotal * 0.01)

    let runningDebtBalance = debtTotal
    let cumulativeInterest = 0
    const principalVsInterest = debtMonths.map((key) => {
      const payment = monthlyDebt[key] ?? 0
      const interest = runningDebtBalance * monthlyRate
      const principal = Math.min(runningDebtBalance, Math.max(0, payment - interest))
      runningDebtBalance = Math.max(0, runningDebtBalance - principal)
      cumulativeInterest += interest
      return {
        key,
        label: key,
        value: roundCurrency(principal),
        secondaryValue: roundCurrency(Math.max(0, interest)),
      }
    })

    let projectionBalance = debtTotal
    const payoffTimeline = debtMonths.map((key) => {
      const payment = monthlyDebt[key] ?? avgMonthlyPayment
      const interest = projectionBalance * monthlyRate
      const principal = Math.min(projectionBalance, Math.max(0, payment - interest))
      projectionBalance = Math.max(0, projectionBalance - principal)
      return { key, label: key, value: roundCurrency(projectionBalance) }
    })

    const interestCostProjection = debtMonths.map((key, index) => ({
      key,
      label: key,
      value: roundCurrency(cumulativeInterest * ((index + 1) / Math.max(debtMonths.length, 1))),
    }))

    const basePayoff = simulatePayoff(debtTotal, avgMonthlyPayment, monthlyRate)
    const acceleratedPayoff = simulatePayoff(debtTotal, avgMonthlyPayment + 250, monthlyRate)
    const avalanchePayoff = simulatePayoff(debtTotal, avgMonthlyPayment, Math.max(0, monthlyRate - 0.0015))
    const snowballPayoff = simulatePayoff(debtTotal, avgMonthlyPayment, monthlyRate + 0.001)

    return delay<LoanDashboardData>({
      debtBalanceOverTime: payoffTimeline,
      debtBreakdown: asChartPoints(debtByLoan),
      principalVsInterest,
      payoffTimeline,
      interestCostProjection,
      extraPaymentImpact: [
        { key: 'base-months', label: 'Base Months to Payoff', value: basePayoff.months },
        { key: 'accelerated-months', label: 'Accelerated Months to Payoff', value: acceleratedPayoff.months },
        { key: 'interest-saved', label: 'Interest Saved with +$250', value: Math.max(0, basePayoff.totalInterest - acceleratedPayoff.totalInterest) },
      ],
      debtStrategyComparison: [
        { key: 'avalanche-interest', label: 'Avalanche Interest Cost', value: avalanchePayoff.totalInterest },
        { key: 'snowball-interest', label: 'Snowball Interest Cost', value: snowballPayoff.totalInterest },
      ],
      debtToAssetsRatio: [{ key: 'ratio', label: 'Debt / Assets', value: debtToAssets * 100 }],
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getInvestmentsDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const investmentAccounts = filteredAccounts.filter(a => a.type === 'brokerage' || a.type === 'retirement')
    const investmentTx = filteredTransactions.filter(tx => tx.type === 'investment')
    const monthlyContributionsMap: Record<string, number> = {}
    const contributionTxIdsByMonth: Record<string, string[]> = {}
    investmentTx.forEach(tx => {
      const month = getMonthKeyFromDate(tx.date)
      monthlyContributionsMap[month] = (monthlyContributionsMap[month] ?? 0) + Math.abs(tx.amount)
      contributionTxIdsByMonth[month] = contributionTxIdsByMonth[month] ?? []
      contributionTxIdsByMonth[month].push(tx.id)
    })

    const contributionPoints = asChartPoints(monthlyContributionsMap, contributionTxIdsByMonth)
    const latestPortfolioValue = investmentAccounts.reduce((sum, account) => sum + account.balance, 0)
    const totalContributions = contributionPoints.reduce((sum, point) => sum + point.value, 0)
    const estimatedStartingValue = Math.max(0, latestPortfolioValue - totalContributions)
    const portfolioGrowthBase = estimatedStartingValue + totalContributions
    const monthlyReturnEstimate = contributionPoints.length > 0 && portfolioGrowthBase > 0
      ? clamp(Math.pow(latestPortfolioValue / portfolioGrowthBase, 1 / contributionPoints.length) - 1, -0.03, 0.03)
      : 0

    let runningPortfolio = estimatedStartingValue
    let cumulativeContribution = 0
    const portfolioValueTrend: ChartPoint[] = []
    const returnEstimateTrend: ChartPoint[] = []
    contributionPoints.forEach(point => {
      cumulativeContribution += point.value
      runningPortfolio = (runningPortfolio + point.value) * (1 + monthlyReturnEstimate)
      const portfolioPoint = {
        ...point,
        value: roundCurrency(runningPortfolio),
      }
      portfolioValueTrend.push(portfolioPoint)
      returnEstimateTrend.push({
        key: point.key,
        label: point.label,
        value: roundCurrency(portfolioPoint.value - estimatedStartingValue - cumulativeContribution),
        drilldown: point.drilldown,
      })
    })

    const assetAllocation: Record<string, number> = {}
    investmentAccounts.forEach(account => {
      if (account.type === 'retirement') {
        assetAllocation.Equities = (assetAllocation.Equities ?? 0) + (account.balance * 0.74)
        assetAllocation.Bonds = (assetAllocation.Bonds ?? 0) + (account.balance * 0.21)
        assetAllocation.Cash = (assetAllocation.Cash ?? 0) + (account.balance * 0.05)
      } else {
        assetAllocation.Equities = (assetAllocation.Equities ?? 0) + (account.balance * 0.68)
        assetAllocation.Bonds = (assetAllocation.Bonds ?? 0) + (account.balance * 0.18)
        assetAllocation.Alternatives = (assetAllocation.Alternatives ?? 0) + (account.balance * 0.07)
        assetAllocation.Cash = (assetAllocation.Cash ?? 0) + (account.balance * 0.07)
      }
    })

    const accountAllocation = investmentAccounts.map(account => ({
      key: account.id,
      label: account.displayName,
      value: account.balance,
      drilldown: { accountIds: [account.id] },
    }))

    const holdingsConcentration = investmentAccounts.flatMap(account => {
      const accountWeight = latestPortfolioValue > 0 ? account.balance / latestPortfolioValue : 0
      const topHoldingShare = clamp(0.14 + (accountWeight * 0.12), 0.14, 0.28)
      const secondHoldingShare = clamp(topHoldingShare * 0.7, 0.1, 0.2)
      const topHolding = Math.round(account.balance * topHoldingShare * 100) / 100
      const secondHolding = Math.round(account.balance * secondHoldingShare * 100) / 100
      return [
        {
          key: `${account.id}-h1`,
          label: `${account.displayName} · Top Holding`,
          value: topHolding,
          drilldown: { accountIds: [account.id] },
        },
        {
          key: `${account.id}-h2`,
          label: `${account.displayName} · Next Holding`,
          value: secondHolding,
          drilldown: { accountIds: [account.id] },
        },
      ]
    }).sort((a, b) => b.value - a.value)

    const retirementAccounts = investmentAccounts.filter(account => account.type === 'retirement')
    const retirementTxByMonth: Record<string, number> = {}
    const retirementTxIdsByMonth: Record<string, string[]> = {}
    filteredTransactions
      .filter(tx => tx.type === 'investment' && retirementAccounts.some(account => account.id === tx.accountId))
      .forEach(tx => {
        const month = getMonthKeyFromDate(tx.date)
        retirementTxByMonth[month] = (retirementTxByMonth[month] ?? 0) + Math.abs(tx.amount)
        retirementTxIdsByMonth[month] = retirementTxIdsByMonth[month] ?? []
        retirementTxIdsByMonth[month].push(tx.id)
      })
    const retirementBaseBalance = retirementAccounts.reduce((sum, account) => sum + account.balance, 0)
    const retirementContributionSeries = asChartPoints(retirementTxByMonth, retirementTxIdsByMonth)
    let retirementRunning = retirementBaseBalance - retirementContributionSeries.reduce((sum, point) => sum + point.value, 0)
    const retirementAccountTrend = retirementContributionSeries.map(point => {
      retirementRunning = (retirementRunning + point.value) * (1 + monthlyReturnEstimate)
      return {
        ...point,
        value: roundCurrency(retirementRunning),
      }
    })

    const taxableTotal = investmentAccounts.filter(a => a.type === 'brokerage').reduce((sum, account) => sum + account.balance, 0)
    const taxAdvantagedTotal = investmentAccounts.filter(a => a.type === 'retirement').reduce((sum, account) => sum + account.balance, 0)

    return delay<InvestmentsDashboardData>({
      portfolioValueTrend,
      assetAllocation: asChartPoints(assetAllocation),
      accountAllocation,
      contributionsOverTime: contributionPoints,
      investmentReturnEstimate: returnEstimateTrend,
      holdingsConcentration,
      retirementAccountTrend,
      taxableVsTaxAdvantagedSplit: [
        { key: 'taxable', label: 'Taxable', value: taxableTotal, drilldown: { accountIds: investmentAccounts.filter(a => a.type === 'brokerage').map(a => a.id) } },
        { key: 'tax-advantaged', label: 'Tax-Advantaged', value: taxAdvantagedTotal, drilldown: { accountIds: investmentAccounts.filter(a => a.type === 'retirement').map(a => a.id) } },
      ],
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getIncomeDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'income')
    const incomeByMonth: Record<string, number> = {}
    const txIdsByMonth: Record<string, string[]> = {}
    const incomeBySource: Record<string, number> = {}
    const txIdsBySource: Record<string, string[]> = {}

    incomeTransactions.forEach(tx => {
      const month = getMonthKeyFromDate(tx.date)
      incomeByMonth[month] = (incomeByMonth[month] ?? 0) + tx.amount
      txIdsByMonth[month] = txIdsByMonth[month] ?? []
      txIdsByMonth[month].push(tx.id)

      const source = tx.subcategory ?? tx.merchant ?? tx.description.split(' ')[0] ?? 'Other'
      incomeBySource[source] = (incomeBySource[source] ?? 0) + tx.amount
      txIdsBySource[source] = txIdsBySource[source] ?? []
      txIdsBySource[source].push(tx.id)
    })

    const grossIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const estimatedWithholding = grossIncome * 0.21
    const netIncome = grossIncome - estimatedWithholding

    const irregularIncomeTransactions = incomeTransactions.filter(tx =>
      tx.subcategory === 'Bonus'
      || tx.subcategory === 'Interest'
      || tx.tags.includes('Investment Income')
      || tx.description.toLowerCase().includes('bonus')
      || tx.description.toLowerCase().includes('dividend'),
    )
    const irregularIncomeBySource: Record<string, number> = {}
    irregularIncomeTransactions.forEach(tx => {
      const source = tx.subcategory ?? tx.merchant ?? 'Other'
      irregularIncomeBySource[source] = (irregularIncomeBySource[source] ?? 0) + tx.amount
    })

    const monthlyIncomeValues = Object.values(incomeByMonth)
    const meanMonthlyIncome = monthlyIncomeValues.length > 0
      ? monthlyIncomeValues.reduce((sum, value) => sum + value, 0) / monthlyIncomeValues.length
      : 0
    const monthlyVariance = monthlyIncomeValues.length > 0
      ? monthlyIncomeValues.reduce((sum, value) => sum + ((value - meanMonthlyIncome) ** 2), 0) / monthlyIncomeValues.length
      : 0
    const monthlyStdDev = Math.sqrt(monthlyVariance)
    const coefficientOfVariation = meanMonthlyIncome > 0 ? (monthlyStdDev / meanMonthlyIncome) * 100 : 0

    return delay<IncomeDashboardData>({
      incomeTrend: asChartPoints(incomeByMonth, txIdsByMonth),
      incomeBySource: asChartPoints(incomeBySource, txIdsBySource),
      grossVsNetIncome: [
        { key: 'gross', label: 'Gross', value: grossIncome },
        { key: 'net', label: 'Net', value: netIncome },
        { key: 'withholding', label: 'Estimated Withholding', value: estimatedWithholding },
      ],
      irregularIncome: asChartPoints(irregularIncomeBySource),
      incomeStability: [
        { key: 'avg-monthly-income', label: 'Average Monthly Income', value: meanMonthlyIncome },
        { key: 'income-volatility', label: 'Monthly Std Dev', value: monthlyStdDev },
        { key: 'income-stability-index', label: 'Coefficient of Variation %', value: coefficientOfVariation },
      ],
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getTaxesDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const taxRelevantAccountIds = filteredAccounts.filter(account => account.includeInTaxPlanning).map(account => account.id)
    const deductibleCategories = new Set(['Health', 'Housing', 'Utilities', 'Transport'])
    const taxRelevantTransactions = filteredTransactions.filter(tx =>
      tx.type === 'income'
      || tx.type === 'tax'
      || tx.type === 'investment'
      || taxRelevantAccountIds.includes(tx.accountId)
      || deductibleCategories.has(tx.category ?? ''),
    )

    const taxRelevantByMonth: Record<string, number> = {}
    const taxRelevantTxIds: Record<string, string[]> = {}
    taxRelevantTransactions.forEach(tx => {
      const month = getMonthKeyFromDate(tx.date)
      taxRelevantByMonth[month] = (taxRelevantByMonth[month] ?? 0) + Math.abs(tx.amount)
      taxRelevantTxIds[month] = taxRelevantTxIds[month] ?? []
      taxRelevantTxIds[month].push(tx.id)
    })

    const deductibleExpenseByCategory: Record<string, number> = {}
    filteredTransactions
      .filter(tx => tx.type === 'expense' && deductibleCategories.has(tx.category ?? ''))
      .forEach(tx => {
        const category = tx.category ?? 'Uncategorized'
        deductibleExpenseByCategory[category] = (deductibleExpenseByCategory[category] ?? 0) + Math.abs(tx.amount)
      })

    const grossIncomeByMonth: Record<string, number> = {}
    filteredTransactions
      .filter(tx => tx.type === 'income')
      .forEach(tx => {
        const month = getMonthKeyFromDate(tx.date)
        grossIncomeByMonth[month] = (grossIncomeByMonth[month] ?? 0) + tx.amount
      })
    const estimatedTaxWithholding = asChartPoints(
      Object.fromEntries(Object.entries(grossIncomeByMonth).map(([month, gross]) => [month, gross * 0.22])),
    )

    const taxableIncomeCategories: Record<string, number> = {}
    filteredTransactions
      .filter(tx => tx.type === 'income')
      .forEach(tx => {
        const source = tx.subcategory ?? tx.category ?? 'Other'
        taxableIncomeCategories[source] = (taxableIncomeCategories[source] ?? 0) + tx.amount
      })

    const taxableBalance = filteredAccounts
      .filter(account => account.type === 'checking' || account.type === 'savings' || account.type === 'brokerage')
      .reduce((sum, account) => sum + Math.max(account.balance, 0), 0)
    const taxAdvantagedBalance = filteredAccounts
      .filter(account => account.type === 'retirement')
      .reduce((sum, account) => sum + Math.max(account.balance, 0), 0)
    const deductibleTotal = Object.values(deductibleExpenseByCategory).reduce((sum, value) => sum + value, 0)

    const retirementContributionByMonth: Record<string, number> = {}
    filteredTransactions
      .filter(tx => tx.type === 'investment' && filteredAccounts.some(account => account.id === tx.accountId && account.type === 'retirement'))
      .forEach(tx => {
        const month = getMonthKeyFromDate(tx.date)
        retirementContributionByMonth[month] = (retirementContributionByMonth[month] ?? 0) + Math.abs(tx.amount)
      })

    return delay<TaxesDashboardData>({
      taxRelevantTransactions: asChartPoints(taxRelevantByMonth, taxRelevantTxIds),
      deductibleExpenseSummary: asChartPoints(deductibleExpenseByCategory),
      estimatedTaxWithholding,
      taxableIncomeCategories: asChartPoints(taxableIncomeCategories),
      taxTreatmentBreakdown: [
        { key: 'taxable', label: 'Taxable Accounts', value: taxableBalance },
        { key: 'tax-advantaged', label: 'Tax-Advantaged Accounts', value: taxAdvantagedBalance },
        { key: 'deductible-expenses', label: 'Deductible Expenses', value: deductibleTotal },
      ],
      retirementContributionTaxView: asChartPoints(retirementContributionByMonth),
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getPlanningDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)
    const monthlyIncome = filteredTransactions
      .filter(tx => tx.type === 'income')
      .reduce<Record<string, number>>((acc, tx) => {
        const month = getMonthKeyFromDate(tx.date)
        acc[month] = (acc[month] ?? 0) + tx.amount
        return acc
      }, {})
    const monthlyExpenses = filteredTransactions
      .filter(tx => tx.type === 'expense')
      .reduce<Record<string, number>>((acc, tx) => {
        const month = getMonthKeyFromDate(tx.date)
        acc[month] = (acc[month] ?? 0) + Math.abs(tx.amount)
        return acc
      }, {})
    const monthlyInvestmentContributions = filteredTransactions
      .filter(tx => tx.type === 'investment')
      .reduce<Record<string, number>>((acc, tx) => {
        const month = getMonthKeyFromDate(tx.date)
        acc[month] = (acc[month] ?? 0) + Math.abs(tx.amount)
        return acc
      }, {})

    const avgIncome = Object.values(monthlyIncome).length > 0
      ? Object.values(monthlyIncome).reduce((sum, value) => sum + value, 0) / Object.values(monthlyIncome).length
      : 0
    const avgExpenses = Object.values(monthlyExpenses).length > 0
      ? Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0) / Object.values(monthlyExpenses).length
      : 0
    const avgInvestmentContribution = Object.values(monthlyInvestmentContributions).length > 0
      ? Object.values(monthlyInvestmentContributions).reduce((sum, value) => sum + value, 0) / Object.values(monthlyInvestmentContributions).length
      : 0

    const monthlySurplus = Math.max(avgIncome - avgExpenses, 0)
    const targetEmergencyFund = avgExpenses * 6
    const liquidCash = filteredAccounts
      .filter(account => account.type === 'checking' || account.type === 'savings')
      .reduce((sum, account) => sum + Math.max(account.balance, 0), 0)
    const debtBalance = filteredAccounts
      .filter(account => account.balance < 0)
      .reduce((sum, account) => sum + Math.abs(account.balance), 0)
    const investmentBalance = filteredAccounts
      .filter(account => account.type === 'brokerage' || account.type === 'retirement')
      .reduce((sum, account) => sum + Math.max(account.balance, 0), 0)

    const scenarioComparison: PlanningDashboardData['scenarioComparison'] = [
      { key: 'conservative', label: 'Conservative', value: (investmentBalance * 1.04) + (monthlySurplus * 12) - (debtBalance * 0.92) },
      { key: 'base', label: 'Base', value: (investmentBalance * 1.07) + (monthlySurplus * 12) - (debtBalance * 0.9) },
      { key: 'aggressive', label: 'Aggressive', value: (investmentBalance * 1.11) + ((monthlySurplus + avgInvestmentContribution * 0.5) * 12) - (debtBalance * 0.86) },
    ]

    const payDownDebtVsInvest: PlanningDashboardData['payDownDebtVsInvest'] = [
      { key: 'debt-first', label: 'Debt First', value: debtBalance * 0.82 },
      { key: 'balanced', label: 'Balanced', value: debtBalance * 0.88 + investmentBalance * 1.05 },
      { key: 'invest-first', label: 'Invest First', value: debtBalance * 0.94 + investmentBalance * 1.09 },
    ]

    let emergencyBalance = liquidCash
    const emergencyFundProjection: PlanningDashboardData['emergencyFundProjection'] = []
    for (let month = 1; month <= 12; month += 1) {
      emergencyBalance += monthlySurplus * 0.6
      emergencyFundProjection.push({
        key: `m${month}`,
        label: `Month ${month}`,
        value: Math.min(emergencyBalance, targetEmergencyFund),
      })
    }

    const investmentGrowthProjection: PlanningDashboardData['investmentGrowthProjection'] = []
    let projectedInvestmentBalance = investmentBalance
    for (let month = 1; month <= 24; month += 1) {
      projectedInvestmentBalance = (projectedInvestmentBalance + avgInvestmentContribution) * (1 + (0.07 / 12))
      investmentGrowthProjection.push({
        key: `m${month}`,
        label: `Month ${month}`,
        value: Math.round(projectedInvestmentBalance * 100) / 100,
      })
    }

    const monthsToEmergencyTarget = monthlySurplus > 0 ? Math.ceil(Math.max(targetEmergencyFund - liquidCash, 0) / (monthlySurplus * 0.6)) : 0
    const monthsToDebtPayoff = monthlySurplus > 0 ? Math.ceil(debtBalance / Math.max(monthlySurplus, 1)) : 0
    const monthsToInvestmentMilestone = avgInvestmentContribution > 0 ? Math.ceil(Math.max(100000 - investmentBalance, 0) / avgInvestmentContribution) : 0
    const breakEvenPoint: PlanningDashboardData['breakEvenPoint'] = [
      { key: 'emergency-target', label: 'Emergency Fund Target (months)', value: monthsToEmergencyTarget },
      { key: 'debt-payoff', label: 'Debt Payoff (months)', value: monthsToDebtPayoff },
      { key: '100k-investments', label: 'Reach $100k Investments (months)', value: monthsToInvestmentMilestone },
    ]

    const taxImpactEstimate: PlanningDashboardData['taxImpactEstimate'] = [
      { key: 'current', label: 'Current Path', value: avgIncome * 12 * 0.22 },
      { key: 'optimize-retirement', label: 'Retirement Optimization', value: avgIncome * 12 * 0.19 },
      { key: 'aggressive-withdrawals', label: 'Aggressive Withdrawals', value: avgIncome * 12 * 0.24 },
    ]

    const riskRangeProjection = investmentGrowthProjection.map(point => ({
      ...point,
      secondaryValue: Math.round(point.value * 0.85 * 100) / 100,
      tertiaryValue: Math.round(point.value * 1.12 * 100) / 100,
    }))

    return delay<PlanningDashboardData>({
      scenarioComparison,
      payDownDebtVsInvest,
      emergencyFundProjection,
      investmentGrowthProjection,
      breakEvenPoint,
      taxImpactEstimate,
      riskRangeProjection,
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }

  getReviewDashboard(filters?: DashboardFiltersInput) {
    const { filteredTransactions, filteredAccounts } = applyDashboardFilters(filters)

    const categorized = filteredTransactions.filter(tx => !!tx.category).length
    const uncategorized = filteredTransactions.length - categorized

    const ruleMatchesByRule: Record<string, number> = {}
    const ruleConflictByMonth: Record<string, number> = {}
    const merchantsWithoutRules: Record<string, number> = {}
    const reviewBuckets: Record<string, number> = {
      uncategorized: 0,
      manual_override: 0,
      potential_duplicate: 0,
      no_tags: 0,
    }
    const manualOverridesByMonth: Record<string, number> = {}

    const duplicateSeen = new Set<string>()
    filteredTransactions.forEach(tx => {
      const month = getMonthKeyFromDate(tx.date)

      const matchingRules = rules.filter(rule => rule.isActive && rule.conditions.every(condition => {
        const conditionValue = condition.value.toLowerCase()
        if (!conditionValue) return false
        const description = tx.description.toLowerCase()
        const merchant = (tx.merchant ?? '').toLowerCase()
        const category = (tx.category ?? '').toLowerCase()
        const tags = tx.tags.map(tag => tag.toLowerCase())
        if (condition.field === 'merchant') return merchant.includes(conditionValue)
        if (condition.field === 'description') return description.includes(conditionValue)
        if (condition.field === 'category') return category.includes(conditionValue)
        if (condition.field === 'tags') return tags.some(tag => tag.includes(conditionValue))
        return false
      }))

      matchingRules.forEach(rule => {
        ruleMatchesByRule[rule.name] = (ruleMatchesByRule[rule.name] ?? 0) + 1
      })

      if (matchingRules.length > 1) {
        ruleConflictByMonth[month] = (ruleConflictByMonth[month] ?? 0) + 1
      }

      if (!tx.category) reviewBuckets.uncategorized += 1
      if (tx.isManualOverride || !!tx.splits?.length) {
        reviewBuckets.manual_override += 1
        manualOverridesByMonth[month] = (manualOverridesByMonth[month] ?? 0) + 1
      }
      if (tx.tags.length === 0) reviewBuckets.no_tags += 1

      const dupKey = `${tx.date}|${tx.amount}|${tx.description}`
      if (duplicateSeen.has(dupKey)) {
        reviewBuckets.potential_duplicate += 1
      } else {
        duplicateSeen.add(dupKey)
      }

      if (tx.merchant && matchingRules.length === 0 && tx.type === 'expense') {
        merchantsWithoutRules[tx.merchant] = (merchantsWithoutRules[tx.merchant] ?? 0) + Math.abs(tx.amount)
      }
    })

    const topMerchantsWithoutRules = asChartPoints(merchantsWithoutRules)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    return delay<ReviewDashboardData>({
      categorizationCoverage: [
        { key: 'categorized', label: 'Categorized', value: categorized },
        { key: 'uncategorized', label: 'Uncategorized', value: uncategorized },
      ],
      ruleMatchVolume: asChartPoints(ruleMatchesByRule),
      ruleConflictFrequency: asChartPoints(ruleConflictByMonth),
      manualOverrideTrend: asChartPoints(manualOverridesByMonth),
      topMerchantsWithoutRules,
      transactionsNeedingReview: asChartPoints(reviewBuckets),
      dataQuality: getDataQualityFlags(filteredTransactions, filteredAccounts),
    })
  }
}

export const apiClient: IFinanceApiClient = new StubFinanceApiClient();
