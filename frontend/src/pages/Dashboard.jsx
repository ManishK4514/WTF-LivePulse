import useWebSocket from '../hooks/useWebSocket'
import useGymData from '../hooks/useGymData'
import useStore from '../store'
import KpiCard from '../components/KpiCard'
import OccupancyWidget from '../components/OccupancyWidget'
import ActivityFeed from '../components/ActivityFeed'
import SimulatorPanel from '../components/SimulatorPanel'
import ToastContainer from '../components/Toast'
import { SkeletonCard } from '../components/Skeleton'

export default function Dashboard() {
  useWebSocket()
  const { loading, liveLoading } = useGymData()
  const { gyms, selectedGymId, liveData, anomalies } = useStore()

  const selectedGym = gyms.find((g) => g.id === selectedGymId)
  const totalOccupancy = gyms.reduce((s, g) => s + (parseInt(g.current_occupancy) || 0), 0)
  const totalRevenue = gyms.reduce((s, g) => s + (parseFloat(g.today_revenue) || 0), 0)
  const activeAnomalyCount = anomalies.filter((a) => !a.resolved && !a.dismissed).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard height="h-24" />
          <SkeletonCard height="h-24" />
          <SkeletonCard height="h-24" />
        </div>
        <SkeletonCard height="h-40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total Members Checked In"
          value={totalOccupancy.toLocaleString('en-IN')}
          sub="Across all gyms"
        />
        <KpiCard
          label="Today's Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub="All gyms combined"
          color="text-accent"
        />
        <KpiCard
          label="Active Anomalies"
          value={activeAnomalyCount}
          sub="Requires attention"
          color={activeAnomalyCount > 0 ? 'text-danger' : 'text-success'}
        />
      </div>

      {/* Selected gym live panel */}
      {selectedGym && (
        <>
          <div className="flex items-center gap-2 mt-2">
            <h2 className="text-xl font-semibold">{selectedGym.name}</h2>
            <span className="text-text-secondary text-sm">{selectedGym.city}</span>
          </div>

          {liveLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard height="h-40" />
              <SkeletonCard height="h-40" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OccupancyWidget
                occupancy={liveData.occupancy}
                capacity={selectedGym?.capacity}
                capacity_pct={liveData.capacity_pct}
              />
              <KpiCard
                label="Today's Revenue"
                value={`₹${(liveData.today_revenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                sub={selectedGym.name}
                color="text-accent"
              />
            </div>
          )}

          <ActivityFeed events={liveData.activityFeed} />
        </>
      )}

      <SimulatorPanel />
      <ToastContainer />
    </div>
  )
}
