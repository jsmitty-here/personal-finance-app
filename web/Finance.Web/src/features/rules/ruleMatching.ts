import type { CategorizationRule, RuleCondition, Transaction } from '@/lib/api-client'

function parseMultiValue(value: string) {
  return value
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(Boolean)
}

function compareStrings(operator: RuleCondition['operator'], source: string, expected: string) {
  if (!expected) return false
  if (operator === 'contains') return source.includes(expected)
  if (operator === 'equals') return source === expected
  if (operator === 'startsWith') return source.startsWith(expected)
  if (operator === 'greaterThan') return source > expected
  if (operator === 'lessThan') return source < expected
  return false
}

function compareCondition(condition: RuleCondition, tx: Transaction) {
  const normalizedValue = condition.value.trim().toLowerCase()
  const normalizedValues = parseMultiValue(condition.value)
  if (!normalizedValue) return false

  if (condition.field === 'amount') {
    const parsed = Number(normalizedValue)
    if (!Number.isFinite(parsed)) return false
    const amount = Math.abs(tx.amount)
    if (condition.operator === 'greaterThan') return amount > parsed
    if (condition.operator === 'lessThan') return amount < parsed
    return amount === parsed
  }

  if (condition.field === 'date') {
    const txDate = tx.date
    if (condition.operator === 'greaterThan') return txDate > condition.value
    if (condition.operator === 'lessThan') return txDate < condition.value
    return txDate === condition.value
  }

  const description = tx.description.toLowerCase()
  const merchant = (tx.merchant ?? '').toLowerCase()
  const accountId = tx.accountId.toLowerCase()
  const type = tx.type.toLowerCase()
  const category = (tx.category ?? '').toLowerCase()

  if (condition.field === 'merchant') {
    return compareStrings(condition.operator, merchant, normalizedValue) || compareStrings(condition.operator, description, normalizedValue)
  }
  if (condition.field === 'description') return compareStrings(condition.operator, description, normalizedValue)
  if (condition.field === 'account') return compareStrings(condition.operator, accountId, normalizedValue)
  if (condition.field === 'type') return compareStrings(condition.operator, type, normalizedValue)
  if (condition.field === 'category') return compareStrings(condition.operator, category, normalizedValue)
  if (condition.field === 'tags') {
    return normalizedValues.some(expectedTag => tx.tags.some(tag => compareStrings(condition.operator, tag.toLowerCase(), expectedTag)))
  }
  return false
}

export function doesRuleMatch(rule: CategorizationRule, tx: Transaction) {
  return rule.conditions.every(condition => compareCondition(condition, tx))
}
