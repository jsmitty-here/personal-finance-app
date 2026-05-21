import type { TransactionType } from '@/lib/api-client'

const TRANSACTION_TYPES: TransactionType[] = [
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

export interface RuleEditorPrefillContext {
  transactionId?: string
  merchant?: string
  description?: string
  amount?: number
  accountId?: string
  type?: TransactionType
  category?: string
  subcategory?: string
  tags: string[]
  ruleName?: string
}

function clean(value: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseTags(value?: string) {
  return (value ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

export function buildRulePrefillSearchParams(prefill: RuleEditorPrefillContext) {
  const params = new URLSearchParams()
  if (prefill.transactionId) params.set('txId', prefill.transactionId)
  if (prefill.merchant) params.set('merchant', prefill.merchant)
  if (prefill.description) params.set('description', prefill.description)
  if (typeof prefill.amount === 'number' && Number.isFinite(prefill.amount)) params.set('amount', String(prefill.amount))
  if (prefill.accountId) params.set('accountId', prefill.accountId)
  if (prefill.type) params.set('type', prefill.type)
  if (prefill.category) params.set('category', prefill.category)
  if (prefill.subcategory) params.set('subcategory', prefill.subcategory)
  if (prefill.tags.length) params.set('tags', prefill.tags.join(','))
  if (prefill.ruleName) params.set('ruleName', prefill.ruleName)
  return params
}

export function parseRulePrefillSearchParams(params: URLSearchParams): RuleEditorPrefillContext | null {
  const amountRaw = clean(params.get('amount'))
  const amount = amountRaw ? Number(amountRaw) : undefined
  const typeRaw = clean(params.get('type'))
  const type = typeRaw && TRANSACTION_TYPES.includes(typeRaw as TransactionType) ? (typeRaw as TransactionType) : undefined
  const prefill: RuleEditorPrefillContext = {
    transactionId: clean(params.get('txId')),
    merchant: clean(params.get('merchant')),
    description: clean(params.get('description')),
    amount: Number.isFinite(amount) ? amount : undefined,
    accountId: clean(params.get('accountId')),
    type,
    category: clean(params.get('category')),
    subcategory: clean(params.get('subcategory')),
    tags: parseTags(clean(params.get('tags'))),
    ruleName: clean(params.get('ruleName')),
  }

  const hasData = Boolean(
    prefill.transactionId
    || prefill.merchant
    || prefill.description
    || typeof prefill.amount === 'number'
    || prefill.accountId
    || prefill.type
    || prefill.category
    || prefill.subcategory
    || prefill.tags.length
    || prefill.ruleName,
  )
  return hasData ? prefill : null
}

export function getRulePrefillSignature(prefill: RuleEditorPrefillContext | null) {
  if (!prefill) return ''
  return JSON.stringify(prefill)
}
