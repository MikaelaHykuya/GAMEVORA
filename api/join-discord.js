export default async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { providerToken, discordUserId } = req.body

    if (!providerToken || !discordUserId) {
      return res.status(400).json({ error: 'Missing providerToken or discordUserId' })
    }

    const botToken = process.env.DISCORD_BOT_TOKEN
    const guildId = process.env.DISCORD_GUILD_ID

    if (!botToken || !guildId) {
      return res.status(500).json({ error: 'Discord Bot Token or Guild ID is not configured in Vercel Environment Variables.' })
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
      return res.status(response.status).json({ error: `Failed to join discord server: ${response.statusText}` })
    }


    return res.status(200).json({ success: true, status: response.status })
  } catch (error) {
    console.error('Server Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
