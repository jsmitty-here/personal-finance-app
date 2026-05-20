import { useEffect, useMemo, useRef, useState } from 'react'
import type { CategoryDefinition } from '@/lib/api-client'

interface CategoryTreeMultiSelectProps {
  label: string
  taxonomy: CategoryDefinition[]
  selectedCategories: string[]
  selectedSubcategories: string[]
  onSelectedCategoriesChange: (categories: string[]) => void
  onSelectedSubcategoriesChange: (subcategories: string[]) => void
}

function toggleValue(values: string[], value: string) {
  if (values.includes(value)) return values.filter(v => v !== value)
  return [...values, value]
}

export function CategoryTreeMultiSelect({
  label,
  taxonomy,
  selectedCategories,
  selectedSubcategories,
  onSelectedCategoriesChange,
  onSelectedSubcategoriesChange,
}: CategoryTreeMultiSelectProps) {
  const selectedCount = selectedCategories.length + selectedSubcategories.length
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const subcategoryCountByCategoryId = useMemo(
    () =>
      Object.fromEntries(
        taxonomy.map(category => [
          category.id,
          category.subcategories.filter(subcategory => selectedSubcategories.includes(subcategory.name)).length,
        ]),
      ),
    [selectedSubcategories, taxonomy],
  )

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setExpandedCategoryId(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{selectedCount > 0 ? `${selectedCount} selected` : 'All'}</span>
          {selectedCount > 0 ? (
            <button
              type="button"
              className="text-[11px] text-primary hover:underline"
              onClick={() => {
                onSelectedCategoriesChange([])
                onSelectedSubcategoriesChange([])
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="flex items-center justify-between rounded-md border border-input bg-card px-3 py-1.5 text-left text-sm text-foreground"
        onClick={() => {
          setIsOpen(prev => !prev)
          if (isOpen) setExpandedCategoryId(null)
        }}
      >
        <span>{selectedCount > 0 ? `${selectedCount} selected` : 'All categories'}</span>
        <span className="text-xs text-muted-foreground">{isOpen ? 'Hide' : 'Show'}</span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-full rounded-md border border-input bg-card p-2 text-sm shadow-lg">
          <div className="space-y-1">
            {taxonomy.map(category => {
              const selectedSubcategoryCount = subcategoryCountByCategoryId[category.id] ?? 0
              const isExpanded = expandedCategoryId === category.id
              return (
                <div key={category.id} className="relative rounded-md border border-transparent px-1 py-1 hover:border-border">
                  <div className="flex items-center gap-2">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.name)}
                        onChange={() => onSelectedCategoriesChange(toggleValue(selectedCategories, category.name))}
                      />
                      <span>{category.icon}</span>
                      <span className="truncate">{category.name}</span>
                    </label>
                    <button
                      type="button"
                      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setExpandedCategoryId(prev => (prev === category.id ? null : category.id))}
                    >
                      {selectedSubcategoryCount > 0 ? `${selectedSubcategoryCount} selected` : 'Subcats'}
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className="absolute left-full top-0 z-50 ml-2 min-w-56 rounded-md border border-input bg-card p-2 shadow-lg">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{category.icon} {category.name}</p>
                      <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                        {category.subcategories.map(subcategory => (
                          <label key={subcategory.id} className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={selectedSubcategories.includes(subcategory.name)}
                              onChange={() => onSelectedSubcategoriesChange(toggleValue(selectedSubcategories, subcategory.name))}
                            />
                            <span>{subcategory.icon}</span>
                            <span>{subcategory.name}</span>
                          </label>
                        ))}
                      </div>
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
