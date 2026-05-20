import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'
import type { Account } from '@/lib/api-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const TYPE_LABELS: Record<Account['type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  brokerage: 'Brokerage',
  retirement: 'Retirement',
  mortgage: 'Mortgage',
  loan: 'Loan',
  manual_asset: 'Manual Asset',
  manual_liability: 'Manual Liability',
}

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs font-medium text-green-700">Total Assets</p>
          <p className="text-xl font-bold text-green-800">{fmt(totalAssets)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-medium text-red-700">Total Liabilities</p>
          <p className="text-xl font-bold text-red-800">{fmt(totalLiabilities)}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-xs font-medium text-indigo-700">Net Worth</p>
          <p className="text-xl font-bold text-indigo-800">{fmt(netWorth)}</p>
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Account</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Institution</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Balance</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : (
              accounts.map(account => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{account.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{account.institution}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {TYPE_LABELS[account.type]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${account.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {fmt(account.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
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
