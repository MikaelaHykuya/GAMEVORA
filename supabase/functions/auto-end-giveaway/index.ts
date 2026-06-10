// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function fisherYatesShuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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

    // Find all expired active giveaways
    const { data: expiredGiveaways, error: fetchErr } = await supabaseClient
      .from('giveaways')
      .select('*, games(title)')
      .eq('status', 'active')
      .lt('ends_at', new Date().toISOString())

    if (fetchErr) throw new Error('Failed to fetch expired giveaways: ' + fetchErr.message)

    const results = []

    for (const giveaway of expiredGiveaways || []) {
      try {
        const { data: entries, error: eErr } = await supabaseClient
          .from('giveaway_entries')
          .select('*, profiles(username, full_name)')
          .eq('giveaway_id', giveaway.id)

        if (eErr) throw new Error('Failed to fetch entries')

        const count = Math.min(giveaway.winner_count, entries?.length || 0)
        const shuffled = fisherYatesShuffle(entries || [])
        const winners = shuffled.slice(0, count)

        if (winners.length > 0) {
          const libraryInserts = winners.map(winner => ({
            user_id: winner.user_id,
            game_id: giveaway.game_id,
            status: 'approved',
            is_giveaway: true,
          }))

          const { error: libErr } = await supabaseClient.from('library').upsert(
            libraryInserts,
            { onConflict: 'user_id, game_id' }
          )
          if (libErr) throw new Error('Library upsert failed: ' + libErr.message)

          const notificationInserts = winners.map(winner => ({
            user_id: winner.user_id,
            title: '🎉 You Won a Giveaway!',
            message: `Selamat! Kamu memenangkan ${giveaway.games?.title || 'Game'} dari giveaway "${giveaway.title}". Game sudah masuk ke Vault kamu!`,
          }))

          const { error: notifErr } = await supabaseClient.from('vault_notifications').insert(notificationInserts)
          if (notifErr) throw new Error('Notification insert failed: ' + notifErr.message)
        }

        const { error: updateErr } = await supabaseClient.from('giveaways').update({ status: 'ended' }).eq('id', giveaway.id)
        if (updateErr) throw new Error('Status update failed: ' + updateErr.message)

        // Send Discord notification
        const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_GIVEAWAY')
        if (webhookUrl && winners.length > 0) {
          const winnerNames = winners.map(w => w.profiles?.username || w.profiles?.full_name || 'User').join(', ')
          const discordPayload = {
            content: '@everyone',
            allowed_mentions: { parse: ['everyone'] },
            embeds: [{
              title: '🎉 GIVEAWAY WINNER! 🎉',
              description: [
                `**${giveaway.title}**`,
                '',
                `🏆 **Winner${winners.length > 1 ? 's' : ''}:** ${winnerNames}`,
                `🎮 **Game:** ${giveaway.games?.title || 'Unknown'}`,
                `👥 **Total Peserta:** ${entries?.length || 0}`,
                '',
                '✅ Giveaway berakhir otomatis. Game sudah masuk ke library pemenang!',
              ].join('\n'),
              color: 0xFFD700,
              timestamp: new Date().toISOString(),
              footer: { text: 'GAMEVORA Auto-End' },
            }],
          }

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload),
          })
        }

        results.push({ id: giveaway.id, title: giveaway.title, winners: count })
      } catch (err) {
        results.push({ id: giveaway.id, title: giveaway.title, error: err.message })
      }
    }

    return new Response(JSON.stringify({ success: true, ended: results.length, results }), {
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
