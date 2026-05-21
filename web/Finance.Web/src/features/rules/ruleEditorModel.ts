import type { CategorizationRule, RuleAction, RuleCondition, TransactionType } from '@/lib/api-client'
import type { RuleEditorPrefillContext } from '@/features/rules/prefill'

const TYPE_VALUES: TransactionType[] = [
  'income',
  'expense',
  'transfer',
  'investment',
  'loan_payment',
  'fee',
  'tax',
  'refund',
  'reimbursement',
  'adjustment',
]

const AMOUNT_OPERATORS: RuleCondition['operator'][] = ['equals', 'greaterThan', 'lessThan']
const STRING_OPERATORS: RuleCondition['operator'][] = ['contains', 'equals', 'startsWith']

export interface RuleEditorState {
  name: string
  conditionField: RuleCondition['field']
  conditionOperator: RuleCondition['operator']
  conditionValue: string
  actionField: RuleAction['field']
  actionValue: string
}

export function createDefaultRuleEditorState(): RuleEditorState {
  return {
    name: '',
    conditionField: 'merchant',
    conditionOperator: 'contains',
    conditionValue: '',
    actionField: 'category',
    actionValue: '',
  }
}

export function createRuleEditorStateFromRule(rule: CategorizationRule): RuleEditorState {
  return {
    name: rule.name,
    conditionField: rule.conditions[0]?.field ?? 'merchant',
    conditionOperator: rule.conditions[0]?.operator ?? 'contains',
    conditionValue: rule.conditions[0]?.value ?? '',
    actionField: rule.actions[0]?.field ?? 'category',
    actionValue: rule.actions[0]?.value ?? '',
  }
}

export function createRuleEditorStateFromPrefill(prefill: RuleEditorPrefillContext): RuleEditorState {
  const base = createDefaultRuleEditorState()
  const conditionValue = prefill.merchant ?? prefill.description ?? (typeof prefill.amount === 'number' ? String(prefill.amount) : '')
  const actionField: RuleAction['field'] = prefill.category ? 'category' : prefill.type ? 'type' : prefill.tags.length ? 'tags' : 'category'
  const actionValue = prefill.category ?? prefill.type ?? (prefill.tags.length ? prefill.tags.join(', ') : '')
  return {
    ...base,
    name: prefill.ruleName ?? (prefill.merchant || prefill.description ? `Auto-categorize ${prefill.merchant ?? prefill.description}` : ''),
    conditionField: prefill.merchant ? 'merchant' : prefill.description ? 'description' : typeof prefill.amount === 'number' ? 'amount' : 'merchant',
    conditionOperator: typeof prefill.amount === 'number' ? 'equals' : 'contains',
    conditionValue,
    actionField,
    actionValue,
  }
}

export function operatorOptionsForField(field: RuleCondition['field']) {
  if (field === 'amount') return AMOUNT_OPERATORS
  if (field === 'account' || field === 'type' || field === 'category') return ['equals'] as RuleCondition['operator'][]
  return STRING_OPERATORS
}

function isOperatorCompatible(field: RuleCondition['field'], operator: RuleCondition['operator']) {
  if (field === 'amount') return AMOUNT_OPERATORS.includes(operator)
  if (field === 'account' || field === 'type' || field === 'category') return operator === 'equals'
  return STRING_OPERATORS.includes(operator)
}

export function validateRuleEditorState(state: RuleEditorState) {
  if (!state.name.trim()) return 'Rule name is required.'
  if (!state.conditionValue.trim()) return 'Condition value is required.'
  if (!state.actionValue.trim()) return 'Action value is required.'
  if (!isOperatorCompatible(state.conditionField, state.conditionOperator)) {
    return `Operator "${state.conditionOperator}" is not compatible with condition field "${state.conditionField}".`
  }
  if (state.conditionField === 'amount' && !Number.isFinite(Number(state.conditionValue))) {
    return 'Amount conditions require a numeric value.'
  }
  if (state.actionField === 'type' && !TYPE_VALUES.includes(state.actionValue as TransactionType)) {
    return 'Type action must be a valid transaction type.'
  }
  if (state.actionField === 'tags' && state.actionValue.split(',').map(tag => tag.trim()).filter(Boolean).length === 0) {
    return 'Tags action requires at least one tag.'
  }
  return null
}
