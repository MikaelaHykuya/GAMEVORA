import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const { user, profile } = useAuth()
  const { addToast } = useToast()
  
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      fetchWalletData()
      
      const channel = supabase
        .channel('wallet_updates')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}`
        }, (payload) => {
          if (payload.new && payload.new.gvr_balance !== undefined) {
            setBalance(payload.new.gvr_balance)
          }
        })
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}`
        }, () => {
          fetchWalletData()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } else {
      setBalance(0)
      setTransactions([])
      setLoading(false)
    }
  }, [user, profile])

  async function fetchWalletData() {
    setLoading(true)
    try {
      // Get Balance from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('gvr_balance')
        .eq('id', user.id)
        .single()
        
      if (profileData && !profileError) {
        setBalance(profileData.gvr_balance || 0)
      }

      // Get Transactions
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (txData && !txError) {
        setTransactions(txData)
      }
    } catch (err) {
      console.error("Error fetching wallet data:", err)
    }
    setLoading(false)
  }

  async function requestTopUp(amount, proofUrl) {
    const { error } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        type: 'top_up',
        description: 'Manual Top-Up Request',
        status: 'pending',
        proof_url: proofUrl
      })
      
    if (error) {
      addToast({ title: 'Top-Up Gagal', message: error.message, type: 'error' })
      return { error }
    }
    addToast({ title: 'Request Berhasil', message: 'Request Top-Up sedang diproses oleh admin.', type: 'success' })
    fetchWalletData()
    return { success: true }
  }

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      loading,
      fetchWalletData,
      requestTopUp
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => useContext(WalletContext)
