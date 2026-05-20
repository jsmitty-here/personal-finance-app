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
        <h2 className="text-2xl font-bold text-gray-900">Categorization Rules</h2>
        <span className="text-sm text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Conditions</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No rules defined.</td>
              </tr>
            ) : (
              sorted.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {rule.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 mr-1">
                        {c.field} {c.operator} "{c.value}"
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {rule.actions.map((a, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 mr-1">
                        {a.field} → {a.value}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {rule.isActive
                      ? <CheckCircle size={16} className="text-green-500 inline" />
                      : <XCircle size={16} className="text-gray-400 inline" />
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
