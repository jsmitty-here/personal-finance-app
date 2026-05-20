import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import type { CategorizationRule, Transaction, TransactionSplit } from '@/lib/api-client'

const TRANSACTION_TABLE_COLUMNS = ['Date', 'Description', 'Merchant', 'Account', 'Category', 'Tags', 'Type', 'Rule Match', 'Amount', 'Actions'] as const

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TransactionsPage() {
  const qc = useQueryClient()
  const overrideSectionRef = useRef<HTMLDivElement>(null)
  const splitSectionRef = useRef<HTMLDivElement>(null)
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [editType, setEditType] = useState<string>('expense')
  const [editCategory, setEditCategory] = useState('')
  const [editSubcategory, setEditSubcategory] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️')
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState('📂')
  const [editTags, setEditTags] = useState('')
  const [splitTxId, setSplitTxId] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState<'amount' | 'percent'>('amount')
  const [splitRows, setSplitRows] = useState<Array<{ amount: string; category: string; subcategory: string; tags: string }>>([
    { amount: '', category: '', subcategory: '', tags: '' },
    { amount: '', category: '', subcategory: '', tags: '' },
  ])

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => apiClient.updateTransaction(id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const splitMutation = useMutation({
    mutationFn: ({ id, splits }: { id: string; splits: Omit<TransactionSplit, 'id'>[] }) => apiClient.splitTransaction(id, splits),
    onSuccess: () => {
      setSplitTxId(null)
      setSplitRows([{ amount: '', category: '', subcategory: '', tags: '' }, { amount: '', category: '', subcategory: '', tags: '' }])
      void qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) => apiClient.createCategory({ name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const createSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, name, icon }: { categoryId: string; name: string; icon: string }) => apiClient.createSubcategory(categoryId, { name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.displayName]))
  const ownerById = Object.fromEntries(owners.map(o => [o.id, o.name]))

  const tagOptions = Array.from(new Set(transactions.flatMap(tx => tx.tags))).sort()
  const categoryOptions = Array.from(new Set(transactions.map(tx => tx.category).filter(Boolean))) as string[]
  const categoryIconByName = Object.fromEntries(categoryTaxonomy.map(category => [category.name, category.icon]))
  const subcategoryIconByName = Object.fromEntries(
    categoryTaxonomy.flatMap(category => category.subcategories.map(subcategory => [subcategory.name, subcategory.icon])),
  )
  const taxonomyCategoryOptions = categoryTaxonomy.map(category => ({
    ...category,
    display: `${category.icon} ${category.name}`,
  }))
  const selectedTaxonomyCategory = categoryTaxonomy.find(category => category.name === editCategory)
  const subcategoryOptions = selectedTaxonomyCategory?.subcategories ?? []
  const typeOptions = Array.from(new Set(transactions.map(tx => tx.type)))

  const filteredTransactions = useMemo(() => transactions.filter((tx) => {
    const account = accounts.find(a => a.id === tx.accountId)
    if (ownerFilter !== 'all' && !account?.ownershipAllocation.some(o => o.ownerId === ownerFilter)) return false
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false
    if (tagFilter !== 'all' && !tx.tags.includes(tagFilter)) return false
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false
    return true
  }), [accounts, categoryFilter, ownerFilter, tagFilter, transactions, typeFilter])

  function doesRuleMatch(rule: CategorizationRule, tx: Transaction) {
    return rule.conditions.every((condition) => {
      const value = condition.value.toLowerCase()
      if (condition.field === 'merchant') {
        const target = `${tx.merchant ?? ''} ${tx.description}`.toLowerCase()
        return target.includes(value)
      }
      if (condition.field === 'description') return tx.description.toLowerCase().includes(value)
      if (condition.field === 'type') return tx.type.toLowerCase() === value
      if (condition.field === 'category') return (tx.category ?? '').toLowerCase() === value
      if (condition.field === 'tags') return tx.tags.some(tag => tag.toLowerCase().includes(value))
      if (condition.field === 'account') return tx.accountId.toLowerCase() === value
      if (condition.field === 'amount') return String(Math.abs(tx.amount)).includes(value)
      return false
    })
  }

  function getRuleState(tx: Transaction) {
    const matched = [...rules].sort((a, b) => a.priority - b.priority).filter(rule => doesRuleMatch(rule, tx))
    return {
      matched,
      winner: matched.find(rule => rule.isActive),
    }
  }

  function startEdit(tx: Transaction) {
    setEditingTxId(tx.id)
    setEditType(tx.type)
    setEditCategory(tx.category ?? '')
    setEditSubcategory(tx.subcategory ?? '')
    setEditTags(tx.tags.join(', '))
    setIsCreatingCategory(false)
    setNewCategoryName('')
    setNewCategoryIcon('🏷️')
    setIsCreatingSubcategory(false)
    setNewSubcategoryName('')
    setNewSubcategoryIcon('📂')
  }

  async function submitEdit(txId: string) {
    let categoryToSave = editCategory
    let subcategoryToSave = editSubcategory
    let categoryIdForSubcategory = categoryTaxonomy.find(category => category.name === categoryToSave)?.id

    if (isCreatingCategory && newCategoryName.trim()) {
      const createdCategory = await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim() || '🏷️',
      })
      categoryToSave = createdCategory.name
      categoryIdForSubcategory = createdCategory.id
    }

    if (isCreatingSubcategory && newSubcategoryName.trim() && categoryIdForSubcategory) {
      const createdSubcategory = await createSubcategoryMutation.mutateAsync({
        categoryId: categoryIdForSubcategory,
        name: newSubcategoryName.trim(),
        icon: newSubcategoryIcon.trim() || '📂',
      })
      subcategoryToSave = createdSubcategory.name
    }

    updateMutation.mutate({
      id: txId,
      data: {
        type: editType as Transaction['type'],
        category: categoryToSave || undefined,
        subcategory: subcategoryToSave || undefined,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        isManualOverride: true,
      },
    })
    setEditingTxId(null)
  }

  function submitSplit(tx: Transaction) {
    const baseAmount = Math.abs(tx.amount)
    const rows = splitRows
      .filter(row => Number(row.amount) > 0 && row.category.trim())
      .map((row) => {
        const value = Number(row.amount)
        const splitAmount = splitMode === 'percent' ? (baseAmount * value) / 100 : value
        return {
          amount: splitAmount,
          category: row.category.trim(),
          subcategory: row.subcategory.trim() || undefined,
          tags: row.tags.split(',').map(t => t.trim()).filter(Boolean),
          ownershipAllocation: accounts.find(a => a.id === tx.accountId)?.ownershipAllocation,
        }
      })
    if (rows.length > 0) splitMutation.mutate({ id: tx.id, splits: rows })
  }

  useEffect(() => {
    if (!editingTxId) return
    const frame = requestAnimationFrame(() => {
      const section = overrideSectionRef.current
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [editingTxId])

  useEffect(() => {
    if (!splitTxId) return
    const frame = requestAnimationFrame(() => {
      const section = splitSectionRef.current
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [splitTxId])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Transactions</h2>

      {/* Filters */}
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
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Category</label>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categoryOptions.map(value => <option key={value} value={value}>{categoryIconByName[value] ? `${categoryIconByName[value]} ` : ''}{value}</option>)}
          </select>
        </div>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {filteredTransactions.map(tx => {
          const ruleState = getRuleState(tx)
          const txAccount = accounts.find(a => a.id === tx.accountId)
          return (
            <div key={tx.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} · {accountMap[tx.accountId] ?? tx.accountId}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(tx.amount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Merchant: {tx.merchant ?? '—'} {tx.isManualOverride ? '· Manual override' : ''}</p>
              <p className="text-xs text-muted-foreground">Category: {tx.category ? `${categoryIconByName[tx.category] ? `${categoryIconByName[tx.category]} ` : ''}${tx.category}` : '—'}{tx.subcategory ? ` / ${subcategoryIconByName[tx.subcategory] ? `${subcategoryIconByName[tx.subcategory]} ` : ''}${tx.subcategory}` : ''}</p>
              <p className="text-xs text-muted-foreground">Tags: {tx.tags.length ? tx.tags.join(', ') : 'None'}</p>
              <p className="text-xs text-muted-foreground">Ownership: {(tx.ownershipOverride ?? txAccount?.ownershipAllocation ?? []).map(o => `${ownerById[o.ownerId] ?? o.ownerId} ${o.percentage}%`).join(', ') || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">Rule: {ruleState.winner ? `${ruleState.winner.name} (won)` : 'No winner'} · {ruleState.matched.length} matched</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => startEdit(tx)} className="text-xs text-primary hover:underline">Edit override</button>
                <button type="button" onClick={() => setSplitTxId(tx.id)} className="text-xs text-primary hover:underline">Split transaction</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="hidden lg:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              {TRANSACTION_TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={`px-4 py-3 font-medium text-muted-foreground ${column === 'Amount' || column === 'Actions' ? 'text-right' : 'text-left'}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={TRANSACTION_TABLE_COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={TRANSACTION_TABLE_COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">No transactions found.</td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const ruleState = getRuleState(tx)
                return (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors align-top">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">{tx.description}{tx.isManualOverride ? <span className="ml-2 text-[10px] text-info">manual</span> : null}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.merchant ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{accountMap[tx.accountId] ?? tx.accountId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.category ? `${categoryIconByName[tx.category] ? `${categoryIconByName[tx.category]} ` : ''}${tx.category}` : '—'}{tx.subcategory ? ` / ${subcategoryIconByName[tx.subcategory] ? `${subcategoryIconByName[tx.subcategory]} ` : ''}${tx.subcategory}` : ''}{tx.subSubcategory ? ` / ${tx.subSubcategory}` : ''}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.tags.length ? tx.tags.join(', ') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tx.type === 'income' ? 'bg-success-subtle text-success-subtle-foreground' :
                        tx.type === 'expense' ? 'bg-destructive-subtle text-destructive-subtle-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ruleState.winner ? (
                        <div>
                          <p className="text-foreground">{ruleState.winner.name}</p>
                          <p>{ruleState.matched.length} matched, priority {ruleState.winner.priority} won</p>
                        </div>
                      ) : 'No match'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <button type="button" onClick={() => startEdit(tx)} className="text-primary hover:underline mr-2">Override</button>
                      <button type="button" onClick={() => setSplitTxId(tx.id)} className="text-primary hover:underline">Split</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editingTxId && (
        <div ref={overrideSectionRef} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Manual override</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={editType} onChange={e => setEditType(e.target.value)}>
              {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <select
              className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
              value={isCreatingCategory ? '__new__' : editCategory}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setIsCreatingCategory(true)
                  setEditCategory('')
                  setEditSubcategory('')
                } else {
                  setIsCreatingCategory(false)
                  setEditCategory(e.target.value)
                  setEditSubcategory('')
                }
              }}
            >
              <option value="">Select category</option>
              {taxonomyCategoryOptions.map(category => (
                <option key={category.id} value={category.name}>{category.display}</option>
              ))}
              <option value="__new__">➕ Create new category</option>
            </select>
            <select
              className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
              value={isCreatingSubcategory ? '__new__' : editSubcategory}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setIsCreatingSubcategory(true)
                  setEditSubcategory('')
                } else {
                  setIsCreatingSubcategory(false)
                  setEditSubcategory(e.target.value)
                }
              }}
              disabled={!editCategory || isCreatingCategory}
            >
              <option value="">{editCategory ? 'Select subcategory' : 'Select category first'}</option>
              {subcategoryOptions.map(subcategory => (
                <option key={subcategory.id} value={subcategory.name}>{subcategory.icon} {subcategory.name}</option>
              ))}
              {editCategory ? <option value="__new__">➕ Create new subcategory</option> : null}
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={editTags} onChange={e => setEditTags(e.target.value)} />
          </div>
          {isCreatingCategory && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Category icon (emoji)" value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} />
            </div>
          )}
          {isCreatingSubcategory && !isCreatingCategory && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="New subcategory name" value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} />
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Subcategory icon (emoji)" value={newSubcategoryIcon} onChange={e => setNewSubcategoryIcon(e.target.value)} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingTxId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
            <button type="button" onClick={() => submitEdit(editingTxId)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save override</button>
          </div>
        </div>
      )}

      {splitTxId && (
        <div ref={splitSectionRef} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Split transaction</h3>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Mode</label>
            <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={splitMode} onChange={e => setSplitMode(e.target.value as 'amount' | 'percent')}>
              <option value="amount">Fixed Amount</option>
              <option value="percent">Percentage</option>
            </select>
          </div>
          <div className="space-y-2">
            {splitRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="number" placeholder={splitMode === 'percent' ? 'Percent' : 'Amount'} value={row.amount} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, amount: e.target.value } : current))} />
                <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={row.category} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, category: e.target.value, subcategory: '' } : current))}>
                  <option value="">Select category</option>
                  {taxonomyCategoryOptions.map(category => <option key={category.id} value={category.name}>{category.display}</option>)}
                </select>
                <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={row.subcategory} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, subcategory: e.target.value } : current))} disabled={!row.category}>
                  <option value="">{row.category ? 'Select subcategory' : 'Select category first'}</option>
                  {(categoryTaxonomy.find(category => category.name === row.category)?.subcategories ?? []).map(subcategory => (
                    <option key={subcategory.id} value={subcategory.name}>{subcategory.icon} {subcategory.name}</option>
                  ))}
                </select>
                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={row.tags} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, tags: e.target.value } : current))} />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setSplitRows(prev => [...prev, { amount: '', category: '', subcategory: '', tags: '' }])} className="text-sm text-primary hover:underline">Add split row</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSplitTxId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
              <button type="button" onClick={() => {
                const tx = transactions.find(t => t.id === splitTxId)
                if (tx) submitSplit(tx)
              }} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save split</button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && filteredTransactions.length === 0 && (
        <p className="text-sm text-muted-foreground">No transactions found for current filters.</p>
      )}
    </div>
  )
}
