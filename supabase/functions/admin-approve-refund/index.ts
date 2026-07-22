import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id, selected_game_id, user_id, original_game_title, replacement_game_title } = await req.json()
    
    if (!order_id || !user_id) throw new Error('Missing required parameters')

    const title = 'Refund Disetujui'
    let message = `Refund untuk ${original_game_title} telah disetujui.`
    
    if (selected_game_id && selected_game_id !== 'none') {
      const { error: updateError } = await supabaseClient.from('library').update({ 
        status: 'approved',
        game_id: selected_game_id,
        refund_reason: `[Tukar Game] Awalnya: ${original_game_title}`
      }).eq('id', order_id)
      
      if (updateError) throw new Error('Failed to update library: ' + updateError.message)
      
      if (replacement_game_title) {
        message += ` Sebagai gantinya, game "${replacement_game_title}" telah ditambahkan ke Vault Anda!`
      }
    } else {
      const { error: updateError } = await supabaseClient.from('library').update({ 
        status: 'refunded' 
      }).eq('id', order_id)
      
      if (updateError) throw new Error('Failed to update library status: ' + updateError.message)
    }

    // Insert notification
    await supabaseClient.from('vault_notifications').insert([{ user_id, title, message }])

    // Try sending web push silently
    supabaseClient.functions.invoke('send-push', { 
      body: { title, message, target_user_id: user_id } 
    }).catch(console.error)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
