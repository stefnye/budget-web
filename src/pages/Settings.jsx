import { useEffect, useState } from 'react'
import {
  getAccounts, createAccount, deleteAccount,
  getCategories, createCategory, deleteCategory,
} from '../services/api'

export default function Settings() {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [newAccount, setNewAccount] = useState('')
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', color: '#1D9E75' })

  const loadAll = () => {
    getAccounts().then(setAccounts).catch(() => {})
    getCategories().then(setCategories).catch(() => {})
  }

  useEffect(() => { loadAll() }, [])

  const handleAddAccount = async (e) => {
    e.preventDefault()
    if (!newAccount.trim()) return
    await createAccount({ name: newAccount })
    setNewAccount('')
    loadAll()
  }

  const handleDeleteAccount = async (id) => {
    await deleteAccount(id)
    loadAll()
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) return
    await createCategory(newCategory)
    setNewCategory({ name: '', type: 'expense', color: '#1D9E75' })
    loadAll()
  }

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id)
    loadAll()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>

      {/* Accounts */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comptes bancaires</h2>
        <ul className="space-y-2 mb-4">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{a.name} — {Number(a.balance).toFixed(2)} {a.currency}</span>
              <button onClick={() => handleDeleteAccount(a.id)} className="text-red-500 text-sm hover:underline">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddAccount} className="flex space-x-3">
          <input
            type="text"
            value={newAccount}
            onChange={(e) => setNewAccount(e.target.value)}
            placeholder="Nom du compte"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
            Ajouter
          </button>
        </form>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h2>
        <ul className="space-y-2 mb-4">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color || '#ccc' }} />
                <span className="text-sm text-gray-700">{c.name}</span>
                <span className="text-xs text-gray-400">({c.type === 'expense' ? 'Dépense' : 'Revenu'})</span>
              </div>
              <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 text-sm hover:underline">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddCategory} className="flex items-end space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Nom de la catégorie"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={newCategory.type}
            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark">
            Ajouter
          </button>
        </form>
      </div>
    </div>
  )
}
