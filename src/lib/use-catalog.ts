import { useEffect, useState } from 'react'
import { getErrorMessage } from './api'
import { loadCatalog, resetCatalog } from './catalog'
import type { PublicSalon } from '../types'

export function useCatalog() {
  const [salons, setSalons] = useState<PublicSalon[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    loadCatalog()
      .then((data) => {
        if (active) setSalons(data)
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, 'Could not load salons.'))
      })
    return () => {
      active = false
    }
  }, [])

  function retry() {
    resetCatalog()
    setError('')
    setSalons(null)
    loadCatalog()
      .then((data) => setSalons(data))
      .catch((err: unknown) => setError(getErrorMessage(err, 'Could not load salons.')))
  }

  return { salons, error, loading: !salons && !error, retry }
}
