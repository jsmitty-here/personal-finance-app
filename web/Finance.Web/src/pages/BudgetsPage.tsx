import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function BudgetsPage() {
  const qc = useQueryClient()
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newName, setNewName] = useState('')
  const [newPeriod, setNewPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [newOwnerId, setNewOwnerId] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [newPlanned, setNewPlanned] = useState('0')

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => apiClient.getBudgets(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.createBudget({
      name: newName.trim(),
      period: newPeriod,
      ownerId: newOwnerId || undefined,
      items: [{ category: newCategory.trim(), plannedAmount: Number(newPlanned || 0), actualAmount: 0 }],
    }),
    onSuccess: () => {
      setNewName('')
      setNewCategory('General')
      setNewPlanned('0')
      void qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteBudget(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => apiClient.updateBudget(id, { name }),
    onSuccess: () => {
      setEditingId(null)
      void qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  const filteredBudgets = useMemo(() => budgets.filter((budget) => {
    if (periodFilter !== 'all' && budget.period !== periodFilter) return false
    if (ownerFilter !== 'all' && budget.ownerId !== ownerFilter) return false
    return true
  }), [budgets, ownerFilter, periodFilter])

  const aggregate = useMemo(() => {
    const items = filteredBudgets.flatMap(b => b.items)
    const planned = items.reduce((sum, item) => sum + item.plannedAmount, 0)
    const actual = items.reduce((sum, item) => sum + item.actualAmount, 0)
    return { planned, actual, variance: planned - actual }
  }, [filteredBudgets])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Budgets</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-primary-subtle p-4">
          <p className="text-xs font-medium text-primary-subtle-foreground">Planned</p>
          <p className="text-xl font-bold text-primary-subtle-foreground">{fmt(aggregate.planned)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Actual</p>
          <p className="text-xl font-bold text-foreground">{fmt(aggregate.actual)}</p>
        </div>
        <div className={`rounded-lg border p-4 ${aggregate.variance >= 0 ? 'bg-success-subtle border-success-border' : 'bg-destructive-subtle border-destructive-border'}`}>
          <p className="text-xs font-medium">Variance</p>
          <p className="text-xl font-bold">{fmt(aggregate.variance)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 gap-3 md:grid-cols-4">
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
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Category seed item" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="number" placeholder="Planned amount" value={newPlanned} onChange={e => setNewPlanned(e.target.value)} />
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {filteredBudgets.map(budget => {
        const totalPlanned = budget.items.reduce((s, i) => s + i.plannedAmount, 0)
        const totalActual = budget.items.reduce((s, i) => s + i.actualAmount, 0)
        return (
          <div key={budget.id} className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                <button type="button" onClick={() => {
                  setEditingId(budget.id)
                  setEditingName(budget.name)
                }} className="text-primary hover:underline">Edit</button>
                <button type="button" onClick={() => deleteMutation.mutate(budget.id)} className="text-destructive hover:underline">Delete</button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {budget.items.map(item => {
                const pct = item.plannedAmount > 0 ? Math.min((item.actualAmount / item.plannedAmount) * 100, 100) : 0
                const over = item.actualAmount > item.plannedAmount
                const delta = item.plannedAmount - item.actualAmount
                return (
                  <div key={item.category} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-sm font-medium text-foreground">{item.category}</span>
                      <span className={`text-sm font-medium text-right ${over ? 'text-destructive' : 'text-foreground'}`}>
                        {fmt(item.actualAmount)}
                        <span className="text-muted-foreground font-normal"> / {fmt(item.plannedAmount)}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct.toFixed(0)}% used</span>
                      <span>{delta >= 0 ? 'Under by' : 'Over by'} {fmt(Math.abs(delta))}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {editingId === budget.id && (
              <div className="border-t border-border p-4 flex flex-col gap-2 sm:flex-row">
                <input
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                />
                <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Close</button>
                <button type="button" onClick={() => updateMutation.mutate({ id: budget.id, name: editingName.trim() || budget.name })} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save Name</button>
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
