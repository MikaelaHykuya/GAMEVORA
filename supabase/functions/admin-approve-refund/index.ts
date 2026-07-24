
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
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
    
    if (!selected_game_id || selected_game_id === 'none') {
      throw new Error(`Replacement game is required. Received: ${selected_game_id}`)
    }

    // 1. Update original record to 'refunded'
    const { error: refundError } = await supabaseClient.from('library').update({ 
      status: 'refunded',
      refund_reason: `[Refund Disetujui] Diganti dengan: ${replacement_game_title || 'Game Baru'}`
    }).eq('id', order_id)
    
    if (refundError) throw new Error('Failed to update original record: ' + refundError.message)

    // 2. Check if user already has the replacement game
    const { data: existingGame } = await supabaseClient.from('library')
      .select('id')
      .eq('user_id', user_id)
      .eq('game_id', selected_game_id)
      .single()

    if (existingGame) {
      // Update existing record to 'approved'
      const { error: upsertError } = await supabaseClient.from('library').update({
        status: 'approved',
        purchase_date: new Date().toISOString(),
        is_giveaway: true
      }).eq('id', existingGame.id)
      if (upsertError) throw new Error('Failed to update replacement game: ' + upsertError.message)
    } else {
      // Insert new record
      const { error: insertError } = await supabaseClient.from('library').insert({
        user_id: user_id,
        game_id: selected_game_id,
        status: 'approved',
        purchase_date: new Date().toISOString(),
        is_giveaway: true
      })
      if (insertError) throw new Error('Failed to insert replacement game: ' + insertError.message)
    }
    
    if (replacement_game_title) {
      message += ` Sebagai gantinya, game "${replacement_game_title}" telah ditambahkan ke Vault Anda!`
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
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
