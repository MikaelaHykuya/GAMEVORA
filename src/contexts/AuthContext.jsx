import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@lib/supabase'

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean)

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
      if (user) {
        fetchProfile(user.id, user.user_metadata, user.email)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata, session.user.email)
      }
      else { setProfile(null) }
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password')
      }

      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'discord') {
        const discordUserId = session.user.identities?.find(i => i.provider === 'discord')?.id
        if (session.provider_token && discordUserId) {
          fetch('/api/join-discord', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              providerToken: session.provider_token,
              discordUserId: discordUserId
            })
          }).then(res => res.json()).then(data => {
            if (data.error) console.error('Silent Discord Join Failed:', data.error)
            else console.log('Silently joined Discord successfully!')
            
            // Pop up the Discord App using the invite link
            window.location.href = 'https://discord.gg/7j2YNcstu'
            
          }).catch(error => console.error('Failed to call Discord API:', error))
        }
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
    const { data: mergedProfile, error } = await supabase.rpc('merge_my_profiles')
    
    if (mergedProfile) {
      setProfile({ 
        ...mergedProfile, 
        full_name: mergedProfile.full_name || meta?.full_name || '', 
        username: mergedProfile.username || meta?.username || '' 
      })
    } else {
      // Profile tidak ada di database, mari kita buat!
      const safeUsername = meta?.username || (userEmail?.split('@')[0] ? `${userEmail.split('@')[0]}_${uid.substring(0,4)}` : `user_${uid.substring(0,6)}`)
      const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
        id: uid,
        full_name: meta?.full_name || userEmail?.split('@')[0] || 'User',
        username: safeUsername,
        role: meta?.role || 'user'
      }, { onConflict: 'id' }).select().single()

      if (insertError) {
        console.error('Failed to auto-create profile:', insertError)
      }

      if (newProfile) {
        setProfile(newProfile)
      } else {
        // Fallback jika gagal insert (misal karena jaringan lambat)
        setProfile({ id: uid, full_name: meta?.full_name, username: meta?.username, role: meta?.role })
      }
    }
  }

  const isAdmin = profile?.role === 'admin' || (user && ADMIN_EMAILS.includes(user.email))

  const ensureAffiliateCode = async () => {
    if (!user) return null
    if (profile?.affiliate_code) return profile.affiliate_code
    return null
  }

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
      signOut, ensureAffiliateCode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
