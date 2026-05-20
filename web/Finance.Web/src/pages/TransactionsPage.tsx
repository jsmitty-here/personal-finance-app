import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/stub-client'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function TransactionsPage() {
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient.getAccounts(),
  })

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', accountFilter, dateFrom, dateTo],
    queryFn: () =>
      apiClient.getTransactions({
        accountId: accountFilter !== 'all' ? accountFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.displayName]))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Account</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.displayName}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Merchant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Account</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No transactions found.</td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{tx.description}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.merchant ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{accountMap[tx.accountId] ?? tx.accountId}</td>
                  <td className="px-4 py-3 text-gray-600">{tx.category ?? '—'}{tx.subcategory ? ` / ${tx.subcategory}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' :
                      tx.type === 'expense' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${tx.amount >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {fmt(tx.amount)}
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
