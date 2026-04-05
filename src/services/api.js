const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (res.status === 204) return null

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || 'Request failed')
  }

  return res.json()
}

// Auth
export const login = (email, password) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const register = (email, password) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

// Transactions
export const getTransactions = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/transactions${query ? `?${query}` : ''}`)
}

export const createTransaction = (data) =>
  request('/transactions', { method: 'POST', body: JSON.stringify(data) })

export const updateTransaction = (id, data) =>
  request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteTransaction = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' })

// Accounts
export const getAccounts = () => request('/accounts')

export const createAccount = (data) =>
  request('/accounts', { method: 'POST', body: JSON.stringify(data) })

export const updateAccount = (id, data) =>
  request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteAccount = (id) =>
  request(`/accounts/${id}`, { method: 'DELETE' })

// Categories
export const getCategories = () => request('/categories')

export const createCategory = (data) =>
  request('/categories', { method: 'POST', body: JSON.stringify(data) })

export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteCategory = (id) =>
  request(`/categories/${id}`, { method: 'DELETE' })

// Budgets
export const getBudgets = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/budgets${query ? `?${query}` : ''}`)
}

export const createBudget = (data) =>
  request('/budgets', { method: 'POST', body: JSON.stringify(data) })

export const updateBudget = (id, data) =>
  request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteBudget = (id) =>
  request(`/budgets/${id}`, { method: 'DELETE' })

// Stats
export const getMonthlyStats = (month) =>
  request(`/stats/monthly${month ? `?month=${month}` : ''}`)

export const getStatsByCategory = (month) =>
  request(`/stats/by-category${month ? `?month=${month}` : ''}`)
