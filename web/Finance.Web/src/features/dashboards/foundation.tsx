/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet } from 'react-router-dom'
import { apiClient } from '@/lib/stub-client'
import type { Account, DashboardFiltersInput, Owner, TransactionType } from '@/lib/api-client'
import { CategoryTreeMultiSelect } from '@/components/CategoryTreeMultiSelect'
import { validateDashboardFilters } from '@/features/dashboards/validation'

export type DashboardPeriod = NonNullable<DashboardFiltersInput['period']>
export type OwnershipView = NonNullable<DashboardFiltersInput['ownershipView']>

type DashboardFilterState = Required<Pick<DashboardFiltersInput, 'period' | 'ownerId' | 'accountId' | 'tag' | 'ownershipView'>> & {
  dateFrom: string
  dateTo: string
  accountType: Account['type'] | 'all'
  categories: string[]
  subcategories: string[]
  transactionType: TransactionType | 'all'
}

interface DashboardFoundationValue {
  filters: DashboardFilterState
  setFilters: (updates: Partial<DashboardFilterState>) => void
  owners: Owner[]
  accounts: Account[]
  tags: string[]
  toApiFilters: DashboardFiltersInput
}

const DashboardFoundationContext = createContext<DashboardFoundationValue | null>(null)

const initialFilters: DashboardFilterState = {
  period: 'current-month',
  ownerId: 'all',
  accountId: 'all',
  accountType: 'all',
  categories: [],
  subcategories: [],
  tag: 'all',
  transactionType: 'all',
  ownershipView: 'household',
  dateFrom: '',
  dateTo: '',
}

export function DashboardFoundationProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<DashboardFilterState>(initialFilters)
  const setFilters = (updates: Partial<DashboardFilterState>) => {
    setFiltersState(prev => ({ ...prev, ...updates }))
  }
  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })
  const { data: transactions = [] } = useQuery({
    queryKey: ['dashboard-foundation-transactions'],
    queryFn: () => apiClient.getTransactions(),
  })
  const tags = useMemo(() => Array.from(new Set(transactions.flatMap(tx => tx.tags))).sort(), [transactions])

  const toApiFilters = useMemo<DashboardFiltersInput>(() => ({
    period: filters.period,
    dateFrom: filters.period === 'custom' ? filters.dateFrom : undefined,
    dateTo: filters.period === 'custom' ? filters.dateTo : undefined,
    ownerId: filters.ownerId === 'all' ? undefined : filters.ownerId,
    accountId: filters.accountId === 'all' ? undefined : filters.accountId,
    accountType: filters.accountType === 'all' ? undefined : filters.accountType,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    subcategories: filters.subcategories.length > 0 ? filters.subcategories : undefined,
    tag: filters.tag === 'all' ? undefined : filters.tag,
    transactionType: filters.transactionType === 'all' ? undefined : filters.transactionType,
    ownershipView: filters.ownershipView,
  }), [filters])

  useEffect(() => {
    validateDashboardFilters(toApiFilters)
  }, [toApiFilters])

  return (
    <DashboardFoundationContext.Provider value={{ filters, setFilters, owners, accounts, tags, toApiFilters }}>
      {children}
    </DashboardFoundationContext.Provider>
  )
}

export function useDashboardFoundation() {
  const ctx = useContext(DashboardFoundationContext)
  if (!ctx) throw new Error('useDashboardFoundation must be used within DashboardFoundationProvider')
  return ctx
}

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'current-month', label: 'Current Month' },
  { value: 'trailing-3-months', label: 'Trailing 3 Months' },
  { value: 'trailing-12-months', label: 'Trailing 12 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
]

const ownershipOptions: Array<{ value: OwnershipView; label: string }> = [
  { value: 'household', label: 'Household Total' },
  { value: 'owner1', label: 'Owner 1' },
  { value: 'owner2', label: 'Owner 2' },
  { value: 'joint', label: 'Joint' },
  { value: 'adjusted', label: 'Ownership Adjusted' },
]

export function DashboardRouteLayout() {
  const { filters, setFilters, owners, accounts, tags } = useDashboardFoundation()
  const { data: categoryTaxonomy = [] } = useQuery({
    queryKey: ['category-taxonomy'],
    queryFn: () => apiClient.getCategoryTaxonomy(),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.period} onChange={e => setFilters({ period: e.target.value as DashboardPeriod })}>
            {periodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.ownerId} onChange={e => setFilters({ ownerId: e.target.value })}>
            <option value="all">All Owners</option>
            {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.ownershipView} onChange={e => setFilters({ ownershipView: e.target.value as OwnershipView })}>
            {ownershipOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.accountId} onChange={e => setFilters({ accountId: e.target.value })}>
            <option value="all">All Accounts</option>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.displayName}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.accountType} onChange={e => setFilters({ accountType: e.target.value as DashboardFilterState['accountType'] })}>
            <option value="all">All Account Types</option>
            {Array.from(new Set(accounts.map(account => account.type))).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.transactionType} onChange={e => setFilters({ transactionType: e.target.value as DashboardFilterState['transactionType'] })}>
            <option value="all">All Tx Types</option>
            <option value="income">income</option>
            <option value="expense">expense</option>
            <option value="transfer">transfer</option>
            <option value="investment">investment</option>
            <option value="loan_payment">loan_payment</option>
            <option value="fee">fee</option>
            <option value="tax">tax</option>
            <option value="refund">refund</option>
            <option value="reimbursement">reimbursement</option>
            <option value="adjustment">adjustment</option>
          </select>
          <CategoryTreeMultiSelect
            label="Category"
            taxonomy={categoryTaxonomy}
            selectedCategories={filters.categories}
            selectedSubcategories={filters.subcategories}
            onSelectedCategoriesChange={categories => setFilters({ categories })}
            onSelectedSubcategoriesChange={subcategories => setFilters({ subcategories })}
          />
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.tag} onChange={e => setFilters({ tag: e.target.value })}>
            <option value="all">All Tags</option>
            {tags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          {filters.period === 'custom' && (
            <>
              <input type="date" className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.dateFrom} onChange={e => setFilters({ dateFrom: e.target.value })} />
              <input type="date" className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={filters.dateTo} onChange={e => setFilters({ dateTo: e.target.value })} />
            </>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
