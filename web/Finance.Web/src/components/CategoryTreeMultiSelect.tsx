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

  return (
    <div className="flex flex-col gap-1">
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
      <div className="max-h-56 overflow-y-auto rounded-md border border-input bg-card px-2 py-1.5 text-sm">
        {taxonomy.map(category => (
          <div key={category.id} className="py-1">
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.name)}
                onChange={() => onSelectedCategoriesChange(toggleValue(selectedCategories, category.name))}
              />
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </label>
            <div className="ml-6 mt-1 space-y-1">
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
        ))}
      </div>
    </div>
  )
}
