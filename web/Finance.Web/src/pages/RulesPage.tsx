import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import type { CategorizationRule, RuleAction, RuleCondition, Transaction } from '@/lib/api-client'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { CheckCircle, XCircle } from 'lucide-react'

export function RulesPage() {
  const qc = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [conditionField, setConditionField] = useState<RuleCondition['field']>('merchant')
  const [conditionOperator, setConditionOperator] = useState<RuleCondition['operator']>('contains')
  const [conditionValue, setConditionValue] = useState('')
  const [actionField, setActionField] = useState<RuleAction['field']>('category')
  const [actionValue, setActionValue] = useState('')

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'rules-preview'],
    queryFn: () => apiClient.getTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createRule({
        name: name.trim(),
        priority: rules.length + 1,
        isActive: true,
        conditions: [{ field: conditionField, operator: conditionOperator, value: conditionValue }],
        actions: [{ field: actionField, value: actionValue }],
      }),
    onSuccess: () => {
      setName('')
      setConditionValue('')
      setActionValue('')
      setIsCreateOpen(false)
      void qc.invalidateQueries({ queryKey: ['rules'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: Partial<CategorizationRule> }) => apiClient.updateRule(id, rule),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rules'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteRule(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rules'] }),
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => apiClient.reorderRules(ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rules'] }),
  })

  const sorted = [...rules].sort((a, b) => a.priority - b.priority)

  const previewByRule = useMemo(() => {
    const map: Record<string, number> = {}
    for (const rule of sorted) {
      map[rule.id] = transactions.filter(tx => doesRuleMatch(rule, tx)).length
    }
    return map
  }, [sorted, transactions])

  function doesRuleMatch(rule: CategorizationRule, tx: Transaction) {
    return rule.conditions.every((condition) => {
      const value = condition.value.toLowerCase()
      if (!value) return false
      const description = tx.description.toLowerCase()
      const merchant = (tx.merchant ?? '').toLowerCase()
      if (condition.field === 'merchant') return merchant.includes(value) || description.includes(value)
      if (condition.field === 'description') return description.includes(value)
      if (condition.field === 'amount') return String(Math.abs(tx.amount)).includes(value)
      if (condition.field === 'account') return tx.accountId.toLowerCase() === value
      if (condition.field === 'type') return tx.type.toLowerCase() === value
      if (condition.field === 'category') return (tx.category ?? '').toLowerCase() === value
      if (condition.field === 'tags') return tx.tags.some(tag => tag.toLowerCase().includes(value))
      return false
    })
  }

  function moveRule(ruleId: string, direction: 'up' | 'down') {
    const index = sorted.findIndex(rule => rule.id === ruleId)
    const next = [...sorted]
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderMutation.mutate(next.map(rule => rule.id))
  }

  function applyEdit(ruleId: string) {
    updateMutation.mutate({
      id: ruleId,
      rule: {
        name: name.trim(),
        conditions: [{ field: conditionField, operator: conditionOperator, value: conditionValue }],
        actions: [{ field: actionField, value: actionValue }],
      },
    })
    setEditingRuleId(null)
  }

  function beginEdit(rule: CategorizationRule) {
    setEditingRuleId(rule.id)
    setName(rule.name)
    setConditionField(rule.conditions[0]?.field ?? 'merchant')
    setConditionOperator(rule.conditions[0]?.operator ?? 'contains')
    setConditionValue(rule.conditions[0]?.value ?? '')
    setActionField(rule.actions[0]?.field ?? 'category')
    setActionValue(rule.actions[0]?.value ?? '')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Categorization Rules</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
          <button type="button" onClick={() => setIsCreateOpen(v => !v)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            {isCreateOpen ? 'Close' : 'Create Rule'}
          </button>
        </div>
      </div>

      {(isCreateOpen || editingRuleId) && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-base font-semibold text-foreground">{editingRuleId ? 'Edit Rule' : 'Create Rule'}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={name} onChange={e => setName(e.target.value)} placeholder="Rule name" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={conditionField} onChange={e => setConditionField(e.target.value as RuleCondition['field'])}>
              <option value="merchant">merchant</option>
              <option value="description">description</option>
              <option value="amount">amount</option>
              <option value="account">account</option>
              <option value="type">type</option>
              <option value="category">category</option>
              <option value="tags">tags</option>
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={conditionOperator} onChange={e => setConditionOperator(e.target.value as RuleCondition['operator'])}>
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="startsWith">startsWith</option>
              <option value="greaterThan">greaterThan</option>
              <option value="lessThan">lessThan</option>
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="Condition value" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={actionField} onChange={e => setActionField(e.target.value as RuleAction['field'])}>
              <option value="type">type</option>
              <option value="category">category</option>
              <option value="subcategory">subcategory</option>
              <option value="tags">tags</option>
              <option value="merchant">merchant normalization</option>
            </select>
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={actionValue} onChange={e => setActionValue(e.target.value)} placeholder="Action value" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => {
              setIsCreateOpen(false)
              setEditingRuleId(null)
            }} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
            {editingRuleId ? (
              <button type="button" onClick={() => applyEdit(editingRuleId)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save changes</button>
            ) : (
              <button type="button" onClick={() => createMutation.mutate()} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Create</button>
            )}
          </div>
        </div>
      )}

      <div className="md:hidden space-y-3">
        {sorted.map((rule, index) => (
          <div key={rule.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">Priority {rule.priority}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rule.isActive ? 'bg-success-subtle text-success-subtle-foreground' : 'bg-muted text-muted-foreground'}`}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Conditions: {rule.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(' · ')}</p>
            <p className="text-xs text-muted-foreground">Actions: {rule.actions.map(a => `${a.field} → ${a.value}`).join(' · ')}</p>
            <p className="text-xs text-muted-foreground">Preview impact: {previewByRule[rule.id] ?? 0} transactions</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <button type="button" onClick={() => beginEdit(rule)} className="text-primary hover:underline">Edit</button>
              <button type="button" onClick={() => updateMutation.mutate({ id: rule.id, rule: { isActive: !rule.isActive } })} className="text-primary hover:underline">{rule.isActive ? 'Deactivate' : 'Activate'}</button>
              <button type="button" onClick={() => deleteMutation.mutate(rule.id)} className="text-destructive hover:underline">Delete</button>
              <button type="button" onClick={() => moveRule(rule.id, 'up')} disabled={index === 0} className="text-primary hover:underline disabled:opacity-50">Up</button>
              <button type="button" onClick={() => moveRule(rule.id, 'down')} disabled={index === sorted.length - 1} className="text-primary hover:underline disabled:opacity-50">Down</button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conditions</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preview Impact</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No rules defined.</td>
              </tr>
            ) : (
              sorted.map((rule, index) => (
                <tr key={rule.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-subtle text-primary-subtle-foreground text-xs font-bold">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{rule.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-info-subtle text-info-subtle-foreground mr-1">
                        {c.field} {c.operator} "{c.value}"
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.actions.map((a, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary-subtle text-secondary-subtle-foreground mr-1">
                        {a.field} → {a.value}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {previewByRule[rule.id] ?? 0} tx
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rule.isActive
                      ? <CheckCircle size={16} className="text-success inline" />
                      : <XCircle size={16} className="text-muted-foreground inline" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button type="button" onClick={() => beginEdit(rule)} className="text-primary hover:underline">Edit</button>
                      <button type="button" onClick={() => updateMutation.mutate({ id: rule.id, rule: { isActive: !rule.isActive } })} className="text-primary hover:underline">{rule.isActive ? 'Disable' : 'Enable'}</button>
                      <button type="button" onClick={() => deleteMutation.mutate(rule.id)} className="text-destructive hover:underline">Delete</button>
                      <button type="button" onClick={() => moveRule(rule.id, 'up')} disabled={index === 0} className="rounded border border-border p-1 disabled:opacity-50"><ArrowUp size={12} /></button>
                      <button type="button" onClick={() => moveRule(rule.id, 'down')} disabled={index === sorted.length - 1} className="rounded border border-border p-1 disabled:opacity-50"><ArrowDown size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
