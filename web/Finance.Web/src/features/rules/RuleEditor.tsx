import type { RuleAction, RuleCondition } from '@/lib/api-client'
import type { RuleEditorPrefillContext } from '@/features/rules/prefill'
import { operatorOptionsForField, type RuleEditorState } from '@/features/rules/ruleEditorModel'

interface RuleEditorSectionProps {
  title: string
  state: RuleEditorState
  prefill?: RuleEditorPrefillContext | null
  validationError?: string | null
  submitLabel: string
  onChange: (next: RuleEditorState) => void
  onCancel: () => void
  onSubmit: () => void
  onResetToPrefill?: () => void
}

export function RuleEditorSection({
  title,
  state,
  prefill,
  validationError,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
  onResetToPrefill,
}: RuleEditorSectionProps) {
  const operatorOptions = operatorOptionsForField(state.conditionField)
  const hasPrefill = Boolean(prefill)

  const applyPatch = (patch: Partial<RuleEditorState>) => onChange({ ...state, ...patch })

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {hasPrefill ? (
        <div className="rounded-md border border-info/40 bg-info-subtle/20 p-3 space-y-2">
          <p className="text-xs text-info-subtle-foreground">
            Auto-filled from transaction context{prefill?.transactionId ? ` (#${prefill.transactionId})` : ''}.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {prefill?.merchant ? (
              <button type="button" onClick={() => applyPatch({ conditionField: 'merchant', conditionOperator: 'contains', conditionValue: prefill.merchant })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use merchant condition
              </button>
            ) : null}
            {prefill?.description ? (
              <button type="button" onClick={() => applyPatch({ conditionField: 'description', conditionOperator: 'contains', conditionValue: prefill.description })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use description condition
              </button>
            ) : null}
            {typeof prefill?.amount === 'number' ? (
              <button type="button" onClick={() => applyPatch({ conditionField: 'amount', conditionOperator: 'equals', conditionValue: String(prefill.amount) })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use amount condition
              </button>
            ) : null}
            {prefill?.accountId ? (
              <button type="button" onClick={() => applyPatch({ conditionField: 'account', conditionOperator: 'equals', conditionValue: prefill.accountId })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use account condition
              </button>
            ) : null}
            {prefill?.category ? (
              <button type="button" onClick={() => applyPatch({ actionField: 'category', actionValue: prefill.category })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use category action
              </button>
            ) : null}
            {prefill?.type ? (
              <button type="button" onClick={() => applyPatch({ actionField: 'type', actionValue: prefill.type })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use type action
              </button>
            ) : null}
            {prefill?.tags.length ? (
              <button type="button" onClick={() => applyPatch({ actionField: 'tags', actionValue: prefill.tags.join(', ') })} className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted">
                Use tags action
              </button>
            ) : null}
            {onResetToPrefill ? (
              <button type="button" onClick={onResetToPrefill} className="rounded border border-border px-2 py-1 text-primary hover:bg-muted">
                Reset to prefill
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.name} onChange={e => applyPatch({ name: e.target.value })} placeholder="Rule name" />
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.conditionField} onChange={(e) => {
          const nextField = e.target.value as RuleCondition['field']
          const validOperators = operatorOptionsForField(nextField)
          const nextOperator = validOperators.includes(state.conditionOperator) ? state.conditionOperator : validOperators[0]
          applyPatch({ conditionField: nextField, conditionOperator: nextOperator })
        }}>
          <option value="merchant">merchant</option>
          <option value="description">description</option>
          <option value="amount">amount</option>
          <option value="account">account</option>
          <option value="type">type</option>
          <option value="category">category</option>
          <option value="tags">tags</option>
        </select>
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.conditionOperator} onChange={e => applyPatch({ conditionOperator: e.target.value as RuleCondition['operator'] })}>
          {operatorOptions.map(operator => (
            <option key={operator} value={operator}>{operator}</option>
          ))}
        </select>
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.conditionValue} onChange={e => applyPatch({ conditionValue: e.target.value })} placeholder="Condition value" />
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.actionField} onChange={e => applyPatch({ actionField: e.target.value as RuleAction['field'] })}>
          <option value="type">type</option>
          <option value="category">category</option>
          <option value="subcategory">subcategory</option>
          <option value="tags">tags</option>
          <option value="merchant">merchant normalization</option>
        </select>
        <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.actionValue} onChange={e => applyPatch({ actionValue: e.target.value })} placeholder="Action value" />
      </div>

      {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
        <button type="button" onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{submitLabel}</button>
      </div>
    </div>
  )
}
