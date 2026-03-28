export default function KpiCard({ label, value, sub, color = 'text-text-primary' }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-white/10">
      <p className="text-text-secondary text-sm font-medium mb-1">{label}</p>
      <p className={`text-4xl font-bold animate-count ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-text-secondary text-xs mt-1">{sub}</p>}
    </div>
  )
}
