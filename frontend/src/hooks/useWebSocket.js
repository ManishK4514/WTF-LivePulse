import { useEffect, useRef } from 'react'
import useStore from '../store'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

export default function useWebSocket() {
  const wsRef = useRef(null)
  const retryRef = useRef(null)
  const retryDelay = useRef(1000)

  const {
    setWsConnected,
    updateOccupancy,
    addActivityEvent,
    updateRevenue,
    updateGymStats,
    addAnomaly,
    resolveAnomaly,
    addToast,
  } = useStore()

  function connect() {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
      retryDelay.current = 1000
    }

    ws.onmessage = (e) => {
      let msg
      try { msg = JSON.parse(e.data) } catch { return }

      switch (msg.type) {
        case 'CHECKIN_EVENT':
          updateOccupancy(msg.gym_id, msg.current_occupancy, msg.capacity_pct)
          updateGymStats(msg.gym_id, { current_occupancy: msg.current_occupancy })
          addActivityEvent({
            event_type: 'checkin',
            member_name: msg.member_name,
            event_time: msg.timestamp,
            gym_id: msg.gym_id,
          })
          break
        case 'CHECKOUT_EVENT':
          updateOccupancy(msg.gym_id, msg.current_occupancy, msg.capacity_pct)
          updateGymStats(msg.gym_id, { current_occupancy: msg.current_occupancy })
          addActivityEvent({
            event_type: 'checkout',
            member_name: msg.member_name,
            event_time: msg.timestamp,
            gym_id: msg.gym_id,
          })
          break
        case 'PAYMENT_EVENT':
          updateRevenue(msg.gym_id, msg.today_total)
          updateGymStats(msg.gym_id, { today_revenue: msg.today_total })
          addActivityEvent({
            event_type: 'payment',
            member_name: msg.member_name,
            event_time: new Date().toISOString(),
            amount: msg.amount,
            plan_type: msg.plan_type,
            gym_id: msg.gym_id,
          })
          break
        case 'ANOMALY_DETECTED':
          addAnomaly({
            id: msg.anomaly_id,
            gym_id: msg.gym_id,
            gym_name: msg.gym_name,
            type: msg.anomaly_type,
            severity: msg.severity,
            message: msg.message,
            detected_at: new Date().toISOString(),
            resolved: false,
            dismissed: false,
          })
          addToast({
            type: 'error',
            title: `Anomaly: ${msg.anomaly_type.replace(/_/g, ' ')}`,
            message: msg.message,
          })
          break
        case 'ANOMALY_RESOLVED':
          resolveAnomaly(msg.anomaly_id, msg.resolved_at)
          break
        default:
          break
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
      retryRef.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30000)
        connect()
      }, retryDelay.current)
    }

    ws.onerror = () => ws.close()
  }

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [])
}
