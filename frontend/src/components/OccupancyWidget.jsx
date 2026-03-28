function getColor(pct) {
  if (pct >= 85) return { bar: 'bg-danger', text: 'text-danger' }
  if (pct >= 60) return { bar: 'bg-warning', text: 'text-warning' }
  return { bar: 'bg-success', text: 'text-success' }
}

export default function OccupancyWidget({ occupancy, capacity, capacity_pct }) {
  const pct = capacity_pct ?? (capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0)
  const { bar, text } = getColor(pct)

  return (
    <div className="bg-card rounded-xl p-5 border border-white/10">
      <p className="text-text-secondary text-sm font-medium mb-2">Live Occupancy</p>
      <div className="flex items-end gap-3">
        <span className={`text-5xl font-bold animate-count ${text}`}>{occupancy ?? 0}</span>
        <span className="text-text-secondary text-lg mb-1">/ {capacity ?? '?'}</span>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-text-secondary">Capacity</span>
          <span className={`font-semibold ${text}`}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bar}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
