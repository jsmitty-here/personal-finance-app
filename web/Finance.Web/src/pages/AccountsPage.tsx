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
      <h2 className="text-2xl font-bold text-foreground">Accounts</h2>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-success-subtle border border-success-border rounded-lg p-4">
          <p className="text-xs font-medium text-success-subtle-foreground">Total Assets</p>
          <p className="text-xl font-bold text-success-subtle-foreground">{fmt(totalAssets)}</p>
        </div>
        <div className="bg-destructive-subtle border border-destructive-border rounded-lg p-4">
          <p className="text-xs font-medium text-destructive-subtle-foreground">Total Liabilities</p>
          <p className="text-xl font-bold text-destructive-subtle-foreground">{fmt(totalLiabilities)}</p>
        </div>
        <div className="bg-primary-subtle border border-primary-border rounded-lg p-4">
          <p className="text-xs font-medium text-primary-subtle-foreground">Net Worth</p>
          <p className="text-xl font-bold text-primary-subtle-foreground">{fmt(netWorth)}</p>
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Institution</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : (
              accounts.map(account => (
                <tr key={account.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{account.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account.institution}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {TYPE_LABELS[account.type]}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${account.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {fmt(account.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${account.isActive ? 'bg-success' : 'bg-muted-foreground'}`} />
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
