import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { Pencil, Check, X } from 'lucide-react'

export function SettingsPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>('')
  const [editColor, setEditColor] = useState<string>('#6366f1')
  const [ownershipHistoryMode, setOwnershipHistoryMode] = useState<'point-in-time' | 'historical-retrofit'>('point-in-time')
  const [categoryEdits, setCategoryEdits] = useState<Record<string, { name: string; icon: string }>>({})
  const [subcategoryEdits, setSubcategoryEdits] = useState<Record<string, { name: string; icon: string }>>({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️')
  const [newSubcategoryByCategory, setNewSubcategoryByCategory] = useState<Record<string, { name: string; icon: string }>>({})

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: categoryTaxonomy = [], isLoading: isLoadingTaxonomy } = useQuery({
    queryKey: ['category-taxonomy'],
    queryFn: () => apiClient.getCategoryTaxonomy(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color?: string }) => apiClient.updateOwner(id, { name, color }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owners'] })
      setEditingId(null)
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) => apiClient.createCategory({ name, icon }),
    onSuccess: () => {
      setNewCategoryName('')
      setNewCategoryIcon('🏷️')
      void qc.invalidateQueries({ queryKey: ['category-taxonomy'] })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, name, icon }: { categoryId: string; name?: string; icon?: string }) => apiClient.updateCategory(categoryId, { name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const createSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, name, icon }: { categoryId: string; name: string; icon: string }) => apiClient.createSubcategory(categoryId, { name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, subcategoryId, name, icon }: { categoryId: string; subcategoryId: string; name?: string; icon?: string }) => apiClient.updateSubcategory(categoryId, subcategoryId, { name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const categoryDrafts = useMemo(
    () =>
      Object.fromEntries(
        categoryTaxonomy.map(category => [
          category.id,
          categoryEdits[category.id] ?? { name: category.name, icon: category.icon },
        ]),
      ),
    [categoryEdits, categoryTaxonomy],
  )

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

  function updateCategoryDraft(categoryId: string, field: 'name' | 'icon', value: string) {
    setCategoryEdits(prev => {
      const current = prev[categoryId] ?? {
        name: categoryTaxonomy.find(category => category.id === categoryId)?.name ?? '',
        icon: categoryTaxonomy.find(category => category.id === categoryId)?.icon ?? '🏷️',
      }
      return { ...prev, [categoryId]: { ...current, [field]: value } }
    })
  }

  function subcategoryDraftKey(categoryId: string, subcategoryId: string) {
    return `${categoryId}|${subcategoryId}`
  }

  function updateSubcategoryDraft(categoryId: string, subcategoryId: string, field: 'name' | 'icon', value: string) {
    const key = subcategoryDraftKey(categoryId, subcategoryId)
    setSubcategoryEdits(prev => {
      const source = categoryTaxonomy.find(category => category.id === categoryId)?.subcategories.find(sub => sub.id === subcategoryId)
      const current = prev[key] ?? { name: source?.name ?? '', icon: source?.icon ?? '📂' }
      return { ...prev, [key]: { ...current, [field]: value } }
    })
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
          <p className="text-sm text-muted-foreground">Choose categories and subcategories from dropdowns with icon labels, add new ones, and customize icon choices.</p>
          <div className="space-y-4">
            {isLoadingTaxonomy ? (
              <p className="text-sm text-muted-foreground">Loading taxonomy…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground sm:col-span-2" placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                  <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Icon (emoji)" value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={!newCategoryName.trim()} onClick={() => createCategoryMutation.mutate({ name: newCategoryName.trim(), icon: newCategoryIcon.trim() || '🏷️' })}>Add category</button>
                </div>
                <div className="space-y-3">
                  {categoryTaxonomy.map(category => {
                    const draft = categoryDrafts[category.id] ?? { name: category.name, icon: category.icon }
                    const newSubcategory = newSubcategoryByCategory[category.id] ?? { name: '', icon: '📂' }
                    return (
                      <div key={category.id} className="rounded-md border border-border p-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[80px_1fr_auto]">
                          <input className="border border-input rounded-md px-2 py-2 text-sm bg-card text-foreground" value={draft.icon} onChange={e => updateCategoryDraft(category.id, 'icon', e.target.value)} />
                          <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={draft.name} onChange={e => updateCategoryDraft(category.id, 'name', e.target.value)} />
                          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50" disabled={!draft.name.trim()} onClick={() => updateCategoryMutation.mutate({ categoryId: category.id, name: draft.name.trim(), icon: draft.icon.trim() || '🏷️' })}>Save</button>
                        </div>
                        <div className="space-y-2">
                          {category.subcategories.map(subcategory => {
                            const subKey = subcategoryDraftKey(category.id, subcategory.id)
                            const subDraft = subcategoryEdits[subKey] ?? { name: subcategory.name, icon: subcategory.icon }
                            return (
                              <div key={subcategory.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[80px_1fr_auto]">
                                <input className="border border-input rounded-md px-2 py-2 text-sm bg-card text-foreground" value={subDraft.icon} onChange={e => updateSubcategoryDraft(category.id, subcategory.id, 'icon', e.target.value)} />
                                <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={subDraft.name} onChange={e => updateSubcategoryDraft(category.id, subcategory.id, 'name', e.target.value)} />
                                <button type="button" className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50" disabled={!subDraft.name.trim()} onClick={() => updateSubcategoryMutation.mutate({ categoryId: category.id, subcategoryId: subcategory.id, name: subDraft.name.trim(), icon: subDraft.icon.trim() || '📂' })}>Save</button>
                              </div>
                            )
                          })}
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[80px_1fr_auto]">
                            <input className="border border-input rounded-md px-2 py-2 text-sm bg-card text-foreground" placeholder="📂" value={newSubcategory.icon} onChange={e => setNewSubcategoryByCategory(prev => ({ ...prev, [category.id]: { ...newSubcategory, icon: e.target.value } }))} />
                            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder={`Add subcategory to ${category.name}`} value={newSubcategory.name} onChange={e => setNewSubcategoryByCategory(prev => ({ ...prev, [category.id]: { ...newSubcategory, name: e.target.value } }))} />
                            <button type="button" className="rounded-md border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50" disabled={!newSubcategory.name.trim()} onClick={() => {
                              createSubcategoryMutation.mutate({ categoryId: category.id, name: newSubcategory.name.trim(), icon: newSubcategory.icon.trim() || '📂' })
                              setNewSubcategoryByCategory(prev => ({ ...prev, [category.id]: { name: '', icon: '📂' } }))
                            }}>Add</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
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
