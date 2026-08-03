import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { providerToken, discordUserId } = await req.json()

    if (!providerToken || !discordUserId) {
      throw new Error('Missing providerToken or discordUserId')
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
    const guildId = Deno.env.get('DISCORD_GUILD_ID')

    if (!botToken || !guildId) {
      throw new Error('Discord Bot Token or Guild ID is not configured in Edge Function environment variables.')
    }

    // Call Discord API to add user to guild
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: providerToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Discord API Error:', errorData)
      throw new Error(`Failed to join discord server: ${response.status} ${response.statusText}`)
    }

    // Response could be 201 Created (joined) or 204 No Content (already joined)
    return new Response(
      JSON.stringify({ success: true, status: response.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
