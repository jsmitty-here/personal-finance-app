import type { RuleEditorPrefillContext } from '@/features/rules/prefill'
import type { CategorizationRule, CategoryDefinition, RuleAction, RuleCondition, TransactionType } from '@/lib/api-client'

const SUPPORTED_CONDITION_FIELDS: RuleCondition['field'][] = ['merchant', 'description', 'amount', 'date', 'account']

export const TRANSACTION_TYPE_VALUES: TransactionType[] = [
  'income',
  'expense',
  'transfer',
]

const AMOUNT_OPERATORS: RuleCondition['operator'][] = ['equals', 'greaterThan', 'lessThan']
const DATE_OPERATORS: RuleCondition['operator'][] = ['equals', 'greaterThan', 'lessThan']
const STRING_OPERATORS: RuleCondition['operator'][] = ['contains', 'equals', 'startsWith']

export type RuleValueInputKind = 'text' | 'number' | 'date' | 'account' | 'type' | 'category' | 'subcategory' | 'tags'

export interface RuleEditorState {
  name: string
  conditionField: RuleCondition['field']
  conditionOperator: RuleCondition['operator']
  conditionValue: string
  actionCategoryValue: string
  actionSubcategoryValue: string
  actionTagsValue: string
  actionMerchantValue: string
}

export function createDefaultRuleEditorState(): RuleEditorState {
  return {
    name: '',
    conditionField: 'merchant',
    conditionOperator: 'contains',
    conditionValue: '',
    actionCategoryValue: '',
    actionSubcategoryValue: '',
    actionTagsValue: '',
    actionMerchantValue: '',
  }
}

export function createRuleEditorStateFromRule(rule: CategorizationRule): RuleEditorState {
  const actionCategoryValue = rule.actions.find(action => action.field === 'category')?.value ?? ''
  const actionSubcategoryValue = rule.actions.find(action => action.field === 'subcategory')?.value ?? ''
  const actionTagsValue = rule.actions.find(action => action.field === 'tags')?.value ?? ''
  const actionMerchantValue = rule.actions.find(action => action.field === 'merchant')?.value ?? ''
  const rawConditionField = rule.conditions[0]?.field ?? 'merchant'
  const conditionField = SUPPORTED_CONDITION_FIELDS.includes(rawConditionField) ? rawConditionField : 'merchant'
  const rawConditionOperator = rule.conditions[0]?.operator ?? 'contains'
  const conditionOperator = isOperatorCompatible(conditionField, rawConditionOperator)
    ? rawConditionOperator
    : operatorOptionsForField(conditionField)[0]

  return {
    name: rule.name,
    conditionField,
    conditionOperator,
    conditionValue: rule.conditions[0]?.value ?? '',
    actionCategoryValue,
    actionSubcategoryValue,
    actionTagsValue,
    actionMerchantValue,
  }
}

export function createRuleEditorStateFromPrefill(prefill: RuleEditorPrefillContext): RuleEditorState {
  const base = createDefaultRuleEditorState()
  const conditionValue = prefill.merchant ?? prefill.description ?? (typeof prefill.amount === 'number' ? String(prefill.amount) : '')
  return {
    ...base,
    name: prefill.ruleName ?? (prefill.merchant || prefill.description ? `Auto-categorize ${prefill.merchant ?? prefill.description}` : ''),
    conditionField: prefill.merchant ? 'merchant' : prefill.description ? 'description' : typeof prefill.amount === 'number' ? 'amount' : 'merchant',
    conditionOperator: typeof prefill.amount === 'number' ? 'equals' : 'contains',
    conditionValue,
  }
}

export function operatorOptionsForField(field: RuleCondition['field']) {
  if (field === 'amount') return AMOUNT_OPERATORS
  if (field === 'date') return DATE_OPERATORS
  if (field === 'account' || field === 'category') return ['equals'] as RuleCondition['operator'][]
  return STRING_OPERATORS
}

export function conditionInputKindForField(field: RuleCondition['field']): RuleValueInputKind {
  if (field === 'amount') return 'number'
  if (field === 'date') return 'date'
  if (field === 'account') return 'account'
  if (field === 'category') return 'category'
  if (field === 'tags') return 'tags'
  return 'text'
}

export function actionInputKindForField(field: RuleAction['field']): RuleValueInputKind {
  if (field === 'type') return 'type'
  if (field === 'category') return 'category'
  if (field === 'subcategory') return 'subcategory'
  if (field === 'tags') return 'tags'
  return 'text'
}

export function parseTagValues(value: string) {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

export function stringifyTagValues(tags: string[]) {
  return tags.join(', ')
}

export function formatTransactionTypeLabel(type: TransactionType) {
  return type
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function buildRuleActionsFromEditorState(state: RuleEditorState) {
  const actions: RuleAction[] = []

  if (state.actionCategoryValue.trim()) {
    actions.push({ field: 'category', value: state.actionCategoryValue.trim() })
  }

  if (state.actionSubcategoryValue.trim()) {
    actions.push({ field: 'subcategory', value: state.actionSubcategoryValue.trim() })
  }

  const tags = parseTagValues(state.actionTagsValue)
  if (tags.length > 0) {
    actions.push({ field: 'tags', value: stringifyTagValues(tags) })
  }

  if (state.actionMerchantValue.trim()) {
    actions.push({ field: 'merchant', value: state.actionMerchantValue.trim() })
  }

  return actions
}

export function resolveCategorySelection(selection: string, taxonomy: CategoryDefinition[]) {
  const selectedCategory = taxonomy.find(category => category.name === selection)
  if (selectedCategory) {
    return { category: selectedCategory.name, subcategory: '' }
  }

  const categoryWithSubcategory = taxonomy.find(category => category.subcategories.some(subcategory => subcategory.name === selection))
  const subcategory = categoryWithSubcategory?.subcategories.find(item => item.name === selection)

  return {
    category: categoryWithSubcategory?.name ?? '',
    subcategory: subcategory?.name ?? '',
  }
}

function isOperatorCompatible(field: RuleCondition['field'], operator: RuleCondition['operator']) {
  if (field === 'amount') return AMOUNT_OPERATORS.includes(operator)
  if (field === 'date') return DATE_OPERATORS.includes(operator)
  if (field === 'account' || field === 'category') return operator === 'equals'
  return STRING_OPERATORS.includes(operator)
}

export function validateRuleEditorState(state: RuleEditorState) {
  const actions = buildRuleActionsFromEditorState(state)

  if (!state.name.trim()) return 'Rule name is required.'
  if (!state.conditionValue.trim()) return 'Condition value is required.'
  if (actions.length === 0) return 'At least one change is required.'
  if (!isOperatorCompatible(state.conditionField, state.conditionOperator)) {
    return `Operator "${state.conditionOperator}" is not compatible with condition field "${state.conditionField}".`
  }
  if (state.conditionField === 'amount' && !Number.isFinite(Number(state.conditionValue))) {
    return 'Amount conditions require a numeric value.'
  }
  if (state.conditionField === 'date' && Number.isNaN(Date.parse(state.conditionValue))) {
    return 'Date conditions require a valid date value.'
  }
  if (state.conditionField === 'tags' && parseTagValues(state.conditionValue).length === 0) {
    return 'Tag conditions require at least one tag.'
  }
  if (state.actionSubcategoryValue && !state.actionCategoryValue) {
    return 'Choose a category when setting a subcategory change.'
  }
  return null
}
