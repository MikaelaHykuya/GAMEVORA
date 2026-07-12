import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import webPush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Edge Function secrets.')
}

webPush.setVapidDetails(
  'mailto:admin@gamevora.com',
  VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY || ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, message, target_user_id, is_admin } = await req.json()

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    let subscriptions = []

    if (is_admin) {
      // Find all admin user IDs
      const { data: admins } = await supabaseClient.from('profiles').select('id').eq('role', 'admin')
      if (admins && admins.length > 0) {
        const adminIds = admins.map(a => a.id)
        const { data: adminSubs, error } = await supabaseClient.from('push_subscriptions').select('*').in('user_id', adminIds)
        if (error) throw error
        if (adminSubs) subscriptions = adminSubs
      }
    } else {
      let query = supabaseClient.from('push_subscriptions').select('*')
      if (target_user_id) {
        query = query.eq('user_id', target_user_id)
      }
      const { data: subs, error } = await query
      if (error) throw error
      if (subs) subscriptions = subs
    }

    if (error) throw error

    const payload = JSON.stringify({ title, message })

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key
        }
      }

      try {
        await webPush.sendNotification(pushSubscription, payload)
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Error sending push:', err)
        }
      }
    })

    await Promise.all(sendPromises)

    return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
