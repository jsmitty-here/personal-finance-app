import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '@/lib/stub-client'
import type { CategorizationRule, RuleCondition, Transaction, TransactionSplit } from '@/lib/api-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function formatCategoryPath(
  categoryIconByName: Record<string, string>,
  subcategoryIconByName: Record<string, string>,
  category?: string,
  subcategory?: string,
  subSubcategory?: string,
) {
  if (!category) return '—'
  const categoryLabel = `${categoryIconByName[category] ? `${categoryIconByName[category]} ` : ''}${category}`
  const subcategoryLabel = subcategory ? `${subcategoryIconByName[subcategory] ? `${subcategoryIconByName[subcategory]} ` : ''}${subcategory}` : ''
  const subSubcategoryLabel = subSubcategory ?? ''
  return [categoryLabel, subcategoryLabel, subSubcategoryLabel].filter(Boolean).join(' / ')
}

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

export function TransactionDetailPage() {
  const { transactionId = '' } = useParams()
  const qc = useQueryClient()

  const [editType, setEditType] = useState<Transaction['type']>('expense')
  const [editDescription, setEditDescription] = useState('')
  const [editMerchant, setEditMerchant] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editSubcategory, setEditSubcategory] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️')
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [newSubcategoryIcon, setNewSubcategoryIcon] = useState('📂')
  const [editTags, setEditTags] = useState('')

  const [recategorizeMode, setRecategorizeMode] = useState<'transaction' | 'rule'>('transaction')
  const [ruleName, setRuleName] = useState('')
  const [ruleConditionField, setRuleConditionField] = useState<RuleCondition['field']>('merchant')
  const [ruleConditionOperator, setRuleConditionOperator] = useState<RuleCondition['operator']>('contains')
  const [ruleConditionValue, setRuleConditionValue] = useState('')

  const [splitMode, setSplitMode] = useState<'amount' | 'percent'>('amount')
  const [splitRows, setSplitRows] = useState<Array<{ amount: string; category: string; subcategory: string; tags: string }>>([
    { amount: '', category: '', subcategory: '', tags: '' },
    { amount: '', category: '', subcategory: '', tags: '' },
  ])

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => apiClient.getTransaction(transactionId),
    enabled: !!transactionId,
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: owners = [] } = useQuery({
    queryKey: ['owners'],
    queryFn: () => apiClient.getOwners(),
  })

  const { data: rules = [] } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
  })

  const { data: categoryTaxonomy = [] } = useQuery({
    queryKey: ['category-taxonomy'],
    queryFn: () => apiClient.getCategoryTaxonomy(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => apiClient.updateTransaction(id, data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['transactions'] }),
        qc.invalidateQueries({ queryKey: ['transaction', variables.id] }),
      ])
    },
  })

  const splitMutation = useMutation({
    mutationFn: ({ id, splits }: { id: string; splits: Omit<TransactionSplit, 'id'>[] }) => apiClient.splitTransaction(id, splits),
    onSuccess: async (_, variables) => {
      setSplitRows([{ amount: '', category: '', subcategory: '', tags: '' }, { amount: '', category: '', subcategory: '', tags: '' }])
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['transactions'] }),
        qc.invalidateQueries({ queryKey: ['transaction', variables.id] }),
      ])
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon: string }) => apiClient.createCategory({ name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const createSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, name, icon }: { categoryId: string; name: string; icon: string }) => apiClient.createSubcategory(categoryId, { name, icon }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['category-taxonomy'] }),
  })

  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<CategorizationRule, 'id'>) => apiClient.createRule(rule),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rules'] }),
  })

  const ownerById = Object.fromEntries(owners.map(o => [o.id, o.name]))
  const accountById = Object.fromEntries(accounts.map(a => [a.id, a]))
  const account = transaction ? accountById[transaction.accountId] : undefined
  const categoryIconByName = Object.fromEntries(categoryTaxonomy.map(category => [category.name, category.icon]))
  const subcategoryIconByName = Object.fromEntries(
    categoryTaxonomy.flatMap(category => category.subcategories.map(subcategory => [subcategory.name, subcategory.icon])),
  )
  const taxonomyCategoryOptions = categoryTaxonomy.map(category => ({
    ...category,
    display: `${category.icon} ${category.name}`,
  }))
  const selectedTaxonomyCategory = categoryTaxonomy.find(category => category.name === editCategory)
  const subcategoryOptions = selectedTaxonomyCategory?.subcategories ?? []

  const matchingRules = useMemo(
    () => (transaction ? [...rules].sort((a, b) => a.priority - b.priority).filter(rule => doesRuleMatch(rule, transaction)) : []),
    [rules, transaction],
  )
  const winningRule = matchingRules.find(rule => rule.isActive)

  useEffect(() => {
    if (!transaction) return
    setEditType(transaction.type)
    setEditDescription(transaction.description)
    setEditMerchant(transaction.merchant ?? '')
    setEditCategory(transaction.category ?? '')
    setEditSubcategory(transaction.subcategory ?? '')
    setEditTags(transaction.tags.join(', '))
    setRecategorizeMode('transaction')
    setRuleName(`Auto-categorize ${transaction.merchant ?? transaction.description}`)
    setRuleConditionField('merchant')
    setRuleConditionOperator('contains')
    setRuleConditionValue((transaction.merchant ?? transaction.description).trim())
    setIsCreatingCategory(false)
    setIsCreatingSubcategory(false)
    setNewCategoryName('')
    setNewCategoryIcon('🏷️')
    setNewSubcategoryName('')
    setNewSubcategoryIcon('📂')
  }, [transaction])

  async function saveChanges() {
    if (!transaction) return

    let categoryToSave = editCategory
    let subcategoryToSave = editSubcategory
    let categoryIdForSubcategory = categoryTaxonomy.find(category => category.name === categoryToSave)?.id

    if (isCreatingCategory && newCategoryName.trim()) {
      const createdCategory = await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        icon: newCategoryIcon.trim() || '🏷️',
      })
      categoryToSave = createdCategory.name
      categoryIdForSubcategory = createdCategory.id
    }

    if (isCreatingSubcategory && newSubcategoryName.trim() && categoryIdForSubcategory) {
      const createdSubcategory = await createSubcategoryMutation.mutateAsync({
        categoryId: categoryIdForSubcategory,
        name: newSubcategoryName.trim(),
        icon: newSubcategoryIcon.trim() || '📂',
      })
      subcategoryToSave = createdSubcategory.name
    }

    const tags = editTags.split(',').map(tag => tag.trim()).filter(Boolean)

    await updateMutation.mutateAsync({
      id: transaction.id,
      data: {
        type: editType,
        description: editDescription.trim() || transaction.description,
        merchant: editMerchant.trim() || undefined,
        category: categoryToSave || undefined,
        subcategory: subcategoryToSave || undefined,
        tags,
        isManualOverride: true,
      },
    })

    if (recategorizeMode === 'rule') {
      const conditionValue = ruleConditionValue.trim() || (transaction.merchant ?? transaction.description)
      await createRuleMutation.mutateAsync({
        name: ruleName.trim() || `Auto-categorize ${transaction.description}`,
        priority: rules.length + 1,
        isActive: true,
        conditions: [{
          field: ruleConditionField,
          operator: ruleConditionOperator,
          value: conditionValue,
        }],
        actions: [
          { field: 'type', value: editType },
          ...(categoryToSave ? [{ field: 'category' as const, value: categoryToSave }] : []),
          ...(subcategoryToSave ? [{ field: 'subcategory' as const, value: subcategoryToSave }] : []),
          ...(tags.length ? [{ field: 'tags' as const, value: tags.join(', ') }] : []),
        ],
      })
    }
  }

  function submitSplit() {
    if (!transaction) return
    const baseAmount = Math.abs(transaction.amount)
    const rows = splitRows
      .filter(row => Number(row.amount) > 0 && row.category.trim())
      .map((row) => {
        const value = Number(row.amount)
        const splitAmount = splitMode === 'percent' ? (baseAmount * value) / 100 : value
        return {
          amount: splitAmount,
          category: row.category.trim(),
          subcategory: row.subcategory.trim() || undefined,
          tags: row.tags.split(',').map(t => t.trim()).filter(Boolean),
          ownershipAllocation: account?.ownershipAllocation,
        }
      })
    if (rows.length > 0) splitMutation.mutate({ id: transaction.id, splits: rows })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading transaction…</p>
  }

  if (!transaction) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Transaction not found.</p>
        <Link to="/transactions" className="text-sm text-primary hover:underline">Back to transactions</Link>
      </div>
    )
  }

  const txOwnership = transaction.ownershipOverride ?? account?.ownershipAllocation ?? []
  const matchedSummary = winningRule
    ? `${winningRule.name} (won) · ${matchingRules.length} matched`
    : `No active winner · ${matchingRules.length} matched`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Transaction details</p>
          <h2 className="text-2xl font-bold text-foreground">{transaction.description}</h2>
        </div>
        <Link to="/transactions" className="text-sm text-primary hover:underline">← Back to list</Link>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="text-sm text-foreground">{transaction.date}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(transaction.amount)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Account</p>
          <p className="text-sm text-foreground">{account?.displayName ?? transaction.accountId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rule state</p>
          <p className="text-sm text-foreground">{matchedSummary}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">Category</p>
          <p className="text-sm text-foreground">{formatCategoryPath(categoryIconByName, subcategoryIconByName, transaction.category, transaction.subcategory, transaction.subSubcategory)}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">Ownership</p>
          <p className="text-sm text-foreground">{txOwnership.map(o => `${ownerById[o.ownerId] ?? o.ownerId} ${o.percentage}%`).join(', ') || 'N/A'}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-base font-semibold text-foreground">Rename, recategorize, and tags</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" />
          <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={editMerchant} onChange={e => setEditMerchant(e.target.value)} placeholder="Merchant" />
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={editType} onChange={e => setEditType(e.target.value as Transaction['type'])}>
            <option value="income">income</option>
            <option value="expense">expense</option>
            <option value="transfer">transfer</option>
            <option value="investment">investment</option>
            <option value="loan_payment">loan_payment</option>
            <option value="fee">fee</option>
            <option value="tax">tax</option>
            <option value="refund">refund</option>
            <option value="reimbursement">reimbursement</option>
            <option value="adjustment">adjustment</option>
          </select>
          <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={editTags} onChange={e => setEditTags(e.target.value)} />

          <select
            className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
            value={isCreatingCategory ? '__new__' : editCategory}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setIsCreatingCategory(true)
                setEditCategory('')
                setEditSubcategory('')
              } else {
                setIsCreatingCategory(false)
                setEditCategory(e.target.value)
                setEditSubcategory('')
              }
            }}
          >
            <option value="">Select category</option>
            {taxonomyCategoryOptions.map(category => (
              <option key={category.id} value={category.name}>{category.display}</option>
            ))}
            <option value="__new__">➕ Create new category</option>
          </select>

          <select
            className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground"
            value={isCreatingSubcategory ? '__new__' : editSubcategory}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setIsCreatingSubcategory(true)
                setEditSubcategory('')
              } else {
                setIsCreatingSubcategory(false)
                setEditSubcategory(e.target.value)
              }
            }}
            disabled={!editCategory || isCreatingCategory}
          >
            <option value="">{editCategory ? 'Select subcategory' : 'Select category first'}</option>
            {subcategoryOptions.map(subcategory => (
              <option key={subcategory.id} value={subcategory.name}>{subcategory.icon} {subcategory.name}</option>
            ))}
            {editCategory ? <option value="__new__">➕ Create new subcategory</option> : null}
          </select>
        </div>

        {isCreatingCategory && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="New category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Category icon (emoji)" value={newCategoryIcon} onChange={e => setNewCategoryIcon(e.target.value)} />
          </div>
        )}

        {isCreatingSubcategory && !isCreatingCategory && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="New subcategory name" value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} />
            <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Subcategory icon (emoji)" value={newSubcategoryIcon} onChange={e => setNewSubcategoryIcon(e.target.value)} />
          </div>
        )}

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium text-foreground">Apply recategorization as</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2 text-foreground">
              <input type="radio" name="recategorize-mode" checked={recategorizeMode === 'transaction'} onChange={() => setRecategorizeMode('transaction')} />
              This transaction only
            </label>
            <label className="inline-flex items-center gap-2 text-foreground">
              <input type="radio" name="recategorize-mode" checked={recategorizeMode === 'rule'} onChange={() => setRecategorizeMode('rule')} />
              Create categorization rule
            </label>
          </div>

          {recategorizeMode === 'rule' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="Rule name" />
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ruleConditionField} onChange={e => setRuleConditionField(e.target.value as RuleCondition['field'])}>
                <option value="merchant">merchant</option>
                <option value="description">description</option>
                <option value="amount">amount</option>
                <option value="account">account</option>
                <option value="type">type</option>
                <option value="category">category</option>
                <option value="tags">tags</option>
              </select>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ruleConditionOperator} onChange={e => setRuleConditionOperator(e.target.value as RuleCondition['operator'])}>
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="startsWith">startsWith</option>
                <option value="greaterThan">greaterThan</option>
                <option value="lessThan">lessThan</option>
              </select>
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={ruleConditionValue} onChange={e => setRuleConditionValue(e.target.value)} placeholder="Condition value" />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => void saveChanges()} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Save changes
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-base font-semibold text-foreground">Split transaction</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Mode</label>
          <select className="border border-input rounded-md px-3 py-1.5 text-sm bg-card text-foreground" value={splitMode} onChange={e => setSplitMode(e.target.value as 'amount' | 'percent')}>
            <option value="amount">Fixed Amount</option>
            <option value="percent">Percentage</option>
          </select>
        </div>
        <div className="space-y-2">
          {splitRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" type="number" placeholder={splitMode === 'percent' ? 'Percent' : 'Amount'} value={row.amount} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, amount: e.target.value } : current))} />
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={row.category} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, category: e.target.value, subcategory: '' } : current))}>
                <option value="">Select category</option>
                {taxonomyCategoryOptions.map(category => <option key={category.id} value={category.name}>{category.display}</option>)}
              </select>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" value={row.subcategory} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, subcategory: e.target.value } : current))} disabled={!row.category}>
                <option value="">{row.category ? 'Select subcategory' : 'Select category first'}</option>
                {(categoryTaxonomy.find(category => category.name === row.category)?.subcategories ?? []).map(subcategory => (
                  <option key={subcategory.id} value={subcategory.name}>{subcategory.icon} {subcategory.name}</option>
                ))}
              </select>
              <input className="border border-input rounded-md px-3 py-2 text-sm bg-card text-foreground" placeholder="Tags (comma-separated)" value={row.tags} onChange={e => setSplitRows(prev => prev.map((current, i) => i === idx ? { ...current, tags: e.target.value } : current))} />
            </div>
          ))}
        </div>

        {transaction.splits?.length ? (
          <div className="rounded-md border border-border p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">Existing splits</p>
            {transaction.splits.map(split => (
              <p key={split.id} className="text-xs text-muted-foreground">
                {fmt(split.amount)} · {formatCategoryPath(categoryIconByName, subcategoryIconByName, split.category, split.subcategory)} · {split.tags.join(', ') || 'No tags'}
              </p>
            ))}
          </div>
        ) : null}

        <div className="flex justify-between">
          <button type="button" onClick={() => setSplitRows(prev => [...prev, { amount: '', category: '', subcategory: '', tags: '' }])} className="text-sm text-primary hover:underline">Add split row</button>
          <button type="button" onClick={submitSplit} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Save split</button>
        </div>
      </div>
    </div>
  )
}
