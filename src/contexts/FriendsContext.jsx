import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FriendsContext = createContext(null)

export function FriendsProvider({ children }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchFriends = useCallback(async () => {
    if (!user) { setFriends([]); setPendingRequests([]); setSentRequests([]); return }
    setLoading(true)

    const { data } = await supabase
      .from('friendships')
      .select('*, sender:sender_id(id, full_name, username, avatar_url), receiver:receiver_id(id, full_name, username, avatar_url)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const accepted = data.filter(f => f.status === 'accepted').map(f => {
        const friend = f.sender_id === user.id ? f.receiver : f.sender
        return { ...friend, friendshipId: f.id, since: f.created_at }
      })
      const pending = data.filter(f => f.status === 'pending' && f.receiver_id === user.id).map(f => ({
        ...f.sender, friendshipId: f.id, requestId: f.id, created_at: f.created_at,
      }))
      const sent = data.filter(f => f.status === 'pending' && f.sender_id === user.id).map(f => ({
        ...f.receiver, friendshipId: f.id, requestId: f.id, created_at: f.created_at,
      }))

      setFriends(accepted)
      setPendingRequests(pending)
      setSentRequests(sent)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchFriends() }, [fetchFriends])

  const sendRequest = useCallback(async (receiverId) => {
    const { error } = await supabase.from('friendships').insert({
      sender_id: user.id, receiver_id: receiverId, status: 'pending',
    })
    if (!error) fetchFriends()
    return { error }
  }, [user, fetchFriends])

  const respondToRequest = useCallback(async (requestId, accept) => {
    const { error } = await supabase.from('friendships').update({
      status: accept ? 'accepted' : 'rejected', updated_at: new Date().toISOString(),
    }).eq('id', requestId)
    if (!error) fetchFriends()
    return { error }
  }, [fetchFriends])

  const removeFriend = useCallback(async (friendshipId) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (!error) fetchFriends()
    return { error }
  }, [fetchFriends])

  const getFriendshipStatus = useCallback((profileId) => {
    if (!user || profileId === user.id) return 'self'
    if (friends.some(f => f.id === profileId)) return 'friends'
    if (pendingRequests.some(r => r.id === profileId)) return 'pending'
    if (sentRequests.some(r => r.id === profileId)) return 'sent'
    return 'none'
  }, [user, friends, pendingRequests, sentRequests])

  return (
    <FriendsContext.Provider value={{
      friends, pendingRequests, sentRequests, loading,
      sendRequest, respondToRequest, removeFriend, getFriendshipStatus, fetchFriends,
    }}>
      {children}
    </FriendsContext.Provider>
  )
}

export const useFriends = () => useContext(FriendsContext)
