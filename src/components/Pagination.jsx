export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 mt-24">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 transition-all active-scale disabled:opacity-10 hover:bg-white/10 hover:border-purple-500/20 hover:text-purple-400"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        Sebelumnya
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-gray-600 font-black">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-12 h-12 rounded-[18px] text-[11px] font-black transition-all duration-300 active-scale ${
              p === currentPage
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] scale-110'
                : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:border-purple-500/30 hover:bg-white/10 hover:-translate-y-0.5'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 transition-all active-scale disabled:opacity-10 hover:bg-white/10 hover:border-purple-500/20 hover:text-purple-400"
      >
        Selanjutnya
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  )
}
