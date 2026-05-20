import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import type { Account } from '@/lib/api-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const TYPE_LABELS: Record<Account['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  brokerage: 'Brokerage',
  retirement: 'Retirement',
  mortgage: 'Mortgage',
  loan: 'Loan',
  manual_asset: 'Manual Asset',
  manual_liability: 'Manual Liability',
}

const ACCOUNT_TABLE_COLUMNS = ['Account', 'Institution', 'Type', 'Connection Health', 'Balance', 'Actions'] as const

export function AccountsPage() {
  const qc = useQueryClient()
  const editSectionRef = useRef<HTMLDivElement>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [includeInNetWorth, setIncludeInNetWorth] = useState(true)
  const [includeInBudgeting, setIncludeInBudgeting] = useState(true)
  const [includeInTaxPlanning, setIncludeInTaxPlanning] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Account['type']>('manual_asset')
  const [newBalance, setNewBalance] = useState('0')
  const [valuationDate, setValuationDate] = useState('')
  const [ownerAllocation, setOwnerAllocation] = useState('')
  const [notes, setNotes] = useState('')

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createAccount({
        displayName: newName.trim(),
        institution: notes.trim() ? `Manual (${valuationDate || 'N/A'}) • ${notes.trim()}` : `Manual (${valuationDate || 'N/A'})`,
        type: newType,
        balance: Number(newBalance || 0),
        ownershipAllocation: ownerAllocation
          ? [{ ownerId: ownerAllocation, percentage: 100 }]
          : [{ ownerId: owners[0]?.id ?? 'o1', percentage: 100 }],
        isActive: true,
        includeInNetWorth: true,
        includeInBudgeting: true,
        includeInTaxPlanning: false,
      }),
    onSuccess: () => {
      setNewName('')
      setNewBalance('0')
      setValuationDate('')
      setOwnerAllocation('')
      setNotes('')
      setIsAddOpen(false)
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      editingId
        ? apiClient.updateAccount(editingId, {
            displayName,
            includeInNetWorth,
            includeInBudgeting,
            includeInTaxPlanning,
          })
        : Promise.reject(new Error('No account selected')),
    onSuccess: () => {
      setEditingId(null)
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const filteredAccounts = useMemo(() => accounts.filter((account) => {
    if (typeFilter !== 'all' && account.type !== typeFilter) return false
    if (ownerFilter !== 'all' && !account.ownershipAllocation.some(o => o.ownerId === ownerFilter)) return false
    return true
  }), [accounts, ownerFilter, typeFilter])

  const totalAssets = filteredAccounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = filteredAccounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)
  const netWorth = totalAssets - totalLiabilities

  function openEditor(account: Account) {
    setEditingId(account.id)
    setDisplayName(account.displayName)
    setIncludeInNetWorth(account.includeInNetWorth)
    setIncludeInBudgeting(account.includeInBudgeting)
    setIncludeInTaxPlanning(account.includeInTaxPlanning)
  }

  useEffect(() => {
    if (!editingId) return
    const frame = requestAnimationFrame(() => {
      const section = editSectionRef.current
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [editingId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Accounts</h2>
        <button type="button" onClick={() => setIsAddOpen(v => !v)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          {isAddOpen ? 'Close Manual Account' : 'Add Manual Account'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-3">
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Account Types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
          <option value="all">All Owners</option>
          {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
        </select>
        <div className="text-xs text-muted-foreground flex items-center">Showing {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}</div>
      </div>

      {isAddOpen && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-base font-semibold text-foreground mb-3">Manual account details</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={newType} onChange={e => setNewType(e.target.value as Account['type'])}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="number" placeholder="Value" value={newBalance} onChange={e => setNewBalance(e.target.value)} />
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="date" value={valuationDate} onChange={e => setValuationDate(e.target.value)} />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ownerAllocation} onChange={e => setOwnerAllocation(e.target.value)}>
              <option value="">Owner allocation</option>
              {owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Save manual account
            </button>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-success-subtle border border-success-border rounded-lg p-4">
          <p className="text-xs font-medium text-success-subtle-foreground">Total Assets</p>
          <p className="text-xl font-bold text-success-subtle-foreground">{fmt(totalAssets)}</p>
        </div>
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-4">
          <p className="text-xs font-medium text-destructive-subtle-foreground">Total Liabilities</p>
          <p className="text-xl font-bold text-destructive-subtle-foreground">{fmt(totalLiabilities)}</p>
        </div>
        <div className="bg-primary-subtle border border-primary-border rounded-lg p-4">
          <p className="text-xs font-medium text-primary-subtle-foreground">Net Worth</p>
          <p className="text-xl font-bold text-primary-subtle-foreground">{fmt(netWorth)}</p>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredAccounts.map(account => (
          <div key={account.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{account.displayName}</p>
                <p className="text-xs text-muted-foreground">{account.institution}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.isActive ? 'bg-success-subtle text-success-subtle-foreground' : 'bg-muted text-muted-foreground'}`}>
                {account.isActive ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[account.type]}</span>
              <span className={`text-sm font-semibold ${account.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>{fmt(account.balance)}</span>
            </div>
            <button type="button" onClick={() => openEditor(account)} className="text-xs text-primary hover:underline">Edit metadata</button>
          </div>
        ))}
      </div>

      {/* Accounts table */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              {ACCOUNT_TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={`px-4 py-3 font-medium text-muted-foreground ${column === 'Balance' || column === 'Actions' ? 'text-right' : 'text-left'}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={ACCOUNT_TABLE_COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : (
              filteredAccounts.map(account => (
                <tr key={account.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{account.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account.institution}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {TYPE_LABELS[account.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${account.isActive ? 'bg-success-subtle text-success-subtle-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {account.isActive ? 'Healthy' : 'Reconnect Needed'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${account.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {fmt(account.balance)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEditor(account)} className="text-xs text-primary hover:underline">Edit metadata</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div ref={editSectionRef} className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">Edit account metadata</h3>
          <input autoFocus className="w-full border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={includeInNetWorth} onChange={e => setIncludeInNetWorth(e.target.checked)} /> Net worth</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={includeInBudgeting} onChange={e => setIncludeInBudgeting(e.target.checked)} /> Budgeting</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={includeInTaxPlanning} onChange={e => setIncludeInTaxPlanning(e.target.checked)} /> Tax planning</label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
            <button type="button" onClick={() => updateMutation.mutate()} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
