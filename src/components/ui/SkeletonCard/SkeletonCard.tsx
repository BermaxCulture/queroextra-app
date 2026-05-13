import * as React from 'react'

export const SkeletonCard: React.FC = () => (
  <div className="bg-qe-white rounded-qe-md border border-qe-gray-200 overflow-hidden" aria-busy="true" aria-label="Carregando vaga...">
    <div className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="shimmer h-3 w-20 rounded-qe-xs" />
        <div className="shimmer h-6 w-16 rounded-qe-xs" />
      </div>
      <div className="shimmer h-5 w-3/4 rounded-qe-xs mb-1.5" />
      <div className="shimmer h-5 w-1/2 rounded-qe-xs mb-3" />
      <div className="flex flex-col gap-2 mb-3">
        <div className="shimmer h-3.5 w-40 rounded-qe-xs" />
        <div className="shimmer h-3.5 w-32 rounded-qe-xs" />
        <div className="shimmer h-3.5 w-36 rounded-qe-xs" />
      </div>
      <div className="flex gap-1.5">
        <div className="shimmer h-5 w-16 rounded-qe-pill" />
        <div className="shimmer h-5 w-20 rounded-qe-pill" />
      </div>
    </div>
    <div className="border-t border-qe-gray-100 px-4 pt-3 pb-4">
      <div className="shimmer h-[52px] w-full rounded-qe-pill" />
    </div>
  </div>
)
