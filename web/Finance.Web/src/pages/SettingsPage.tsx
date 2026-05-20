import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { Pencil, Check, X } from 'lucide-react'

export function SettingsPage() {
  const qc = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>('')

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => apiClient.updateOwner(id, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owners'] })
      setEditingId(null)
    },
  })

  function startEdit(id: string, name: string) {
    setEditingId(id)
    setEditName(name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function saveEdit(id: string) {
    if (editName.trim()) {
      updateMutation.mutate({ id, name: editName.trim() })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Owners</h3>
          <p className="text-sm text-gray-500 mt-0.5">Manage the owners associated with your accounts and transactions.</p>
        </div>
        {isLoading ? (
          <p className="px-5 py-6 text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {owners.map(owner => (
              <li key={owner.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: owner.color ?? '#94a3b8' }}
                />
                {editingId === owner.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-1"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(owner.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(owner.id)}
                      className="p-1.5 rounded-md text-green-600 hover:bg-green-50"
                      aria-label="Save"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                      aria-label="Cancel"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm font-medium text-gray-900">{owner.name}</span>
                    <button
                      onClick={() => startEdit(owner.id, owner.name)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
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
    </div>
  )
}
