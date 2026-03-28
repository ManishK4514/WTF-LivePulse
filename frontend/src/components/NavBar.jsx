import { Link, useLocation } from 'react-router-dom'
import useStore from '../store'

export default function NavBar() {
  const location = useLocation()
  const { gyms, selectedGymId, setSelectedGymId, unreadCount, wsConnected } = useStore()

  return (
    <nav className="bg-card border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="text-accent font-bold text-lg tracking-tight">WTF LivePulse</span>
          <div className="flex gap-1">
            {[['/', 'Dashboard'], ['/analytics', 'Analytics'], ['/anomalies', 'Anomalies']].map(([path, label]) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
                {label === 'Anomalies' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-danger text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {gyms.length > 0 && (
            <select
              value={selectedGymId || ''}
              onChange={(e) => setSelectedGymId(e.target.value)}
              className="bg-bg border border-white/20 text-text-primary text-sm rounded px-2 py-1 focus:outline-none focus:border-accent"
            >
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-success animate-pulse' : 'bg-danger'}`} />
            <span className="text-xs text-text-secondary">{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
