function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function EventIcon({ type }) {
  if (type === 'checkin') return <span className="text-success">↑</span>
  if (type === 'checkout') return <span className="text-text-secondary">↓</span>
  if (type === 'payment') return <span className="text-accent">₹</span>
  return null
}

export default function ActivityFeed({ events = [] }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-white/10">
      <p className="text-text-secondary text-sm font-medium mb-3">Activity Feed</p>
      {events.length === 0 ? (
        <p className="text-text-secondary text-sm">No recent activity</p>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-white/5">
              <EventIcon type={e.event_type} />
              <span className="text-text-primary flex-1 truncate">{e.member_name ?? 'Unknown'}</span>
              {e.event_type === 'payment' && (
                <span className="text-accent text-xs">₹{e.amount?.toLocaleString('en-IN')}</span>
              )}
              <span className="text-text-secondary text-xs shrink-0">{formatTime(e.event_time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
