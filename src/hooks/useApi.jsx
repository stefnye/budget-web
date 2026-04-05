import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

export function useApi(apiFn) {
  const { logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      if (err.message === 'Unauthorized') {
        logout()
      }
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFn, logout])

  return { data, loading, error, execute }
}
