import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, CheckCircle, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/stub-client'
import type { CategorizationRule } from '@/lib/api-client'
import {
  createDefaultRuleEditorState,
  createRuleEditorStateFromPrefill,
  createRuleEditorStateFromRule,
  RuleEditorSection,
  type RuleEditorState,
  validateRuleEditorState,
} from '@/features/rules/RuleEditor'
import { getRulePrefillSignature, parseRulePrefillSearchParams } from '@/features/rules/prefill'
import { doesRuleMatch } from '@/features/rules/ruleMatching'

const RULE_TABLE_COLUMNS = ['Priority', 'Name', 'Conditions', 'Actions', 'Preview Impact', 'Active', 'Controls'] as const

export function RulesPage() {
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const editorSectionRef = useRef<HTMLDivElement>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editorState, setEditorState] = useState<RuleEditorState>(() => createDefaultRuleEditorState())
  const [editorError, setEditorError] = useState<string | null>(null)
  const prefill = useMemo(() => parseRulePrefillSearchParams(searchParams), [searchParams])
  const prefillSignature = useMemo(() => getRulePrefillSignature(prefill), [prefill])
  const lastAppliedPrefillSignatureRef = useRef<string | null>(null)

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
        name: editorState.name.trim(),
        priority: rules.length + 1,
        isActive: true,
        conditions: [{
          field: editorState.conditionField,
          operator: editorState.conditionOperator,
          value: editorState.conditionValue.trim(),
        }],
        actions: [{ field: editorState.actionField, value: editorState.actionValue.trim() }],
      }),
    onSuccess: () => {
      setEditorState(createDefaultRuleEditorState())
      setEditorError(null)
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

  function moveRule(ruleId: string, direction: 'up' | 'down') {
    const index = sorted.findIndex(rule => rule.id === ruleId)
    const next = [...sorted]
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderMutation.mutate(next.map(rule => rule.id))
  }

  function submitEditor() {
    const validationError = validateRuleEditorState(editorState)
    if (validationError) {
      setEditorError(validationError)
      return
    }
    setEditorError(null)

    if (editingRuleId) {
      updateMutation.mutate({
        id: editingRuleId,
        rule: {
          name: editorState.name.trim(),
          conditions: [{
            field: editorState.conditionField,
            operator: editorState.conditionOperator,
            value: editorState.conditionValue.trim(),
          }],
          actions: [{ field: editorState.actionField, value: editorState.actionValue.trim() }],
        },
      })
      setEditingRuleId(null)
      return
    }
    createMutation.mutate()
  }

  function beginEdit(rule: CategorizationRule) {
    setEditorError(null)
    setIsCreateOpen(false)
    setEditingRuleId(rule.id)
    setEditorState(createRuleEditorStateFromRule(rule))
  }

  function closeEditor() {
    setIsCreateOpen(false)
    setEditingRuleId(null)
    setEditorError(null)
  }

  function toggleCreate() {
    setEditingRuleId(null)
    setEditorError(null)
    setIsCreateOpen((open) => {
      const next = !open
      if (next && !prefill) setEditorState(createDefaultRuleEditorState())
      return next
    })
  }

  function resetToPrefill() {
    if (!prefill) return
    setEditorError(null)
    setEditorState(createRuleEditorStateFromPrefill(prefill))
  }

  useEffect(() => {
    if (!prefill || !prefillSignature) return
    if (lastAppliedPrefillSignatureRef.current === prefillSignature) return
    setEditingRuleId(null)
    setIsCreateOpen(true)
    setEditorError(null)
    setEditorState(createRuleEditorStateFromPrefill(prefill))
    lastAppliedPrefillSignatureRef.current = prefillSignature
  }, [prefill, prefillSignature])

  useEffect(() => {
    if (editorError) setEditorError(null)
  }, [editorState])

  useEffect(() => {
    if (!isCreateOpen && !editingRuleId) return
    const frame = requestAnimationFrame(() => {
      const section = editorSectionRef.current
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [editingRuleId, isCreateOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Categorization Rules</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
          <button type="button" onClick={toggleCreate} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            {isCreateOpen ? 'Close' : 'Create Rule'}
          </button>
        </div>
      </div>

      {(isCreateOpen || editingRuleId) && (
        <div ref={editorSectionRef}>
          <RuleEditorSection
            title={editingRuleId ? 'Edit Rule' : 'Create Rule'}
            state={editorState}
            prefill={editingRuleId ? null : prefill}
            validationError={editorError}
            submitLabel={editingRuleId ? 'Save changes' : 'Create'}
            onChange={setEditorState}
            onCancel={closeEditor}
            onSubmit={submitEditor}
            onResetToPrefill={!editingRuleId && prefill ? resetToPrefill : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {sorted.map((rule, index) => (
          <div key={rule.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
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

      <div className="hidden lg:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              {RULE_TABLE_COLUMNS.map((column) => (
                <th
                  key={column}
                  className={`px-4 py-3 font-medium text-muted-foreground ${
                    column === 'Active' ? 'text-center' : column === 'Controls' ? 'text-right' : 'text-left'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={RULE_TABLE_COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={RULE_TABLE_COLUMNS.length} className="px-4 py-6 text-center text-muted-foreground">No rules defined.</td>
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
