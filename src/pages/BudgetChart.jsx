import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import MonthPicker from '../components/MonthPicker'
import { getStatsByCategory, getBudgets } from '../services/api'

const RADIAN = Math.PI / 180

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: data } = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: data.color }} />
        <span className="font-medium text-gray-900">{name}</span>
      </div>
      <p className="text-sm text-gray-600">{value.toFixed(2)} €</p>
    </div>
  )
}

export default function BudgetChart() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [categoryStats, setCategoryStats] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getStatsByCategory(month),
      getBudgets({ month }),
    ])
      .then(([stats, b]) => {
        setCategoryStats(stats)
        setBudgets(b)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month])

  const chartData = categoryStats.map((cs) => ({
    name: cs.category_name,
    value: Math.abs(Number(cs.total)),
    color: cs.color || '#94a3b8',
    category_id: cs.category_id,
  }))

  const totalSpent = chartData.reduce((s, d) => s + d.value, 0)
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount_limit), 0)

  const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Répartition du budget</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <p className="text-sm text-gray-500">Total dépensé</p>
          <p className="text-2xl font-bold text-red-500">{totalSpent.toFixed(2)} €</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-center">
          <p className="text-sm text-gray-500">Budget total</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalBudget > 0 ? `${totalBudget.toFixed(2)} €` : 'Non défini'}
          </p>
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dépenses par catégorie — {monthLabel}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-12">Chargement...</p>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">Aucune dépense ce mois-ci.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                innerRadius={60}
                labelLine={false}
                label={renderCustomLabel}
                strokeWidth={2}
                stroke="#fff"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.category_id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                formatter={(value, entry) => (
                  <span className="text-sm text-gray-700">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category detail table */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Catégorie</th>
                <th className="px-6 py-3 font-medium text-right">Montant</th>
                <th className="px-6 py-3 font-medium text-right">Part</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((d) => (
                  <tr key={d.category_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-900">{d.name}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900">{d.value.toFixed(2)} €</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-500">
                      {totalSpent > 0 ? ((d.value / totalSpent) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
