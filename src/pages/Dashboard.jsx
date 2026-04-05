import { useEffect, useState } from 'react'
import MetricCard from '../components/MetricCard'
import TransactionRow from '../components/TransactionRow'
import CategoryBar from '../components/CategoryBar'
import { getMonthlyStats, getStatsByCategory, getTransactions, getCategories, getBudgets } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [categoryStats, setCategoryStats] = useState([])
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState([])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    getMonthlyStats(currentMonth).then(setStats).catch(() => {})
    getStatsByCategory(currentMonth).then(setCategoryStats).catch(() => {})
    getTransactions({ month: currentMonth }).then((t) => setTransactions(t.slice(0, 5))).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
    getBudgets({ month: currentMonth }).then(setBudgets).catch(() => {})
  }, [])

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount_limit), 0)
  const totalSpent = stats ? Number(stats.expenses) : 0
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Solde" value={stats ? Number(stats.balance) : 0} color="text-gray-900" />
        <MetricCard title="Dépenses du mois" value={stats ? Number(stats.expenses) : 0} color="text-red-500" />
        <MetricCard title="Revenus du mois" value={stats ? Number(stats.income) : 0} color="text-green-600" />
      </div>

      {/* Budget progress */}
      {totalBudget > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Budget mensuel global</span>
            <span className="text-gray-500">{totalSpent.toFixed(2)} € / {totalBudget.toFixed(2)} €</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${budgetPct}%`,
                backgroundColor: budgetPct >= 100 ? '#ef4444' : '#1D9E75',
              }}
            />
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dépenses par catégorie</h2>
          {categoryStats.map((cs) => {
            const budget = budgets.find((b) => b.category_id === cs.category_id)
            return (
              <CategoryBar
                key={cs.category_id}
                name={cs.category_name}
                spent={Number(cs.total)}
                limit={budget ? Number(budget.amount_limit) : Number(cs.total)}
                color={cs.color}
              />
            )
          })}
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune transaction ce mois-ci.</p>
        ) : (
          transactions.map((t) => (
            <TransactionRow key={t.id} transaction={t} categories={categories} />
          ))
        )}
      </div>
    </div>
  )
}
