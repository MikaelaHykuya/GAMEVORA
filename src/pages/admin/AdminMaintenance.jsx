import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function AdminMaintenance({ maintenance, maintenanceMessage, localMaintenanceMsg, setLocalMaintenanceMsg, toggleMaintenance, setConfirm, logAdminAction }) {
  const { showToast } = useToast()

  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Maintenance Mode</p>
        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all duration-300 ${
          maintenance
            ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
            : 'text-green-400 border-green-500/30 bg-green-500/10'
        }`}>
          {maintenance ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight">Site Status</h3>
          <p className="text-[8px] text-gray-500 mt-1 font-bold tracking-wider">
            Saat aktif, hanya admin yang bisa mengakses website
          </p>
        </div>
        <button
          onClick={() => {
            if (maintenance) {
              toggleMaintenance(false, '').then(({ error }) => {
                if (error) showToast('Gagal: ' + error.message, 'error')
                else logAdminAction('disable_maintenance', 'settings', 'maintenance')
              })
              return
            }
            setConfirm({
              title: 'Aktifkan Maintenance',
              message: 'Masukkan pesan yang akan ditampilkan ke pengguna:',
              confirmLabel: 'Aktifkan',
              variant: 'default',
              inputMode: true,
              inputPlaceholder: 'Kami sedang melakukan pemeliharaan...',
              onConfirm: async (msg) => {
                const { error } = await toggleMaintenance(true, msg)
                if (error) showToast('Gagal: ' + error.message, 'error')
                else {
                  logAdminAction('enable_maintenance', 'settings', 'maintenance', { message: msg })
                  if (msg) {
                    supabase.functions.invoke('send-discord', {
                      body: { title: '🔧 Maintenance Aktif', message: msg, type: 'maintenance' }
                    }).catch(e => console.error('Discord maintenance report failed:', e))
                  }
                }
              }
            })
          }}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 active-scale ${
            maintenance
              ? 'bg-yellow-500/30 border border-yellow-500/40'
              : 'bg-green-500/20 border border-green-500/30'
          }`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all duration-300 ${
            maintenance
              ? 'left-[30px] bg-yellow-400'
              : 'left-1 bg-green-400'
          }`} />
        </button>
      </div>

      {maintenance && (
        <div className="space-y-3 mb-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Pesan Maintenance</label>
            <input type="text" value={localMaintenanceMsg} onChange={e => setLocalMaintenanceMsg(e.target.value)}
              placeholder="Kami sedang melakukan pemeliharaan..."
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
          </div>
          <button onClick={async () => {
              const { error } = await toggleMaintenance(true, localMaintenanceMsg)
              if (error) showToast('Gagal update: ' + error.message, 'error')
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl text-[11px] tracking-[0.2em] uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
            Update Pesan
          </button>
        </div>
      )}

      <div className="p-4 bg-zinc-900/60 border border-yellow-500/10 rounded-2xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">Peringatan</p>
            <p className="text-[8px] text-gray-500 mt-1 leading-relaxed font-bold">
              Saat maintenance aktif, semua pengguna non-admin akan melihat halaman maintenance dan tidak bisa mengakses fitur apapun.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
