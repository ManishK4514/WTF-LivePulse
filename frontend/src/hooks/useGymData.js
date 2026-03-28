import { useEffect, useState } from 'react'
import useStore from '../store'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function useGymData() {
  const { setGyms, selectedGymId, setLiveData } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/gyms`)
      .then((r) => r.json())
      .then((data) => {
        setGyms(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedGymId) return
    setLiveLoading(true)
    fetch(`${API}/api/gyms/${selectedGymId}/live`)
      .then((r) => r.json())
      .then((data) => {
        setLiveData({
          occupancy: data.occupancy ?? 0,
          capacity_pct: data.capacity_pct ?? 0,
          today_revenue: data.today_revenue ?? 0,
          gym: data.gym ?? null,
          active_anomalies: data.active_anomalies ?? [],
          activityFeed: data.recent_events ?? [],
        })
        setLiveLoading(false)
      })
      .catch(() => setLiveLoading(false))
  }, [selectedGymId])

  return { loading, error, liveLoading }
}
