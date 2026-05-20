import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { Pencil, Check, X } from 'lucide-react'

export function SettingsPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editColor, setEditColor] = useState<string>('#6366f1')
  const [ownershipHistoryMode, setOwnershipHistoryMode] = useState<'point-in-time' | 'historical-retrofit'>('point-in-time')

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color?: string }) => apiClient.updateOwner(id, { name, color }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owners'] })
      setEditingId(null)
    },
  })

  function startEdit(id: string, name: string) {
    setEditingId(id)
    setEditName(name)
    const owner = owners.find(o => o.id === id)
    setEditColor(owner?.color ?? '#6366f1')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function saveEdit(id: string) {
    if (editName.trim()) {
      updateMutation.mutate({ id, name: editName.trim(), color: editColor })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Settings</h2>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Owner Aliases & Colors</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Manage the owners associated with your accounts and transactions.</p>
        </div>
        {isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="divide-y divide-border">
            {owners.map(owner => (
              <li key={owner.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: owner.color ?? '#94a3b8' }}
                />
                {editingId === owner.id ? (
                  <div className="flex flex-col gap-2 flex-1 md:flex-row md:items-center">
                    <input
                      className="border border-input rounded-md px-3 py-1.5 text-sm flex-1 bg-card text-foreground"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(owner.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <input type="color" className="h-9 w-12 rounded border border-input bg-card" value={editColor} onChange={e => setEditColor(e.target.value)} />
                    <button
                      onClick={() => saveEdit(owner.id)}
                      className="p-1.5 rounded-md text-success hover:bg-success-subtle transition-colors"
                      aria-label="Save"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      aria-label="Cancel"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm font-medium text-foreground">{owner.name}</span>
                    <button
                      onClick={() => startEdit(owner.id, owner.name)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label={`Edit ${owner.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="bg-card rounded-lg border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Ownership Change History</h3>
          <p className="text-sm text-muted-foreground">Choose how ownership changes affect historical reporting.</p>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={ownershipHistoryMode === 'point-in-time'}
                onChange={() => setOwnershipHistoryMode('point-in-time')}
              />
              Point-in-time ownership
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={ownershipHistoryMode === 'historical-retrofit'}
                onChange={() => setOwnershipHistoryMode('historical-retrofit')}
              />
              Historical retrofit ownership
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Active mode: {ownershipHistoryMode}</p>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Plaid Connection Management</h3>
          <p className="text-sm text-muted-foreground">Connection health, relink actions, and webhook status scaffolding.</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Linked institutions: 2 (stub)</p>
            <p>• Last sync status: Healthy</p>
            <div className="flex gap-2">
              <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground">Relink Account</button>
              <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground">Refresh Sync</button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Authentication Settings</h3>
          <p className="text-sm text-muted-foreground">Security scaffolding for MFA, passkeys, and active sessions.</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <label className="flex items-center gap-2"><input type="checkbox" /> Require MFA on login</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Enable passkey sign-in</label>
            <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground">View active sessions</button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Category Taxonomy</h3>
          <p className="text-sm text-muted-foreground">System-seeded taxonomy view and management scaffold.</p>
          <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            Food / Groceries / Organic
            <br />
            Entertainment / Streaming
            <br />
            Utilities / Electric
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="font-semibold text-foreground">Audit Log / Change History</h3>
        <p className="text-sm text-muted-foreground mt-1">Recent configuration changes and metadata updates.</p>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <p>2026-05-20 · Owner alias updated · by local user</p>
          <p>2026-05-19 · Budget period changed · by local user</p>
          <p>2026-05-18 · Rule priority reordered · by local user</p>
        </div>
      </div>
    </div>
  )
}
