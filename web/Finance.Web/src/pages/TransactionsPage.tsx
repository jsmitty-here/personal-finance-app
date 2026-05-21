import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '@/lib/stub-client'
import { CategoryTreeMultiSelect } from '@/components/CategoryTreeMultiSelect'
import { matchesCategoryTreeFilter } from '@/lib/category-filter'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatCategoryPath(
  categoryIconByName: Record<string, string>,
  subcategoryIconByName: Record<string, string>,
  category?: string,
  subcategory?: string,
  subSubcategory?: string,
) {
  if (!category) return '—'
  const categoryLabel = `${categoryIconByName[category] ? `${categoryIconByName[category]} ` : ''}${category}`
  const subcategoryLabel = subcategory ? `${subcategoryIconByName[subcategory] ? `${subcategoryIconByName[subcategory]} ` : ''}${subcategory}` : ''
  const subSubcategoryLabel = subSubcategory ?? ''
  return [categoryLabel, subcategoryLabel, subSubcategoryLabel].filter(Boolean).join(' / ')
}

export function TransactionsPage() {
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [subcategoryFilters, setSubcategoryFilters] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', accountFilter, dateFrom, dateTo],
    queryFn: () =>
      apiClient.getTransactions({
        accountId: accountFilter !== 'all' ? accountFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  const { data: categoryTaxonomy = [] } = useQuery({
    queryKey: ['category-taxonomy'],
    queryFn: () => apiClient.getCategoryTaxonomy(),
  })

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.displayName]))

  const tagOptions = Array.from(new Set(transactions.flatMap(tx => tx.tags))).sort()
  const categoryIconByName = Object.fromEntries(categoryTaxonomy.map(category => [category.name, category.icon]))
  const subcategoryIconByName = Object.fromEntries(
    categoryTaxonomy.flatMap(category => category.subcategories.map(subcategory => [subcategory.name, subcategory.icon])),
  )
  const typeOptions = Array.from(new Set(transactions.map(tx => tx.type)))

  const filteredTransactions = useMemo(() => transactions.filter((tx) => {
    const account = accounts.find(a => a.id === tx.accountId)
    if (ownerFilter !== 'all' && !account?.ownershipAllocation.some(o => o.ownerId === ownerFilter)) return false
    if (!matchesCategoryTreeFilter(tx.category, tx.subcategory, categoryFilters, subcategoryFilters)) return false
    if (tagFilter !== 'all' && !tx.tags.includes(tagFilter)) return false
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false
    return true
  }), [accounts, categoryFilters, ownerFilter, subcategoryFilters, tagFilter, transactions, typeFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">Transactions</h2>
        <span className="text-sm text-muted-foreground">{filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Account</label>
          <select
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground"
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.displayName}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Owner</label>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
            <option value="all">All Owners</option>
            {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <CategoryTreeMultiSelect
          label="Category"
          taxonomy={categoryTaxonomy}
          selectedCategories={categoryFilters}
          selectedSubcategories={subcategoryFilters}
          onSelectedCategoriesChange={setCategoryFilters}
          onSelectedSubcategoriesChange={setSubcategoryFilters}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Tag</label>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="all">All Tags</option>
            {tagOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <input
            type="date"
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No transactions found for current filters.</p>
        ) : (
          filteredTransactions.map(tx => (
            <Link
              key={tx.id}
              to={`/transactions/${tx.id}`}
              className="group block px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {tx.description}
                    {tx.isManualOverride ? <span className="ml-2 text-[10px] text-info">manual</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tx.date} · {accountMap[tx.accountId] ?? tx.accountId} · {tx.merchant ?? 'No merchant'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatCategoryPath(categoryIconByName, subcategoryIconByName, tx.category, tx.subcategory, tx.subSubcategory)}
                    {tx.tags.length ? ` · ${tx.tags.join(', ')}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(tx.amount)}</p>
                  <p className="text-xs text-primary group-hover:underline">View details</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
