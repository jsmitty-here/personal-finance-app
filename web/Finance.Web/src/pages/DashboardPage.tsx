import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { apiClient } from '@/lib/stub-client'
import { useTheme } from '@/context/useTheme'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet, Landmark, CircleDollarSign } from 'lucide-react'

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardPage() {
  const [ownerId, setOwnerId] = useState<string>('all')
  const [accountId, setAccountId] = useState<string>('all')
  const [accountType, setAccountType] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [tag, setTag] = useState<string>('all')
  const [txType, setTxType] = useState<string>('all')
  const [budgetGroup, setBudgetGroup] = useState<string>('all')
  const [taxRelevance, setTaxRelevance] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [ownershipView, setOwnershipView] = useState<string>('all')
  const { resolvedTheme } = useTheme()

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: netWorth } = useQuery({
    queryKey: ['netWorth', ownerId],
    queryFn: () => apiClient.getNetWorth(ownerId === 'all' ? undefined : ownerId),
  })

  const { data: cashFlow } = useQuery({
    queryKey: ['cashFlow', ownerId],
    queryFn: () => apiClient.getCashFlow('current-month', ownerId === 'all' ? undefined : ownerId),
  })

  const { data: spending = [] } = useQuery({
    queryKey: ['spending', ownerId],
    queryFn: () => apiClient.getSpendingByCategory('current-month', ownerId === 'all' ? undefined : ownerId),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiClient.getBudgets(),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: () => apiClient.getTransactions(),
  })

  const isDark = resolvedTheme === 'dark'

  function getCssVar(name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  const tooltipStyle = isDark
    ? { backgroundColor: getCssVar('--card'), borderColor: getCssVar('--border'), color: getCssVar('--foreground') }
    : undefined
  const legendStyle = isDark ? { color: getCssVar('--foreground') } : undefined

  const filteredTransactions = useMemo(() => {
    const accountOwnerMap = Object.fromEntries(accounts.map(a => [a.id, a.ownershipAllocation]))
    return transactions.filter((tx) => {
      if (accountId !== 'all' && tx.accountId !== accountId) return false
      if (txType !== 'all' && tx.type !== txType) return false
      if (category !== 'all' && tx.category !== category) return false
      if (tag !== 'all' && !tx.tags.includes(tag)) return false
      if (dateFrom && tx.date < dateFrom) return false
      if (dateTo && tx.date > dateTo) return false
      if (ownerId !== 'all') {
        const ownersForAccount = accountOwnerMap[tx.accountId] ?? []
        if (!ownersForAccount.some(oa => oa.ownerId === ownerId)) return false
      }
      return true
    })
  }, [accountId, accounts, category, dateFrom, dateTo, ownerId, tag, transactions, txType])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (accountType !== 'all' && account.type !== accountType) return false
      if (taxRelevance === 'tax' && !account.includeInTaxPlanning) return false
      if (taxRelevance === 'non-tax' && account.includeInTaxPlanning) return false
      if (ownerId !== 'all' && !account.ownershipAllocation.some(o => o.ownerId === ownerId)) return false
      return true
    })
  }, [accountType, accounts, ownerId, taxRelevance])

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  const debtBalance = Math.abs(filteredAccounts.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0))
  const investmentBalance = filteredAccounts
    .filter(a => ['brokerage', 'retirement'].includes(a.type))
    .reduce((sum, a) => sum + a.balance, 0)
  const taxRelevantBalance = filteredAccounts.filter(a => a.includeInTaxPlanning).reduce((sum, a) => sum + a.balance, 0)

  const spendingByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransactions.filter(t => t.type === 'expense').forEach((tx) => {
      const month = tx.date.slice(0, 7)
      map[month] = (map[month] ?? 0) + Math.abs(tx.amount)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value }))
  }, [filteredTransactions])

  const incomeTrend = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTransactions.filter(t => t.type === 'income').forEach((tx) => {
      const month = tx.date.slice(0, 7)
      map[month] = (map[month] ?? 0) + t.amount
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value }))
  }, [filteredTransactions])

  const budgetVariance = useMemo(() => {
    const budgetItems = budgets.flatMap(b => b.items)
    const planned = budgetItems.reduce((sum, item) => sum + item.plannedAmount, 0)
    const actual = budgetItems.reduce((sum, item) => sum + item.actualAmount, 0)
    return { planned, actual, variance: planned - actual }
  }, [budgets])

  const categoryOptions = Array.from(new Set(transactions.map(t => t.category).filter(Boolean))) as string[]
  const tagOptions = Array.from(new Set(transactions.flatMap(t => t.tags))).sort()
  const ownershipViews = [
    { value: 'all', label: 'Household Total' },
    { value: 'owner1', label: 'Owner 1' },
    { value: 'owner2', label: 'Owner 2' },
    { value: 'joint', label: 'Joint' },
    { value: 'adjusted', label: 'Ownership Adjusted' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
            <option value="all">All Owners</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={ownershipView} onChange={e => setOwnershipView(e.target.value)}>
            {ownershipViews.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="all">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.displayName}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={accountType} onChange={e => setAccountType(e.target.value)}>
            <option value="all">All Account Types</option>
            {Array.from(new Set(accounts.map(a => a.type))).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categoryOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={tag} onChange={e => setTag(e.target.value)}>
            <option value="all">All Tags</option>
            {tagOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={txType} onChange={e => setTxType(e.target.value)}>
            <option value="all">All Tx Types</option>
            {Array.from(new Set(transactions.map(t => t.type))).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={budgetGroup} onChange={e => setBudgetGroup(e.target.value)}>
            <option value="all">All Budget Groups</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={taxRelevance} onChange={e => setTaxRelevance(e.target.value)}>
            <option value="all">All Tax Relevance</option>
            <option value="tax">Tax Relevant</option>
            <option value="non-tax">Not Tax Relevant</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-subtle rounded-md">
              <DollarSign size={18} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Net Worth</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{netWorth ? fmt(netWorth.netWorth) : '—'}</p>
          {netWorth && (
            <p className="text-xs text-muted-foreground mt-1">
              Assets {fmt(netWorth.totalAssets)} · Liabilities {fmt(netWorth.totalLiabilities)}
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success-subtle rounded-md">
              <TrendingUp size={18} className="text-success" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Income (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{cashFlow ? fmt(cashFlow.income) : '—'}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive-subtle rounded-md">
              <TrendingDown size={18} className="text-destructive" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Expenses (MTD)</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{cashFlow ? fmt(cashFlow.expenses) : '—'}</p>
          {cashFlow && (
            <p className={`text-xs mt-1 ${cashFlow.net >= 0 ? 'text-success' : 'text-destructive'}`}>
              Net: {fmt(cashFlow.net)}
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-info-subtle rounded-md">
              <PiggyBank size={18} className="text-info" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Savings Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{savingsRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Based on filtered income/expenses</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary-subtle rounded-md">
              <Wallet size={18} className="text-secondary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Budget Variance</span>
          </div>
          <p className={`text-2xl font-bold ${budgetVariance.variance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {fmt(budgetVariance.variance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{fmt(budgetVariance.actual)} / {fmt(budgetVariance.planned)}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive-subtle rounded-md">
              <Landmark size={18} className="text-destructive" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Debt Payoff</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(debtBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total current liabilities</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-subtle rounded-md">
              <CircleDollarSign size={18} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Investments</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(investmentBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Brokerage + retirement balance</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-info-subtle rounded-md">
              <DollarSign size={18} className="text-info" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Tax Summary</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{fmt(taxRelevantBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Tax-relevant account value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Spending by Category</h3>
          {spending.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={spending}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(props: PieLabelRenderProps) => {
                    const cat = String(props.name ?? '')
                    const pct = typeof props.percent === 'number' ? (props.percent * 100).toFixed(1) : '0.0'
                    return `${cat} ${pct}%`
                  }}
                >
                  {spending.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No spending data available.</p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Income Trends</h3>
          {incomeTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={incomeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
                <XAxis dataKey="month" stroke={getCssVar('--muted-foreground')} />
                <YAxis stroke={getCssVar('--muted-foreground')} />
                <Tooltip formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={getCssVar('--primary')} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No income trend data available.</p>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-5 xl:col-span-2">
          <h3 className="text-base font-semibold text-foreground mb-4">Spending MoM / YoY (available periods)</h3>
          {spendingByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={spendingByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
                <XAxis dataKey="month" stroke={getCssVar('--muted-foreground')} />
                <YAxis stroke={getCssVar('--muted-foreground')} />
                <Tooltip formatter={(value) => typeof value === 'number' ? fmt(value) : String(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={getCssVar('--primary')} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No monthly spending trend data available.</p>
          )}
        </div>
      </div>

      {budgetGroup !== 'all' && <p className="text-xs text-muted-foreground">Budget group filter active: {budgetGroup}</p>}
      <p className="text-xs text-muted-foreground">Ownership view: {ownershipViews.find(v => v.value === ownershipView)?.label ?? 'Household Total'}</p>
    </div>
  )
}
