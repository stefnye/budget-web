import { useEffect, useState } from 'react'
import CategoryBar from '../components/CategoryBar'
import MonthPicker from '../components/MonthPicker'
import { getBudgets, getStatsByCategory, getCategories, createBudget } from '../services/api'

export default function Budgets() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [budgets, setBudgets] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [categories, setCategories] = useState([])
  const [newBudget, setNewBudget] = useState({ category_id: '', amount_limit: '' })

  const load = () => {
    getBudgets({ month }).then(setBudgets).catch(() => {})
    getStatsByCategory(month).then(setCategoryStats).catch(() => {})
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => { load() }, [month])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newBudget.category_id || !newBudget.amount_limit) return
    const [year, m] = month.split('-')
    await createBudget({
      category_id: newBudget.category_id,
      amount_limit: parseFloat(newBudget.amount_limit),
      month: `${year}-${m}-01`,
    })
    setNewBudget({ category_id: '', amount_limit: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Budget bars */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {budgets.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun budget défini pour ce mois.</p>
        ) : (
          budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id)
            const stat = categoryStats.find((cs) => cs.category_id === b.category_id)
            return (
              <CategoryBar
                key={b.id}
                name={cat?.name || 'Catégorie inconnue'}
                spent={stat ? Number(stat.total) : 0}
                limit={Number(b.amount_limit)}
                color={cat?.color}
              />
            )
          })
        )}
      </div>

      {/* Add budget form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un budget</h2>
        <form onSubmit={handleAdd} className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={newBudget.category_id}
              onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner...</option>
              {categories.filter((c) => c.type === 'expense').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Plafond (€)</label>
            <input
              type="number"
              step="0.01"
              value={newBudget.amount_limit}
              onChange={(e) => setNewBudget({ ...newBudget, amount_limit: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  )
}
