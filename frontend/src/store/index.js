import { create } from 'zustand'

const useStore = create((set, get) => ({
  // Gyms
  gyms: [],
  selectedGymId: null,
  setGyms: (gyms) => set({ gyms, selectedGymId: gyms[0]?.id ?? null }),
  setSelectedGymId: (id) => set({ selectedGymId: id }),

  // Live data for selected gym
  liveData: {
    occupancy: 0,
    capacity_pct: 0,
    today_revenue: 0,
    gym: null,
    active_anomalies: [],
    activityFeed: [],
  },
  setLiveData: (data) => set({ liveData: data }),

  updateOccupancy: (gym_id, occupancy, capacity_pct) => set((state) => {
    if (state.selectedGymId !== gym_id) return {};
    return {
      liveData: { ...state.liveData, occupancy, capacity_pct },
    };
  }),

  addActivityEvent: (event) => set((state) => {
    const feed = [event, ...state.liveData.activityFeed].slice(0, 20);
    return { liveData: { ...state.liveData, activityFeed: feed } };
  }),

  updateRevenue: (gym_id, today_total) => set((state) => {
    if (state.selectedGymId !== gym_id) return {};
    return { liveData: { ...state.liveData, today_revenue: today_total } };
  }),

  updateGymStats: (gym_id, updates) => set((state) => ({
    gyms: state.gyms.map((g) =>
      g.id === gym_id ? { ...g, ...updates } : g
    ),
  })),

  // Anomalies
  anomalies: [],
  unreadCount: 0,
  setAnomalies: (anomalies) => set({ anomalies }),
  addAnomaly: (anomaly) => set((state) => ({
    anomalies: [anomaly, ...state.anomalies],
    unreadCount: state.unreadCount + 1,
  })),
  resolveAnomaly: (anomaly_id, resolved_at) => set((state) => ({
    anomalies: state.anomalies.map((a) =>
      a.id === anomaly_id ? { ...a, resolved: true, resolved_at } : a
    ),
  })),
  dismissAnomaly: (anomaly_id) => set((state) => ({
    anomalies: state.anomalies.filter((a) => a.id !== anomaly_id),
  })),
  clearUnread: () => set({ unreadCount: 0 }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Date.now() }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  // WebSocket status
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
}))

export default useStore
