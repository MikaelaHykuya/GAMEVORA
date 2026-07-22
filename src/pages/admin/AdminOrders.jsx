import { useState } from 'react'

export default function AdminOrders({ orders, setProofPreview, approveOrder, rejectOrder }) {
  const [activeTab, setActiveTab] = useState('pending')
  const displayedOrders = orders.filter(o => activeTab === 'pending' ? o.status === 'pending' : o.status !== 'pending')

  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`text-sm font-black uppercase tracking-tight transition-all ${activeTab === 'pending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            Pending
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-sm font-black uppercase tracking-tight transition-all ${activeTab === 'history' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            History
          </button>
        </div>
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${activeTab === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>
          {displayedOrders.length} {activeTab === 'pending' ? 'menunggu' : 'riwayat'}
        </span>
      </div>
      {displayedOrders.length === 0 ? (
        <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No {activeTab} orders</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04] text-[8px] text-gray-600 font-black uppercase tracking-widest">
                <th className="pb-4 px-3 text-left hidden sm:table-cell">ID</th>
                <th className="pb-4 px-3 text-left">Game</th>
                <th className="pb-4 px-3 text-left">User</th>
                <th className="pb-4 px-3 text-right hidden sm:table-cell">Amount</th>
                <th className="pb-4 px-3 text-center">Proof</th>
                <th className="pb-4 px-3 text-center">Status</th>
                <th className="pb-4 px-3 text-left hidden md:table-cell">Date</th>
                {activeTab === 'pending' && <th className="pb-4 px-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody>
              {displayedOrders.map(order => (
                <tr key={order.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                  <td className="py-4 px-3 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap hidden sm:table-cell">
                    #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                  </td>
                  <td className="py-4 px-3">
                    <p className="text-[10px] font-black uppercase truncate max-w-[100px] sm:max-w-[120px]">{order.item_name}</p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="text-[9px] font-bold truncate max-w-[80px] sm:max-w-none">{order.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-[7px] text-gray-500 truncate max-w-[80px] sm:max-w-none">{order.profiles?.email}</p>
                  </td>
                  <td className="py-4 px-3 text-right text-[10px] font-black text-purple-400 whitespace-nowrap hidden sm:table-cell">
                    {order.games ? 'Rp ' + Number(order.games.discount_price || order.games.price || 0).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-4 px-3 text-center">
                    {order.payment_proof ? (
                      <button onClick={() => setProofPreview(order)}
                        className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale">
                        Lihat
                      </button>
                    ) : (
                      <span className="text-[8px] text-gray-600">-</span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className={`px-2 py-1 rounded text-[7px] font-black border uppercase ${
                      order.status === 'approved' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                      order.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' :
                      'text-red-500 bg-red-500/10 border-red-500/20'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </td>
                  {activeTab === 'pending' && (
                    <td className="py-4 px-3">
                      <div className="flex gap-1.5 justify-center md:opacity-0 md:group-hover:opacity-100 transition-all">
                        <button onClick={() => approveOrder(order)}
                          className="px-3.5 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-green-500/20 transition-all">
                          Approve
                        </button>
                        <button onClick={() => rejectOrder(order)}
                          className="px-3.5 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-red-500/20 transition-all">
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
