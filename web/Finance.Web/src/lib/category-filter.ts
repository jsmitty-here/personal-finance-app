export function matchesCategoryTreeFilter(
  category: string | undefined,
  subcategory: string | undefined,
  selectedCategories: string[],
  selectedSubcategories: string[],
) {
  if (selectedCategories.length === 0 && selectedSubcategories.length === 0) return true
  const categoryMatch = category ? selectedCategories.includes(category) : false
  const subcategoryMatch = subcategory ? selectedSubcategories.includes(subcategory) : false
  return categoryMatch || subcategoryMatch
}
