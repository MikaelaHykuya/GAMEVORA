export default function AdminUpload({ editId, form, setForm, downloadLinks, setDownloadLinks, handleZipUpload, uploadingZip, saveGame }) {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 md:p-10 max-w-3xl mx-auto">
      <h2 className="text-xl font-black uppercase tracking-tight mb-8">{editId ? `Update: ${form.title}` : 'Upload Game Baru'}</h2>
      <div className="space-y-10">
        {[
          { title: 'Basic Information', color: 'purple', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', fields: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Steam App ID</label>
                <input type="text" placeholder="e.g. 730" value={form.steam_appid} onChange={e => setForm({ ...form, steam_appid: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Genre</label>
                <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                  {['Action', 'RPG', 'Horror', 'Adventure', 'Simulation'].map(g => <option key={g} className="bg-zinc-900">{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Connectivity</label>
                  <select value={form.connectivity_type} onChange={e => setForm({ ...form, connectivity_type: e.target.value })}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                    <option className="bg-zinc-900">Online</option>
                    <option className="bg-zinc-900">Offline</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Release</label>
                  <select value={form.release_type} onChange={e => setForm({ ...form, release_type: e.target.value })}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white cursor-pointer focus:border-purple-500/40 transition-all">
                    <option className="bg-zinc-900">instant</option>
                    <option className="bg-zinc-900">scheduled</option>
                  </select>
                </div>
              </div>
            </div>
          )},
          { title: 'Pricing & Promotion', color: 'green', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', fields: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Price (Rp)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Discount Price (Rp)</label>
                <input type="number" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Sold Count</label>
                <input type="number" value={form.sold_count} onChange={e => setForm({ ...form, sold_count: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all w-max">
                  <input type="checkbox" checked={form.is_trending} onChange={e => setForm({ ...form, is_trending: e.target.checked })}
                    className="accent-red-500 w-4 h-4" />
                  <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Mark as Trending</span>
                </label>
              </div>
            </div>
          )},
          { title: 'Media & Content', color: 'blue', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', fields: (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Thumbnail URL</label>
                <input type="url" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="4"
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Manual Guide</label>
                <textarea value={form.manual_guide} onChange={e => setForm({ ...form, manual_guide: e.target.value })} rows="3"
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all" />
              </div>
            </div>
          )},
          { title: 'Downloads & Integration', color: 'yellow', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', fields: (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-purple-400 tracking-widest flex justify-between">
                  <span>VoraTools License File (.ZIP)</span>
                  {uploadingZip && <span className="text-yellow-400 animate-pulse">Uploading...</span>}
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input type="url" placeholder="Direct link to ZIP..." value={form.voratools_link} onChange={e => setForm({ ...form, voratools_link: e.target.value })}
                    className="flex-1 bg-zinc-900/60 border border-purple-500/30 rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500 transition-all" />
                  <label className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/40 text-purple-400 rounded-2xl px-6 py-3.5 cursor-pointer transition-all flex items-center justify-center shrink-0">
                    <input type="file" accept=".zip" className="hidden" onChange={handleZipUpload} disabled={uploadingZip} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload ZIP</span>
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Download Links</label>
                  <button type="button" onClick={() => setDownloadLinks([...downloadLinks, { id: Date.now(), label: '', url: '', icon: 'box' }])}
                    className="text-[9px] font-black text-purple-400 hover:text-white transition tracking-widest uppercase">
                    + Tambah Link
                  </button>
                </div>
                <div className="space-y-3">
                  {downloadLinks.map((link, i) => (
                    <div key={link.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center bg-zinc-900/20 border border-white/[0.04] rounded-2xl p-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        <input type="text" placeholder="Label (contoh: Game File, Patch)" value={link.label}
                          onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], label: e.target.value }; setDownloadLinks(next) }}
                          className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                        <input type="url" placeholder="URL download..." value={link.url}
                          onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], url: e.target.value }; setDownloadLinks(next) }}
                          className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
                        <select value={link.icon}
                          onChange={e => { const next = [...downloadLinks]; next[i] = { ...next[i], icon: e.target.value }; setDownloadLinks(next) }}
                          className="bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all appearance-none cursor-pointer">
                          <option value="box">📦 Box</option>
                          <option value="fix">🛠️ Fix / Update</option>
                          <option value="guide">📖 Guide</option>
                          <option value="tool">🔧 Tool</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => setDownloadLinks(downloadLinks.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300 transition p-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {downloadLinks.length === 0 && (
                    <p className="text-[10px] text-gray-600 text-center py-4 uppercase tracking-wider">Belum ada link download. Klik "+ Tambah Link" untuk menambahkan.</p>
                  )}
                </div>
              </div>
            </div>
          )},
        ].map((section, i) => (
          <div key={i} className="border-t border-white/[0.05] pt-8 first:border-0 first:pt-0">
            <p className={`text-[10px] font-black text-${section.color}-400 uppercase tracking-[0.3em] mb-5 flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full bg-${section.color}-500 animate-pulse`}></span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
              </svg>
              {section.title}
            </p>
            {section.fields}
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-white/[0.05]">
        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
          System Specifications
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Minimum', key: 'min' },
            { label: 'Recommended', key: 'rec' },
          ].map(spec => (
            <div key={spec.key} className="space-y-3">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{spec.label}</p>
              {['os', 'cpu', 'ram', 'gpu'].map(s => (
                <input key={s} type="text" placeholder={s.toUpperCase()} value={form[`${spec.key}_${s}`]} onChange={e => setForm({ ...form, [`${spec.key}_${s}`]: e.target.value })}
                  className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveGame} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-8 active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
        {editId ? 'Apply Updates' : 'Upload Game'}
      </button>
    </div>
  )
}
