export default function AdminChat({ chatUsers, selectedChat, setSelectedChat, chatMessages, chatInput, setChatInput, sendChatReply, loadChatMessages }) {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase tracking-tight">Support Chat</h2>
        <span className="text-[10px] text-purple-400 font-black bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
          {chatUsers.length} conversations
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1 bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 max-h-[550px] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Inbox</h3>
            {chatUsers.filter(u => u.unread > 0).length > 0 && (
              <span className="text-[8px] text-purple-400 font-black">{chatUsers.filter(u => u.unread > 0).length} new</span>
            )}
          </div>
          {chatUsers.length === 0 ? (
            <p className="text-gray-600 text-[10px] font-black uppercase italic text-center py-10">No conversations</p>
          ) : (
            <div className="space-y-1">
              {chatUsers.map(u => (
                <button key={u.user_id} onClick={() => loadChatMessages(u.user_id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all duration-300 ${
                    selectedChat === u.user_id
                      ? 'bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/25'
                      : 'hover:bg-zinc-800/60 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase shrink-0 border border-purple-400/20">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase truncate">{u.name || u.user_id.slice(0, 8)}</span>
                        <span className="text-[7px] text-gray-600 shrink-0">{u.lastTime ? new Date(u.lastTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-[8px] text-gray-600 truncate">{u.lastMessage}</span>
                        {u.unread > 0 && (
                          <span className="shrink-0 bg-purple-600 text-white text-[7px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full">{u.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-2 bg-zinc-900/60 border border-white/[0.04] rounded-2xl flex flex-col h-[550px]">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-[10px] font-black uppercase italic">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                Pilih user untuk memulai chat
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/40 to-purple-500/40 flex items-center justify-center text-[11px] font-black uppercase border border-purple-400/20">
                  {chatUsers.find(u => u.user_id === selectedChat)?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase">{chatUsers.find(u => u.user_id === selectedChat)?.name || selectedChat.slice(0, 8)}</p>
                </div>
              </div>
              <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 text-[10px] font-bold leading-relaxed ${
                      msg.is_admin_reply
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl rounded-bl-[4px]'
                        : 'bg-zinc-800/80 rounded-2xl rounded-br-[4px]'
                    }`}>
                      <div className="text-[7px] opacity-50 uppercase tracking-widest mb-1">
                        {msg.is_admin_reply ? 'Admin' : msg.sender_name}
                      </div>
                      {msg.message}
                      <div className="text-[7px] mt-1.5 opacity-40">
                        {new Date(msg.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/[0.04] flex gap-3">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatReply()}
                  placeholder="Ketik balasan..."
                  className="flex-1 bg-zinc-800/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-[11px] outline-none text-white font-bold placeholder:text-gray-700 focus:border-purple-500/30 transition-all" />
                <button onClick={sendChatReply}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300">
                  Kirim
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
