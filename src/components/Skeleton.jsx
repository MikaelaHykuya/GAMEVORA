export function Skeleton({ className = '', width, height = 20, rounded = 'rounded-xl' }) {
  return (
    <div
      className={`skeleton ${rounded} ${className}`}
      style={{ width: width || '100%', height }}
    />
  )
}

export function GameCardSkeleton() {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-[32px] overflow-hidden">
      <Skeleton height={200} rounded="rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} width="40%" />
        <div className="flex items-center gap-3 mt-3">
          <Skeleton height={36} width={80} rounded="rounded-xl" />
          <Skeleton height={36} width={60} rounded="rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-[32px] overflow-hidden">
      <Skeleton height={160} rounded="rounded-none" />
      <div className="px-6 pb-6 -mt-12 relative z-10 flex items-end gap-4">
        <Skeleton width={96} height={96} rounded="rounded-2xl" />
        <div className="flex-1 space-y-2 pb-2">
          <Skeleton height={24} width="50%" />
          <Skeleton height={14} width="30%" />
        </div>
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[1,2,3].map(i => (
        <div key={i} className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton height={12} width={60} />
            <Skeleton width={32} height={32} rounded="rounded-lg" />
          </div>
          <Skeleton height={28} width={100} />
        </div>
      ))}
    </div>
  )
}
