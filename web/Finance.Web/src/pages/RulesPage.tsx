import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import { CheckCircle, XCircle } from 'lucide-react'

export function RulesPage() {
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => apiClient.getRules(),
  })

  const sorted = [...rules].sort((a, b) => a.priority - b.priority)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Categorization Rules</h2>
        <span className="text-sm text-muted-foreground">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Conditions</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No rules defined.</td>
              </tr>
            ) : (
              sorted.map(rule => (
                <tr key={rule.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-subtle text-primary-subtle-foreground text-xs font-bold">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{rule.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mr-1">
                        {c.field} {c.operator} "{c.value}"
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rule.actions.map((a, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mr-1">
                        {a.field} → {a.value}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rule.isActive
                      ? <CheckCircle size={16} className="text-success inline" />
                      : <XCircle size={16} className="text-muted-foreground inline" />
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
