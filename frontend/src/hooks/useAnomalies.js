import { useEffect } from 'react'
import useStore from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function useAnomalies() {
  const { setAnomalies, dismissAnomaly } = useStore()

  useEffect(() => {
    fetch(`${API}/api/anomalies`)
      .then((r) => r.json())
      .then(setAnomalies)
      .catch(() => {})
  }, [])

  async function dismiss(id) {
    const r = await fetch(`${API}/api/anomalies/${id}/dismiss`, { method: 'PATCH' })
    if (r.ok) dismissAnomaly(id)
    return r
  }

  return { dismiss }
}
