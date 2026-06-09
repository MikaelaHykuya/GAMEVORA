import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const ADMIN_EMAILS = [
  'raflyalfazari622@gmail.com',
  'fadhilakbar050@gmail.com',
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchProfile(user.id, user.user_metadata, user.email)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id, session.user.user_metadata, session.user.email)
      else { setProfile(null) }
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password')
      }
    })

    return () => subscription?.unsubscribe()
  }, [navigate])

  useEffect(() => {
    fetchMaintenanceMode()

    const channel = supabase
      .channel('settings_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'settings', filter: 'key=eq.maintenance_mode',
      }, () => fetchMaintenanceMode())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchMaintenanceMode() {
    setMaintenanceLoading(true)
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle()

    if (data) {
      try {
        const parsed = JSON.parse(data.value)
        setMaintenance(parsed.active === true)
        setMaintenanceMessage(parsed.message || '')
      } catch {
        setMaintenance(data.value === 'true')
        setMaintenanceMessage('')
      }
    }
    setMaintenanceLoading(false)
  }

  async function toggleMaintenance(active, message = '') {
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'maintenance_mode', value: JSON.stringify({ active, message }) },
        { onConflict: 'key' })

    if (!error) {
      setMaintenance(active)
      setMaintenanceMessage(message)
    }
    return { error }
  }

  async function fetchProfile(uid, meta, userEmail) {
    const email = meta?.email || userEmail
    let { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()

    if (email) {
      const { data: matches } = await supabase.from('profiles').select('*').eq('email', email)
      if (matches && matches.length > 0) {
        const byEmail = matches.reduce((best, p) => {
          if (!best) return p
          const score = (p.role === 'admin' ? 10 : 0) + (p.full_name ? 5 : 0) + (p.updated_at ? 3 : 0) + (p.avatar_url ? 2 : 0)
          const bestScore = (best.role === 'admin' ? 10 : 0) + (best.full_name ? 5 : 0) + (best.updated_at ? 3 : 0) + (best.avatar_url ? 2 : 0)
          return score > bestScore ? p : best
        }, null)
        if (!data || byEmail.id !== uid) {
          const oldId = byEmail.id
          if (oldId !== uid) {
            await supabase.from('profiles').update({ id: uid }).eq('id', oldId)
            await supabase.from('library').update({ user_id: uid }).eq('user_id', oldId)
            await supabase.from('cart').update({ user_id: uid }).eq('user_id', oldId)
            await supabase.from('chats').update({ user_id: uid }).eq('user_id', oldId)
            await supabase.from('giveaway_entries').update({ user_id: uid }).eq('user_id', oldId)
            await supabase.from('giveaways').update({ created_by: uid }).eq('created_by', oldId)
          }
          await supabase.from('profiles').delete().eq('email', email).neq('id', uid)
          data = { ...byEmail, id: uid }
        }
      }
    }
    if (data) {
      setProfile({ ...data, full_name: data.full_name || meta?.full_name || '', username: data.username || meta?.username || '' })
    } else if (meta?.full_name) {
      setProfile({ id: uid, full_name: meta.full_name, username: meta.username, role: meta.role })
    }
  }

  const isAdmin = profile?.role === 'admin' || (user && ADMIN_EMAILS.includes(user.email))

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin,
      maintenance, maintenanceMessage, maintenanceLoading,
      toggleMaintenance,
      refreshProfile: () => user && fetchProfile(user.id, user?.user_metadata, user.email),
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
