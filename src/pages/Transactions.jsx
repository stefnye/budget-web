import { useEffect, useState } from 'react'
import TransactionRow from '../components/TransactionRow'
import MonthPicker from '../components/MonthPicker'
import AddTransactionModal from '../components/AddTransactionModal'
import { getTransactions, createTransaction, getCategories, getAccounts } from '../services/api'

export default function Transactions() {
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    const params = { month }
    if (categoryFilter) params.category_id = categoryFilter
    getTransactions(params).then(setTransactions).catch(() => {})
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
    getAccounts().then(setAccounts).catch(() => {})
  }, [])

  useEffect(() => { load() }, [month, categoryFilter])

  const handleAdd = async (data) => {
    await createTransaction(data)
    setShowModal(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <MonthPicker value={month} onChange={setMonth} />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune transaction trouvée.</p>
        ) : (
          transactions.map((t) => (
            <TransactionRow key={t.id} transaction={t} categories={categories} />
          ))
        )}
      </div>

      {showModal && (
        <AddTransactionModal
          accounts={accounts}
          categories={categories}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
