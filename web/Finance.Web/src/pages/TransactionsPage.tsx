import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import type { CategorizationRule, Transaction, TransactionSplit } from '@/lib/api-client'

const TRANSACTION_TABLE_COLUMNS = ['Date', 'Description', 'Merchant', 'Account', 'Category', 'Tags', 'Type', 'Rule Match', 'Amount', 'Actions'] as const

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TransactionsPage() {
  const qc = useQueryClient()
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
  const [editTags, setEditTags] = useState('')
  const [splitTxId, setSplitTxId] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState<'amount' | 'percent'>('amount')
  const [splitRows, setSplitRows] = useState<Array<{ amount: string; category: string; tags: string }>>([
    { amount: '', category: '', tags: '' },
    { amount: '', category: '', tags: '' },
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => apiClient.updateTransaction(id, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const splitMutation = useMutation({
    mutationFn: ({ id, splits }: { id: string; splits: Omit<TransactionSplit, 'id'>[] }) => apiClient.splitTransaction(id, splits),
    onSuccess: () => {
      setSplitTxId(null)
      setSplitRows([{ amount: '', category: '', tags: '' }, { amount: '', category: '', tags: '' }])
      void qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.displayName]))
  const ownerById = Object.fromEntries(owners.map(o => [o.id, o.name]))

  const tagOptions = Array.from(new Set(transactions.flatMap(tx => tx.tags))).sort()
  const categoryOptions = Array.from(new Set(transactions.map(tx => tx.category).filter(Boolean))) as string[]
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
  }

  function submitEdit(txId: string) {
    updateMutation.mutate({
      id: txId,
      data: {
        type: editType as Transaction['type'],
        category: editCategory || undefined,
        subcategory: editSubcategory || undefined,
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
          subcategory: undefined,
          tags: row.tags.split(',').map(t => t.trim()).filter(Boolean),
          ownershipAllocation: accounts.find(a => a.id === tx.accountId)?.ownershipAllocation,
        }
      })
    if (rows.length > 0) splitMutation.mutate({ id: tx.id, splits: rows })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Transactions</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 bg-card border border-border rounded-lg p-4 sm:grid-cols-2 xl:grid-cols-4">
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
            {categoryOptions.map(value => <option key={value} value={value}>{value}</option>)}
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

      <div className="space-y-3 md:hidden">
        {filteredTransactions.map(tx => {
          const ruleState = getRuleState(tx)
          const txAccount = accounts.find(a => a.id === tx.accountId)
          return (
            <div key={tx.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date} · {accountMap[tx.accountId] ?? tx.accountId}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(tx.amount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Merchant: {tx.merchant ?? '—'} {tx.isManualOverride ? '· Manual override' : ''}</p>
              <p className="text-xs text-muted-foreground">Category: {tx.category ?? '—'}{tx.subcategory ? ` / ${tx.subcategory}` : ''}</p>
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
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
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
                    <td className="px-4 py-3 text-muted-foreground">{tx.category ?? '—'}{tx.subcategory ? ` / ${tx.subcategory}` : ''}{tx.subSubcategory ? ` / ${tx.subSubcategory}` : ''}</td>
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
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Manual override</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={editType} onChange={e => setEditType(e.target.value)}>
              {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Category" value={editCategory} onChange={e => setEditCategory(e.target.value)} />
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Subcategory" value={editSubcategory} onChange={e => setEditSubcategory(e.target.value)} />
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={editTags} onChange={e => setEditTags(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingTxId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
            <button type="button" onClick={() => submitEdit(editingTxId)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save override</button>
          </div>
        </div>
      )}

      {splitTxId && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
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
              <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="number" placeholder={splitMode === 'percent' ? 'Percent' : 'Amount'} value={row.amount} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, amount: e.target.value } : current))} />
                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Category" value={row.category} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, category: e.target.value } : current))} />
                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={row.tags} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, tags: e.target.value } : current))} />
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button type="button" onClick={() => setSplitRows(prev => [...prev, { amount: '', category: '', tags: '' }])} className="text-sm text-primary hover:underline">Add split row</button>
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
