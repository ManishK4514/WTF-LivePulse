import { useEffect } from 'react'
import useStore from '../store'

export default function ToastContainer() {
  const { toasts, removeToast } = useStore()

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [])

  const colors = {
    error: 'border-danger bg-danger/10',
    warning: 'border-warning bg-warning/10',
    success: 'border-success bg-success/10',
    info: 'border-accent bg-accent/10',
  }

  return (
    <div className={`rounded-lg border p-3 min-w-64 max-w-80 shadow-xl ${colors[toast.type] || colors.info}`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
          <p className="text-xs text-text-secondary mt-0.5">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-lg leading-none">&times;</button>
      </div>
    </div>
  )
}
