import { getBudgetCategoryGroups, getBudgetTotals, normalizeBudgetHierarchy, type Budget, type BudgetItem } from '@/lib/api-client'
import { apiClient } from '@/lib/stub-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function getUsagePercent(plannedAmount: number, actualAmount: number) {
  if (plannedAmount <= 0) return actualAmount > 0 ? 100 : 0
  return Math.min((actualAmount / plannedAmount) * 100, 100)
}

interface BudgetDraft {
  name: string
  period: Budget['period']
  items: BudgetItem[]
}

function makeDraftBudgetItem(): BudgetItem {
  return {
    id: `draft-${Math.random().toString(36).slice(2)}`,
    category: '',
    subcategory: undefined,
    plannedAmount: 0,
    actualAmount: 0,
  }
}

export function BudgetsPage() {
  const qc = useQueryClient()
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<BudgetDraft | null>(null)
  const [newName, setNewName] = useState('')
  const [newPeriod, setNewPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [newOwnerId, setNewOwnerId] = useState('')

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiClient.getBudgets(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: categoryTaxonomy = [] } = useQuery({
    queryKey: ['category-taxonomy'],
    queryFn: () => apiClient.getCategoryTaxonomy(),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'budgets-page'],
    queryFn: () => apiClient.getTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.createBudget({
      name: newName.trim(),
      period: newPeriod,
      ownerId: newOwnerId || undefined,
      items: [],
    }),
    onSuccess: async (createdBudget) => {
      setNewName('')
      await qc.invalidateQueries({ queryKey: ['budgets'] })
      setEditingId(createdBudget.id)
      setEditingDraft({
        name: createdBudget.name,
        period: createdBudget.period,
        items: createdBudget.items.length > 0 ? createdBudget.items : [makeDraftBudgetItem()],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteBudget(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, budget }: { id: string; budget: Partial<Budget> }) => apiClient.updateBudget(id, budget),
    onSuccess: () => {
      setEditingId(null)
      setEditingDraft(null)
      void qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const filteredBudgets = useMemo(() => budgets.filter((budget) => {
    if (periodFilter !== 'all' && budget.period !== periodFilter) return false
    if (ownerFilter !== 'all' && budget.ownerId !== ownerFilter) return false
    return true
  }), [budgets, ownerFilter, periodFilter])

  const aggregate = useMemo(() => {
    return filteredBudgets.reduce((totals, budget) => {
      const next = getBudgetTotals(budget.items)
      return {
        planned: totals.planned + next.planned,
        actual: totals.actual + next.actual,
        variance: totals.variance + next.variance,
      }
    }, { planned: 0, actual: 0, variance: 0 })
  }, [filteredBudgets])

  function getActualAmount(category: string, period: Budget['period'], subcategory?: string) {
    if (!category.trim()) return 0
    return transactions
      .filter((transaction) => {
        if (transaction.type !== 'expense') return false
        const transactionDate = new Date(`${transaction.date}T00:00:00Z`)
        const now = new Date()
        if (period === 'monthly' && (transactionDate.getUTCFullYear() !== now.getUTCFullYear() || transactionDate.getUTCMonth() !== now.getUTCMonth())) {
          return false
        }
        if (period === 'quarterly' && (transactionDate.getUTCFullYear() !== now.getUTCFullYear() || Math.floor(transactionDate.getUTCMonth() / 3) !== Math.floor(now.getUTCMonth() / 3))) {
          return false
        }
        if (period === 'annual' && transactionDate.getUTCFullYear() !== now.getUTCFullYear()) {
          return false
        }
        if ((transaction.category ?? '') !== category) return false
        if (subcategory) return (transaction.subcategory ?? '') === subcategory
        return true
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  }

  function beginEdit(budget: Budget) {
    setEditingId(budget.id)
    setEditingDraft({
      name: budget.name,
      period: budget.period,
      items: budget.items.map(item => ({ ...item })),
    })
  }

  function closeEditor() {
    setEditingId(null)
    setEditingDraft(null)
  }

  function updateDraftItem(itemId: string, patch: Partial<BudgetItem>) {
    setEditingDraft((current) => current ? {
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) return item
        const nextItem = { ...item, ...patch }
        const category = nextItem.category.trim()
        const subcategory = nextItem.subcategory?.trim() || undefined
        return {
          ...nextItem,
          category,
          subcategory,
          actualAmount: getActualAmount(category, current.period, subcategory),
        }
      }),
    } : current)
  }

  function addDraftItem() {
    setEditingDraft((current) => current ? { ...current, items: [...current.items, makeDraftBudgetItem()] } : current)
  }

  function removeDraftItem(itemId: string) {
    setEditingDraft((current) => current ? { ...current, items: current.items.filter(item => item.id !== itemId) } : current)
  }

  function saveBudget(budget: Budget) {
    if (!editingDraft) return
    const normalizedItems = editingDraft.items
      .filter(item => item.category.trim())
      .map(item => ({
        ...item,
        category: item.category.trim(),
        subcategory: item.subcategory?.trim() || undefined,
        plannedAmount: Number(item.plannedAmount || 0),
        actualAmount: item.actualAmount,
      }))
    const hierarchicalItems = normalizeBudgetHierarchy(normalizedItems, () => `draft-${Math.random().toString(36).slice(2)}`)
      .map(item => ({
        ...item,
        actualAmount: getActualAmount(item.category.trim(), editingDraft.period, item.subcategory?.trim() || undefined),
      }))

    updateMutation.mutate({
      id: budget.id,
      budget: {
        name: editingDraft.name.trim() || budget.name,
        items: hierarchicalItems,
      },
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Budgets</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-primary-subtle p-4">
          <p className="text-xs font-medium text-primary-subtle-foreground">Planned</p>
          <p className="text-xl font-bold text-primary-subtle-foreground">{fmt(aggregate.planned)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Actual</p>
          <p className="text-xl font-bold text-foreground">{fmt(aggregate.actual)}</p>
        </div>
        <div className={`col-span-2 rounded-lg border p-4 md:col-span-1 ${aggregate.variance >= 0 ? 'bg-success-subtle border-success-border' : 'bg-destructive-subtle border-destructive-border'}`}>
          <p className="text-xs font-medium">Variance</p>
          <p className="text-xl font-bold">{fmt(aggregate.variance)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={periodFilter} onChange={e => setPeriodFilter(e.target.value as 'all' | 'monthly' | 'quarterly' | 'annual')}>
          <option value="all">All Periods</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
          <option value="all">All Owners</option>
          {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
        </select>
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Budget name" value={newName} onChange={e => setNewName(e.target.value)} />
        <div className="flex gap-2">
          <button type="button" disabled={!newName.trim()} onClick={() => createMutation.mutate()} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">Create Budget</button>
        </div>
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={newPeriod} onChange={e => setNewPeriod(e.target.value as 'monthly' | 'quarterly' | 'annual')}>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={newOwnerId} onChange={e => setNewOwnerId(e.target.value)}>
          <option value="">Household</option>
          {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
        </select>
        <div className="sm:col-span-2 flex items-center text-xs text-muted-foreground">Create an empty budget, then add category or subcategory rows below.</div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {filteredBudgets.map(budget => {
        const total = getBudgetTotals(budget.items)
        const totalPlanned = total.planned
        const totalActual = total.actual
        const budgetGroups = getBudgetCategoryGroups(budget.items)
        const draft = editingId === budget.id ? editingDraft : null

        return (
          <div key={budget.id} className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex flex-col gap-3 md:px-5 md:py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{budget.name}</h3>
                <span className="text-xs text-muted-foreground capitalize">{budget.period}{budget.ownerId ? ` · ${owners.find(o => o.id === budget.ownerId)?.name ?? budget.ownerId}` : ' · Household'}</span>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium text-foreground">
                  {fmt(totalActual)} <span className="text-muted-foreground">/ {fmt(totalPlanned)}</span>
                </p>
                <p className="text-xs text-muted-foreground">spent of planned</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button type="button" onClick={() => beginEdit(budget)} className="text-primary hover:underline">Edit</button>
                <button type="button" onClick={() => deleteMutation.mutate(budget.id)} className="text-destructive hover:underline">Delete</button>
              </div>
            </div>

            {draft ? (
              <div className="p-4 md:p-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                  <input
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
                    value={draft.name}
                    onChange={e => setEditingDraft(current => current ? { ...current, name: e.target.value } : current)}
                    placeholder="Budget name"
                  />
                  <button type="button" onClick={closeEditor} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
                  <button type="button" onClick={() => saveBudget(budget)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save Budget</button>
                </div>

                <div className="space-y-3">
                  {draft.items.map((item) => {
                    const selectedCategory = categoryTaxonomy.find(category => category.name === item.category)
                    const subcategories = selectedCategory?.subcategories ?? []
                    const over = item.actualAmount > item.plannedAmount
                    const delta = item.plannedAmount - item.actualAmount
                    const pct = item.plannedAmount > 0 ? Math.min((item.actualAmount / item.plannedAmount) * 100, 100) : 0

                    return (
                      <div key={item.id} className="rounded-md border border-border p-3 space-y-3">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_10rem_8rem_auto] lg:items-center">
                          <select
                            className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
                            value={item.category}
                            onChange={(e) => updateDraftItem(item.id, { category: e.target.value, subcategory: undefined })}
                          >
                            <option value="">Select category</option>
                            {categoryTaxonomy.map(category => (
                              <option key={category.id} value={category.name}>{category.icon} {category.name}</option>
                            ))}
                          </select>

                          <select
                            className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
                            value={item.subcategory ?? ''}
                            onChange={(e) => updateDraftItem(item.id, { subcategory: e.target.value || undefined })}
                            disabled={!item.category}
                          >
                            <option value="">No subcategory</option>
                            {subcategories.map(subcategory => (
                              <option key={subcategory.id} value={subcategory.name}>{subcategory.icon} {subcategory.name}</option>
                            ))}
                          </select>

                          <input
                            className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
                            type="number"
                            min="0"
                            step="1"
                            value={Number.isFinite(item.plannedAmount) ? item.plannedAmount : 0}
                            onChange={e => updateDraftItem(item.id, { plannedAmount: Number(e.target.value || 0) })}
                            placeholder="Planned"
                          />

                          <div className="text-sm text-right text-muted-foreground">
                            Actual {fmt(item.actualAmount)}
                          </div>

                          <button type="button" onClick={() => removeDraftItem(item.id)} className="rounded-md border border-destructive-border px-3 py-2 text-sm text-destructive">Delete</button>
                        </div>

                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${over ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pct.toFixed(0)}% used</span>
                          <span>{delta >= 0 ? 'Under by' : 'Over by'} {fmt(Math.abs(delta))}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button type="button" onClick={addDraftItem} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">
                  Add category or subcategory amount
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {budgetGroups.map(({ parent, children, other }) => {
                  const pct = getUsagePercent(parent.plannedAmount, parent.actualAmount)
                  const over = parent.actualAmount > parent.plannedAmount
                  const delta = parent.plannedAmount - parent.actualAmount
                  const nestedItems = other ? [...children, other] : children

                  return (
                    <div key={parent.id}>
                      <div className="px-4 py-3 md:px-5">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="text-sm font-medium text-foreground">{parent.category}</span>
                          <span className={`text-sm font-medium text-right ${over ? 'text-destructive' : 'text-foreground'}`}>
                            {fmt(parent.actualAmount)}
                            <span className="text-muted-foreground font-normal"> / {fmt(parent.plannedAmount)}</span>
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${over ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pct.toFixed(0)}% used</span>
                          <span>{delta >= 0 ? 'Under by' : 'Over by'} {fmt(Math.abs(delta))}</span>
                        </div>
                      </div>

                      {nestedItems.length > 0 && (
                        <div className="border-t border-dashed border-border bg-muted/20 px-4 py-3 md:px-5">
                          <div className="space-y-3">
                            {nestedItems.map((item) => {
                              const childPct = getUsagePercent(item.plannedAmount, item.actualAmount)
                              const childOver = item.actualAmount > item.plannedAmount
                              const childDelta = item.plannedAmount - item.actualAmount
                              const isDerivedOther = item.id === `${parent.id}-other`

                              return (
                                <div key={item.id} className="pl-4 border-l border-border/70">
                                  <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <span className={`text-sm ${isDerivedOther ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>{item.subcategory ?? item.category}</span>
                                    <span className={`text-sm font-medium text-right ${childOver ? 'text-destructive' : 'text-foreground'}`}>
                                      {fmt(item.actualAmount)}
                                      <span className="text-muted-foreground font-normal"> / {fmt(item.plannedAmount)}</span>
                                    </span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${childOver ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${childPct}%` }} />
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{childPct.toFixed(0)}% used</span>
                                    <span>{childDelta >= 0 ? 'Under by' : 'Over by'} {fmt(Math.abs(childDelta))}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {!isLoading && filteredBudgets.length === 0 && (
        <p className="text-muted-foreground text-sm">No budgets found.</p>
      )}
    </div>
  )
}
