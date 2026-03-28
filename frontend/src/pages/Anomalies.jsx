import { useEffect } from 'react'
import useStore from '../store'
import useAnomalies from '../hooks/useAnomalies'
import ToastContainer from '../components/Toast'

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
}

const TYPE_LABELS = {
  zero_checkins: 'Zero Check-ins',
  capacity_breach: 'Capacity Breach',
  revenue_drop: 'Revenue Drop',
}

export default function Anomalies() {
  const { anomalies, clearUnread } = useStore()
  const { dismiss } = useAnomalies()

  useEffect(() => {
    clearUnread()
  }, [])

  const active = anomalies.filter((a) => !a.resolved && !a.dismissed)
  const resolved = anomalies.filter(
    (a) => a.resolved && new Date(a.resolved_at) > new Date(Date.now() - 24 * 3600000)
  )
  const all = [...active, ...resolved]

  async function handleDismiss(a) {
    if (!confirm(`Dismiss this ${a.type.replace(/_/g, ' ')} warning?`)) return
    const r = await dismiss(a.id)
    if (!r.ok) {
      const data = await r.json().catch(() => ({}))
      alert(data.error || 'Failed to dismiss')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anomalies</h1>

      {all.length === 0 ? (
        <div className="bg-card rounded-xl p-8 border border-white/10 text-center">
          <p className="text-success text-lg font-semibold">All Clear</p>
          <p className="text-text-secondary text-sm mt-1">No active anomalies detected.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary border-b border-white/10 bg-white/5">
                <th className="text-left px-4 py-3">Gym</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Severity</th>
                <th className="text-left px-4 py-3">Detected</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {all.map((a) => (
                <tr key={a.id} className={`border-b border-white/5 hover:bg-white/5 ${a.resolved ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-text-primary">{a.gym_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{TYPE_LABELS[a.type] ?? a.type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      a.severity === 'critical' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                    }`}>
                      {a.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(a.detected_at)}</td>
                  <td className="px-4 py-3">
                    {a.resolved ? (
                      <span className="text-success text-xs">Resolved {formatDate(a.resolved_at)}</span>
                    ) : (
                      <span className="text-warning text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!a.resolved && a.severity !== 'critical' && (
                      <button
                        onClick={() => handleDismiss(a)}
                        className="text-xs text-text-secondary hover:text-text-primary bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                    {!a.resolved && a.severity === 'critical' && (
                      <span className="text-xs text-text-secondary">Cannot dismiss</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer />
    </div>
  )
}
