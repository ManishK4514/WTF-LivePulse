import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function SimulatorPanel() {
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/simulator/status`)
      .then((r) => r.json())
      .then((d) => { setRunning(d.running); setSpeed(d.speed || 1) })
      .catch(() => {})
  }, [])

  async function handleToggle() {
    setLoading(true)
    const endpoint = running ? 'stop' : 'start'
    const body = running ? {} : { speed }
    const r = await fetch(`${API}/api/simulator/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    setRunning(d.status === 'running')
    setLoading(false)
  }

  async function handleReset() {
    if (!confirm('Reset all open check-ins to baseline?')) return
    setLoading(true)
    await fetch(`${API}/api/simulator/reset`, { method: 'POST' })
    setRunning(false)
    setLoading(false)
  }

  async function handleSpeedChange(s) {
    setSpeed(s)
    if (running) {
      await fetch(`${API}/api/simulator/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: s }),
      })
    }
  }

  return (
    <div className="bg-card rounded-xl p-5 border border-white/10">
      <p className="text-text-secondary text-sm font-medium mb-4">Simulator Controls</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
            running ? 'bg-danger/20 text-danger hover:bg-danger/30' : 'bg-success/20 text-success hover:bg-success/30'
          }`}
        >
          {loading ? '...' : running ? 'Pause' : 'Start'}
        </button>

        <div className="flex gap-1">
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                speed === s ? 'bg-accent text-white' : 'bg-white/10 text-text-secondary hover:bg-white/20'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          Reset to Baseline
        </button>
      </div>
    </div>
  )
}
