import {
    formatTransactionTypeLabel,
    parseTagValues,
    stringifyTagValues,
    TRANSACTION_TYPE_VALUES,
    type RuleValueInputKind,
} from '@/features/rules/ruleEditorModel'
import type { Account, CategoryDefinition, TransactionType } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const fieldClassName = 'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground'

interface RuleValueInputProps {
  kind: RuleValueInputKind
  value: string
  onChange: (value: string) => void
  placeholder?: string
  accounts?: Account[]
  taxonomy?: CategoryDefinition[]
  knownTags?: string[]
}

interface CategoryPathValueSelectProps {
  taxonomy?: CategoryDefinition[]
  categoryValue: string
  subcategoryValue: string
  onChange: (next: { category: string; subcategory: string }) => void
  placeholder?: string
}

interface InputShellProps {
  children: React.ReactNode
}

function InputShell({ children }: InputShellProps) {
  return <div className="relative">{children}</div>
}

function useDismissableLayer<T extends HTMLElement>(onDismiss: () => void) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onDismiss()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [onDismiss])

  return ref
}

function TagsMultiSelectField({ value, onChange, knownTags = [], placeholder }: Pick<RuleValueInputProps, 'value' | 'onChange' | 'knownTags' | 'placeholder'>) {
  const [isOpen, setIsOpen] = useState(false)
  const [draftTag, setDraftTag] = useState('')
  const selectedTags = useMemo(() => parseTagValues(value), [value])
  const wrapperRef = useDismissableLayer<HTMLDivElement>(() => setIsOpen(false))

  const allTags = useMemo(
    () => Array.from(new Set([...knownTags, ...selectedTags])).sort((left, right) => left.localeCompare(right)),
    [knownTags, selectedTags],
  )

  function commit(nextTags: string[]) {
    onChange(stringifyTagValues(Array.from(new Set(nextTags))))
  }

  function toggleTag(tag: string) {
    commit(selectedTags.includes(tag) ? selectedTags.filter(current => current !== tag) : [...selectedTags, tag])
  }

  function addDraftTag() {
    const trimmed = draftTag.trim()
    if (!trimmed) return
    commit([...selectedTags, trimmed])
    setDraftTag('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={cn(fieldClassName, 'flex min-h-10 items-center justify-between gap-3 text-left')}
        onClick={() => setIsOpen(open => !open)}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedTags.length > 0 ? selectedTags.map(tag => (
            <span key={tag} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
              {tag}
            </span>
          )) : <span className="text-muted-foreground">{placeholder ?? 'Select tags'}</span>}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-input bg-card p-3 shadow-lg">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selectedTags.length > 0 ? selectedTags.map(tag => (
              <button
                key={tag}
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2 py-1 text-xs text-primary-subtle-foreground"
                onClick={() => toggleTag(tag)}
              >
                <span>{tag}</span>
                <X size={12} />
              </button>
            )) : <p className="text-xs text-muted-foreground">No tags selected.</p>}
          </div>

          <div className="mb-3 flex gap-2">
            <input
              className={cn(fieldClassName, 'min-w-0 flex-1')}
              value={draftTag}
              onChange={(event) => setDraftTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addDraftTag()
                }
              }}
              placeholder="Create new tag"
            />
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={addDraftTag}
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="scrollbar-hidden max-h-48 space-y-1 overflow-y-auto pr-1">
            {allTags.map(tag => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors',
                    isSelected ? 'bg-primary-subtle text-primary-subtle-foreground' : 'text-foreground hover:bg-muted',
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  <span>{tag}</span>
                  {isSelected ? <Check size={14} /> : null}
                </button>
              )
            })}
            {allTags.length === 0 ? <p className="text-xs text-muted-foreground">No known tags yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CategoryTreeValueSelect({
  taxonomy = [],
  value,
  onChange,
  placeholder,
  mode,
}: {
  taxonomy?: CategoryDefinition[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  mode: 'category' | 'subcategory'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => (taxonomy[0] ? [taxonomy[0].id] : []))
  const wrapperRef = useDismissableLayer<HTMLDivElement>(() => setIsOpen(false))

  useEffect(() => {
    if (taxonomy.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([taxonomy[0].id])
    }
  }, [expandedCategories.length, taxonomy])

  const selectedCategory = taxonomy.find(category => category.name === value)
  const selectedSubcategoryParent = taxonomy.find(category => category.subcategories.some(subcategory => subcategory.name === value))
  const selectedSubcategory = selectedSubcategoryParent?.subcategories.find(subcategory => subcategory.name === value)
  const selectedLabel = selectedSubcategory && selectedSubcategoryParent
    ? `${selectedSubcategoryParent.icon} ${selectedSubcategoryParent.name} / ${selectedSubcategory.icon} ${selectedSubcategory.name}`
    : selectedCategory
      ? `${selectedCategory.icon} ${selectedCategory.name}`
      : null

  function toggleExpanded(categoryId: string) {
    setExpandedCategories(current => current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={cn(fieldClassName, 'flex min-h-10 items-center justify-between gap-3 text-left')}
        onClick={() => setIsOpen(open => !open)}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selectedLabel && 'text-muted-foreground')}>
          {selectedLabel ?? placeholder ?? 'Select category'}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-input bg-card p-2 shadow-lg">
          <div className="scrollbar-hidden max-h-64 space-y-1 overflow-y-auto pr-1">
            {taxonomy.map(category => {
              const isExpanded = expandedCategories.includes(category.id)
              const isSelectedCategory = value === category.name

              return (
                <div key={category.id} className="rounded-md border border-transparent">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => toggleExpanded(category.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        mode === 'category'
                          ? isSelectedCategory
                            ? 'bg-primary-subtle text-primary-subtle-foreground'
                            : 'text-foreground hover:bg-muted'
                          : 'text-foreground hover:bg-muted',
                      )}
                      onClick={() => {
                        if (mode === 'category') {
                          onChange(category.name)
                          setIsOpen(false)
                        } else {
                          toggleExpanded(category.id)
                        }
                      }}
                    >
                      <span className="truncate">{category.icon} {category.name}</span>
                      {mode === 'category' && isSelectedCategory ? <Check size={14} /> : null}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="ml-9 mt-1 space-y-1 border-l border-border pl-3">
                      {category.subcategories.map(subcategory => {
                        const isSelectedSubcategory = value === subcategory.name
                        return (
                          <button
                            key={subcategory.id}
                            type="button"
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                              mode === 'subcategory' && isSelectedSubcategory
                                ? 'bg-primary-subtle text-primary-subtle-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() => {
                              if (mode === 'subcategory') {
                                onChange(subcategory.name)
                                setIsOpen(false)
                              }
                            }}
                          >
                            <span className="truncate">{subcategory.icon} {subcategory.name}</span>
                            {mode === 'subcategory' && isSelectedSubcategory ? <Check size={14} /> : null}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function CategoryPathValueSelect({
  taxonomy = [],
  categoryValue,
  subcategoryValue,
  onChange,
  placeholder,
}: CategoryPathValueSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => (taxonomy[0] ? [taxonomy[0].id] : []))
  const wrapperRef = useDismissableLayer<HTMLDivElement>(() => setIsOpen(false))

  useEffect(() => {
    if (taxonomy.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([taxonomy[0].id])
    }
  }, [expandedCategories.length, taxonomy])

  const category = taxonomy.find(item => item.name === categoryValue)
  const subcategory = category?.subcategories.find(item => item.name === subcategoryValue)
  const selectedLabel = subcategory && category
    ? `${category.icon} ${category.name} / ${subcategory.icon} ${subcategory.name}`
    : category
      ? `${category.icon} ${category.name}`
      : null

  function toggleExpanded(categoryId: string) {
    setExpandedCategories(current => current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className={cn(fieldClassName, 'flex min-h-10 items-center justify-between gap-3 text-left')}
        onClick={() => setIsOpen(open => !open)}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selectedLabel && 'text-muted-foreground')}>
          {selectedLabel ?? placeholder ?? 'Select category or subcategory'}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-input bg-card p-2 shadow-lg">
          <button
            type="button"
            className="mb-2 w-full rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              onChange({ category: '', subcategory: '' })
              setIsOpen(false)
            }}
          >
            Clear selection
          </button>
          <div className="scrollbar-hidden max-h-64 space-y-1 overflow-y-auto pr-1">
            {taxonomy.map(item => {
              const isExpanded = expandedCategories.includes(item.id)
              const isSelectedCategory = item.name === categoryValue && !subcategoryValue

              return (
                <div key={item.id} className="rounded-md border border-transparent">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        isSelectedCategory ? 'bg-primary-subtle text-primary-subtle-foreground' : 'text-foreground hover:bg-muted',
                      )}
                      onClick={() => {
                        onChange({ category: item.name, subcategory: '' })
                        setIsOpen(false)
                      }}
                    >
                      <span className="truncate">{item.icon} {item.name}</span>
                      {isSelectedCategory ? <Check size={14} /> : null}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="ml-9 mt-1 space-y-1 border-l border-border pl-3">
                      {item.subcategories.map(child => {
                        const isSelectedSubcategory = item.name === categoryValue && child.name === subcategoryValue
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                              isSelectedSubcategory ? 'bg-primary-subtle text-primary-subtle-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() => {
                              onChange({ category: item.name, subcategory: child.name })
                              setIsOpen(false)
                            }}
                          >
                            <span className="truncate">{child.icon} {child.name}</span>
                            {isSelectedSubcategory ? <Check size={14} /> : null}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TransactionTypeSelect({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <select className={fieldClassName} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder ?? 'Select type'}</option>
      {TRANSACTION_TYPE_VALUES.map((type: TransactionType) => (
        <option key={type} value={type}>{formatTransactionTypeLabel(type)}</option>
      ))}
    </select>
  )
}

function AccountSelect({ value, onChange, accounts = [], placeholder }: { value: string; onChange: (value: string) => void; accounts?: Account[]; placeholder?: string }) {
  return (
    <select className={fieldClassName} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder ?? 'Select account'}</option>
      {accounts.map(account => (
        <option key={account.id} value={account.id}>{account.displayName} · {account.institution}</option>
      ))}
    </select>
  )
}

export function RuleValueInput({
  kind,
  value,
  onChange,
  placeholder,
  accounts,
  taxonomy,
  knownTags,
}: RuleValueInputProps) {
  if (kind === 'number') {
    return (
      <InputShell>
        <input
          type="number"
          step="0.01"
          className={fieldClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </InputShell>
    )
  }

  if (kind === 'date') {
    return (
      <InputShell>
        <input
          type="date"
          className={fieldClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </InputShell>
    )
  }

  if (kind === 'account') {
    return <AccountSelect value={value} onChange={onChange} accounts={accounts} placeholder={placeholder} />
  }

  if (kind === 'type') {
    return <TransactionTypeSelect value={value} onChange={onChange} placeholder={placeholder} />
  }

  if (kind === 'category') {
    return <CategoryTreeValueSelect taxonomy={taxonomy} value={value} onChange={onChange} placeholder={placeholder} mode="category" />
  }

  if (kind === 'subcategory') {
    return <CategoryTreeValueSelect taxonomy={taxonomy} value={value} onChange={onChange} placeholder={placeholder} mode="subcategory" />
  }

  if (kind === 'tags') {
    return <TagsMultiSelectField value={value} onChange={onChange} knownTags={knownTags} placeholder={placeholder} />
  }

  return (
    <InputShell>
      <input
        className={fieldClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </InputShell>
  )
}
