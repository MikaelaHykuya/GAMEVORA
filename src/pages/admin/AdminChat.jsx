export default function AdminChat({ chatUsers, selectedChat, setSelectedChat, chatMessages, chatInput, setChatInput, sendChatReply, loadChatMessages }) {
  return (
    <div className="relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 overflow-hidden shadow-2xl shadow-black group">
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 transition-colors duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 transition-colors duration-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Support Chat</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Layanan Bantuan Pelanggan</p>
          </div>
        </div>
        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{chatUsers.length} Obrolan Aktif</span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
        {/* Sidebar: Inbox List */}
        <div className="md:col-span-4 lg:col-span-4 bg-[#0A0A0C]/60 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] p-5 flex flex-col h-full shadow-inner">
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inbox Pesan</h3>
            {chatUsers.filter(u => u.unread > 0).length > 0 && (
              <span className="text-[9px] px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg font-black">{chatUsers.filter(u => u.unread > 0).length} Baru</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
            {chatUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <svg className="w-10 h-10 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest text-center">Belum ada obrolan</p>
              </div>
            ) : (
              chatUsers.map(u => (
                <button key={u.user_id} onClick={() => loadChatMessages(u.user_id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                    selectedChat === u.user_id
                      ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                      : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.1]'
                  }`}>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center text-[12px] font-black uppercase shrink-0 border border-white/10 text-white shadow-inner">
                        {u.name?.charAt(0) || '?'}
                      </div>
                      {u.unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-[#0A0A0C] shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                          {u.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[11px] font-black uppercase truncate ${selectedChat === u.user_id ? 'text-white' : 'text-gray-300'}`}>
                          {u.name || u.user_id.slice(0, 8)}
                        </span>
                        <span className="text-[8px] text-gray-500 shrink-0 font-bold tracking-wider">
                          {u.lastTime ? new Date(u.lastTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                      <div className={`text-[10px] truncate font-medium ${u.unread > 0 ? 'text-white' : 'text-gray-500'}`}>
                        {u.lastMessage}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="md:col-span-8 lg:col-span-8 bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] flex flex-col h-full shadow-2xl shadow-black relative overflow-hidden">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 relative z-10">
              <div className="w-20 h-20 mb-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl" />
                <svg className="w-10 h-10 text-gray-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.2em]">Pilih obrolan untuk membalas</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-5 lg:p-6 border-b border-white/[0.08] flex items-center gap-4 bg-white/[0.01] relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-[14px] font-black uppercase border border-white/10 text-white shadow-inner">
                  {chatUsers.find(u => u.user_id === selectedChat)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-black uppercase text-white tracking-wider">
                    {chatUsers.find(u => u.user_id === selectedChat)?.name || selectedChat.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-green-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online via ID
                  </p>
                </div>
              </div>
              
              {/* Messages Area */}
              <div id="chat-messages-container" className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-4 custom-scrollbar relative z-10">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] lg:max-w-[75%] p-4 text-[11px] font-medium leading-relaxed shadow-lg ${
                      msg.is_admin_reply
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-[20px] rounded-tl-sm shadow-purple-600/20'
                        : 'bg-[#15151A] text-gray-200 border border-white/[0.06] rounded-[20px] rounded-tr-sm shadow-black/50'
                    }`}>
                      <div className={`text-[8px] opacity-70 font-black uppercase tracking-widest mb-1.5 ${msg.is_admin_reply ? 'text-white' : 'text-purple-400'}`}>
                        {msg.is_admin_reply ? 'GameVora Support' : msg.sender_name}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                      <div className="text-[8px] mt-2 opacity-50 text-right font-bold tracking-wider">
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-5 lg:p-6 border-t border-white/[0.08] bg-[#0A0A0C]/90 relative z-10">
                <div className="flex gap-3">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatReply()}
                    placeholder="Ketik balasan Anda di sini..."
                    className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-2xl px-6 py-4 text-xs outline-none text-white font-medium placeholder:text-gray-600 focus:border-purple-500/40 focus:bg-white/[0.04] transition-all shadow-inner" />
                  <button onClick={sendChatReply} disabled={!chatInput.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 rounded-2xl text-[10px] text-white font-black uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Kirim
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
