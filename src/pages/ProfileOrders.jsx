import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'

export default function ProfileOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [refundReason, setRefundReason] = useState('')
  const [showRefundModal, setShowRefundModal] = useState(null)
  const { showToast } = useToast()
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    const fetchOrders = () => {
      supabase.from('library').select('*, games(title)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        setOrders(data || [])
      })
    }

    fetchOrders()

    const channel = supabase.channel('profile_orders_page_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: 'user_id=eq.' + user.id }, fetchOrders)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const requestRefund = async (order) => {
    if (!refundReason.trim()) return showToast('Harap isi alasan refund', 'warning')
    setRefunding(true)
    const { error } = await supabase.from('library').update({
      status: 'refund_requested',
      refund_reason: refundReason.trim()
    }).eq('id', order.id)
    if (error) showToast('Gagal: ' + error.message, 'error')
    setRefunding(false)
    setShowRefundModal(null)
    setRefundReason('')
  }

  const openRefundModal = (order) => {
    setRefundReason('')
    setShowRefundModal(order)
  }

  const cetakStruk = (order) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran</title>
          <style>
            @page { margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              background: #fff;
              color: #000;
              padding: 20px;
              font-size: 12px;
              line-height: 1.5;
            }
            .receipt {
              max-width: 300px;
              margin: 0 auto;
              border: 2px dashed #000;
              padding: 24px 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .header h1 {
              font-size: 20px;
              letter-spacing: 2px;
              font-weight: 900;
            }
            .header p {
              font-size: 9px;
              color: #555;
              margin-top: 4px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .row.label {
              color: #555;
              font-size: 10px;
            }
            .total {
              border-top: 2px solid #000;
              margin-top: 8px;
              padding-top: 8px;
              display: flex;
              justify-content: space-between;
              font-weight: 900;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 16px;
              padding-top: 12px;
              border-top: 2px solid #000;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .status-approved { color: #16a34a; font-weight: 900; }
            .status-pending { color: #ca8a04; font-weight: 900; }
            .status-rejected { color: #dc2626; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg style="width: 24px; height: 24px; color: #a855f7" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                GVR
              </h1>
              <p>Vault Digital Receipt</p>
            </div>
            <div class="row label">
              <span>Order ID</span>
              <span>#GV-$${order.id?.split('-')?.[0]?.toUpperCase()}</span>
            </div>
            <div class="row label">
              <span>Date</span>
              <span>$${new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="divider"></div>
            <div class="row">
              <span>$${order.games?.title || order.item_name || 'Package'}</span>
              <span>—</span>
            </div>
            <div class="row label">
              <span>Qty: 1</span>
              <span></span>
            </div>
            <div class="divider"></div>
            <div class="total">
              <span>TOTAL</span>
              <span>—</span>
            </div>
            <div style="margin-top: 8px; text-align: center;">
              <span class="status-$${order.status}">$${order.status.toUpperCase()}</span>
            </div>
            <div class="footer">
              Terima kasih telah berbelanja<br>
              Vault Anda telah dipercayakan kepada kami
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'cancelled': return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
      case 'refund_requested': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'refunded': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      default: return 'text-gray-500 bg-white/[0.03] border-white/[0.08]'
    }
  }

  const displayLabel = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'refund_requested': return 'refund request'
      case 'refunded': return 'refunded'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Orders</title><meta name="description" content="Your order history" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-8 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Transaction History</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">{orders.length} total transactions</p>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 bg-blue-600/10 rounded-2xl animate-ping" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-black uppercase tracking-tight">No Signals Detected</p>
              <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-2">Your transaction history will appear here</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">ID Pesanan</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Game</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Jml</th>
                      <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Tanggal</th>
                      <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Harga</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const statusColor = getStatusStyle(order.status)
                      return (
                        <tr key={order.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                          <td className="py-4 px-5 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                            #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                </svg>
                              </div>
                              <p className="text-[10px] font-black uppercase truncate max-w-[120px] leading-none">{order.games?.title || 'Unknown'}</p>
                              {order.is_giveaway && (
                                <span className="px-1.5 py-0.5 rounded text-[6px] font-black border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 uppercase tracking-wider leading-none">Giveaway</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center text-[10px] font-bold text-gray-400">1</td>
                          <td className="py-4 px-5 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-4 px-5 text-right text-[10px] font-black text-purple-400 whitespace-nowrap">—</td>
                          <td className="py-4 px-5 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black border uppercase tracking-wider ${statusColor}`}>
                              {displayLabel(order.status)}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => cetakStruk(order)}
                                className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[7px] font-black uppercase tracking-wider transition-all whitespace-nowrap">
                                Cetak
                              </button>
                              {(order.status === 'pending' || order.status === 'approved') && !order.is_giveaway && (
                                <button onClick={() => openRefundModal(order)}
                                  className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 transition-all whitespace-nowrap">
                                  Refund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-white/[0.04]">
                {orders.map(order => {
                  const statusColor = getStatusStyle(order.status)
                  return (
                    <div key={order.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase leading-tight">{order.games?.title || 'Unknown'}</p>
                            <p className="text-[7px] text-gray-600 font-mono uppercase tracking-tighter">#GV-{order.id?.split('-')?.[0]?.toUpperCase()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[7px] font-black border uppercase tracking-wider ${statusColor}`}>
                          {displayLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500">
                        <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => cetakStruk(order)}
                            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[7px] font-black uppercase tracking-wider transition-all">
                            Cetak
                          </button>
                          {(order.status === 'pending' || order.status === 'approved') && !order.is_giveaway && (
                            <button onClick={() => openRefundModal(order)}
                              className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 transition-all">
                              Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {showRefundModal && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4" onClick={() => { if (!refunding) setShowRefundModal(null) }}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          <div className="relative max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Refund</h3>
                <button onClick={() => { if (!refunding) { setShowRefundModal(null); setRefundReason('') } }} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mb-2">{showRefundModal.games?.title}</p>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={4}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-purple-500/40 transition-all text-white placeholder:text-gray-700 resize-none"
                placeholder="Alasan refund..." />
              <button onClick={() => requestRefund(showRefundModal)} disabled={refunding || !refundReason.trim()}
                className="w-full mt-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 text-[10px] tracking-widest uppercase disabled:opacity-50">
                {refunding ? 'Mengirim...' : 'Ajukan Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
