import type { RuleEditorPrefillContext } from '@/features/rules/prefill'
import {
  conditionInputKindForField,
  operatorOptionsForField,
  type RuleEditorState,
} from '@/features/rules/ruleEditorModel'
import { CategoryPathValueSelect, RuleValueInput } from '@/features/rules/RuleValueInput'
import type { Account, CategoryDefinition, RuleCondition } from '@/lib/api-client'

interface RuleEditorSectionProps {
  title: string
  state: RuleEditorState
  accounts: Account[]
  taxonomy: CategoryDefinition[]
  knownTags: string[]
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
  accounts,
  taxonomy,
  knownTags,
  prefill,
  validationError,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
  onResetToPrefill,
}: RuleEditorSectionProps) {
  const operatorOptions = operatorOptionsForField(state.conditionField)
  const conditionInputKind = conditionInputKindForField(state.conditionField)
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
            {onResetToPrefill ? (
              <button type="button" onClick={onResetToPrefill} className="rounded border border-border px-2 py-1 text-primary hover:bg-muted">
                Reset to prefill
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</label>
          <input className="w-full border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.name} onChange={e => applyPatch({ name: e.target.value })} placeholder="Rule name" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">When</label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,1.5fr)]">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.conditionField} onChange={(e) => {
              const nextField = e.target.value as RuleCondition['field']
              const validOperators = operatorOptionsForField(nextField)
              const nextOperator = validOperators.includes(state.conditionOperator) ? state.conditionOperator : validOperators[0]
              applyPatch({ conditionField: nextField, conditionOperator: nextOperator })
            }}>
              <option value="merchant">merchant</option>
              <option value="description">description</option>
              <option value="amount">amount</option>
              <option value="date">date</option>
              <option value="account">account</option>
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={state.conditionOperator} onChange={e => applyPatch({ conditionOperator: e.target.value as RuleCondition['operator'] })}>
              {operatorOptions.map(operator => (
                <option key={operator} value={operator}>{operator}</option>
              ))}
            </select>
            <RuleValueInput
              kind={conditionInputKind}
              value={state.conditionValue}
              onChange={(value) => applyPatch({ conditionValue: value })}
              placeholder="Condition value"
              accounts={accounts}
              taxonomy={taxonomy}
              knownTags={knownTags}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-3">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Change</label>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <label className="text-sm font-medium text-foreground">Category</label>
            <CategoryPathValueSelect
              taxonomy={taxonomy}
              categoryValue={state.actionCategoryValue}
              subcategoryValue={state.actionSubcategoryValue}
              onChange={({ category, subcategory }) => applyPatch({ actionCategoryValue: category, actionSubcategoryValue: subcategory })}
              placeholder="Select category or subcategory"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <RuleValueInput
              kind="tags"
              value={state.actionTagsValue}
              onChange={(value) => applyPatch({ actionTagsValue: value })}
              placeholder="Select or create tags"
              knownTags={knownTags}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <label className="text-sm font-medium text-foreground">Merchant</label>
            <RuleValueInput
              kind="text"
              value={state.actionMerchantValue}
              onChange={(value) => applyPatch({ actionMerchantValue: value })}
              placeholder="Merchant normalization"
            />
          </div>
        </div>
      </div>

      {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm text-foreground">Cancel</button>
        <button type="button" onClick={onSubmit} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{submitLabel}</button>
      </div>
    </div>
  )
}
