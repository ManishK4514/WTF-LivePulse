import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import useStore from '../store'
import { SkeletonCard } from '../components/Skeleton'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`)
const PIE_COLORS = ['#0891B2', '#22C55E', '#F59E0B']

function heatmapColor(count, max) {
  if (!count || !max) return 'bg-white/5'
  const intensity = count / max
  if (intensity > 0.8) return 'bg-accent opacity-100'
  if (intensity > 0.6) return 'bg-accent opacity-80'
  if (intensity > 0.4) return 'bg-accent opacity-60'
  if (intensity > 0.2) return 'bg-accent opacity-40'
  return 'bg-accent opacity-20'
}

function Heatmap({ data }) {
  if (!data || data.length === 0) return <p className="text-text-secondary text-sm">No heatmap data</p>
  const map = {}
  let max = 0
  for (const d of data) {
    const key = `${d.day_of_week}-${d.hour_of_day}`
    map[key] = parseInt(d.checkin_count)
    if (map[key] > max) max = map[key]
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid" style={{ gridTemplateColumns: `50px repeat(24, 28px)`, gap: '2px' }}>
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-text-secondary text-center" style={{ fontSize: '9px' }}>{h.split(':')[0]}</div>
        ))}
        {DAYS.map((day, dow) => (
          <>
            <div key={`day-${dow}`} className="text-text-secondary text-xs flex items-center pr-2">{day}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const count = map[`${dow}-${hour}`] || 0
              return (
                <div
                  key={`${dow}-${hour}`}
                  title={`${day} ${hour}:00 — ${count} check-ins`}
                  className={`w-6 h-6 rounded-sm ${heatmapColor(count, max)}`}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { selectedGymId, gyms } = useStore()
  const [dateRange, setDateRange] = useState('30d')
  const [data, setData] = useState(null)
  const [crossGym, setCrossGym] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/analytics/cross-gym`)
      .then((r) => r.json())
      .then(setCrossGym)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedGymId) return
    setLoading(true)
    fetch(`${API}/api/gyms/${selectedGymId}/analytics?dateRange=${dateRange}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedGymId, dateRange])

  const selectedGym = gyms.find((g) => g.id === selectedGymId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                dateRange === r ? 'bg-accent text-white' : 'bg-white/10 text-text-secondary hover:bg-white/20'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard height="h-64" />
          <SkeletonCard height="h-64" />
          <SkeletonCard height="h-64" />
          <SkeletonCard height="h-64" />
        </div>
      ) : !data ? (
        <p className="text-text-secondary">Failed to load analytics data.</p>
      ) : (
        <>
          {/* Peak hours heatmap */}
          <div className="bg-card rounded-xl p-5 border border-white/10">
            <p className="text-text-secondary text-sm font-medium mb-4">Peak Hours Heatmap — Last 7 Days</p>
            <Heatmap data={data.heatmap} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by plan type */}
            <div className="bg-card rounded-xl p-5 border border-white/10">
              <p className="text-text-secondary text-sm font-medium mb-4">Revenue by Plan Type ({dateRange})</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.revenue_by_plan}>
                  <XAxis dataKey="plan_type" stroke="#64748B" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="total" fill="#0891B2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* New vs renewal donut */}
            <div className="bg-card rounded-xl p-5 border border-white/10">
              <p className="text-text-secondary text-sm font-medium mb-4">New vs Renewal ({dateRange})</p>
              {data.membership_ratio.length === 0 ? (
                <p className="text-text-secondary text-sm">No data for this period</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.membership_ratio} dataKey="cnt" nameKey="member_type" cx="50%" cy="50%" outerRadius={80} label>
                      {data.membership_ratio.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                    <Tooltip contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Churn risk */}
          <div className="bg-card rounded-xl p-5 border border-white/10">
            <p className="text-text-secondary text-sm font-medium mb-4">
              Churn Risk Members ({data.churn_risk.length} members)
            </p>
            {data.churn_risk.length === 0 ? (
              <p className="text-text-secondary text-sm">No churn risk members detected</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-secondary border-b border-white/10">
                      <th className="text-left py-2 pr-4">Name</th>
                      <th className="text-left py-2 pr-4">Last Check-in</th>
                      <th className="text-left py-2 pr-4">Days Inactive</th>
                      <th className="text-left py-2">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.churn_risk.slice(0, 50).map((m) => (
                      <tr key={m.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 pr-4 text-text-primary">{m.name}</td>
                        <td className="py-2 pr-4 text-text-secondary">
                          {m.last_checkin_at ? new Date(m.last_checkin_at).toLocaleDateString('en-IN') : 'Never'}
                        </td>
                        <td className="py-2 pr-4 text-text-secondary">{m.days_inactive ?? '—'}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            m.risk_level === 'CRITICAL' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                          }`}>
                            {m.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cross-gym revenue comparison */}
      <div className="bg-card rounded-xl p-5 border border-white/10">
        <p className="text-text-secondary text-sm font-medium mb-4">Cross-Gym Revenue — Last 30 Days</p>
        {crossGym.length === 0 ? (
          <p className="text-text-secondary text-sm">Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={crossGym} layout="vertical" margin={{ left: 160 }}>
              <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B' }} width={155} />
              <Tooltip
                contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Bar dataKey="total_revenue" fill="#0891B2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
