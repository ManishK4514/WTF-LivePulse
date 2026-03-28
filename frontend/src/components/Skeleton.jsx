export function SkeletonCard({ height = 'h-24' }) {
  return <div className={`skeleton ${height} w-full`} />
}

export function SkeletonRow() {
  return (
    <div className="flex gap-3 items-center py-2">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-4 w-16" />
    </div>
  )
}

export function SkeletonText({ width = 'w-full' }) {
  return <div className={`skeleton h-4 ${width}`} />
}
