import { supabase } from '@lib/supabase'
import { useToast } from '../../contexts/ToastContext'

export default function AdminMaintenance({ maintenance, maintenanceMessage, localMaintenanceMsg, setLocalMaintenanceMsg, toggleMaintenance, setConfirm, logAdminAction }) {
  const { showToast } = useToast()

  return (
    <div className="relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 max-w-2xl overflow-hidden shadow-2xl shadow-black group">
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 transition-colors duration-500 ${
        maintenance ? 'bg-yellow-500/10' : 'bg-green-500/10'
      }`} />
      
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">System Control</p>
          <h2 className="text-xl font-black tracking-tight text-white">Maintenance Mode</h2>
        </div>
        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 shadow-lg ${
          maintenance
            ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 shadow-yellow-500/10'
            : 'text-green-400 border-green-500/30 bg-green-500/10 shadow-green-500/10'
        }`}>
          {maintenance ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="relative z-10 flex items-center justify-between mb-8 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl">
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-200">Site Access</h3>
          <p className="text-[9px] text-gray-500 mt-1.5 font-bold tracking-widest">
            Saat aktif, hanya admin yang bisa mengakses website.
          </p>
        </div>
        <button
          onClick={async () => {
            if (maintenance) {
              showToast('Menonaktifkan maintenance & menerjemahkan log...', 'info')
              const { error } = await toggleMaintenance(false, '')
              
              if (error) {
                showToast('Gagal: ' + error.message, 'error')
                return
              }

              let autoMsg = '- Perbaikan bug dan peningkatan sistem.'
              try {
                const res = await fetch('https://api.github.com/repos/MikaelaHykuya/GAMEVORA/commits?per_page=5')
                if (res.ok) {
                  const commits = await res.json()
                  
                  // Menerjemahkan setiap pesan commit ke Bahasa Indonesia
                  const translatedCommits = await Promise.all(commits.map(async (c) => {
                    let msg = c.commit.message.split('\n')[0] // Ambil baris pertama saja agar rapi
                    try {
                      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(msg)}`
                      const transRes = await fetch(url)
                      const transData = await transRes.json()
                      if (transData && transData[0]) {
                        msg = transData[0].map(item => item[0]).join('')
                      }
                    } catch (err) {
                      console.error('Translate failed for:', msg)
                    }
                    return `- ${msg}`
                  }))
                  
                  autoMsg = translatedCommits.join('\n')
                }
              } catch (e) {
                console.error('Fetch commits failed', e)
              }

              logAdminAction('disable_maintenance', 'settings', 'maintenance', { changelog: autoMsg })
              
              const finalMsg = `@everyone\n\n**Vault Online - Changelog:**\n${autoMsg}`
              supabase.functions.invoke('send-discord', {
                body: { title: '✅ Maintenance Selesai', message: finalMsg, type: 'maintenance_done' }
              }).catch(e => console.error('Discord report failed:', e))
              
              showToast('Maintenance dimatikan & changelog dikirim ke Discord!', 'success')
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
                      body: { title: '🔧 Maintenance Aktif', message: `@everyone\n\n${msg}`, type: 'maintenance' }
                    }).catch(e => console.error('Discord maintenance report failed:', e))
                  }
                }
              }
            })
          }}
          className={`relative w-16 h-8 rounded-full transition-all duration-300 active-scale shadow-inner ${
            maintenance
              ? 'bg-yellow-500/30 border border-yellow-500/40'
              : 'bg-green-500/20 border border-green-500/30'
          }`}
        >
          <div className={`absolute top-1 w-6 h-6 rounded-full shadow-lg transition-all duration-300 ${
            maintenance
              ? 'left-[34px] bg-yellow-400 shadow-yellow-500/50'
              : 'left-1 bg-green-400 shadow-green-500/50'
          }`} />
        </button>
      </div>

      {maintenance && (
        <div className="relative z-10 space-y-4 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Pesan Maintenance</label>
            <input type="text" value={localMaintenanceMsg} onChange={e => setLocalMaintenanceMsg(e.target.value)}
              placeholder="Kami sedang melakukan pemeliharaan..."
              className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 focus:bg-white/[0.02] transition-all shadow-inner" />
          </div>
          <button onClick={async () => {
              const { error } = await toggleMaintenance(true, localMaintenanceMsg)
              if (error) showToast('Gagal update: ' + error.message, 'error')
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 border border-purple-500/50">
            Update Pesan
          </button>
        </div>
      )}

      <div className="relative z-10 p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1">Peringatan Akses</p>
            <p className="text-[9px] text-gray-400 leading-relaxed font-bold tracking-wide">
              Saat maintenance aktif, semua pengguna non-admin akan melihat halaman maintenance dan tidak bisa mengakses fitur apapun.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
