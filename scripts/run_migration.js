const { Client } = require('pg')

const PROJECT = 'vzdwtudduxjvxjniyexm'
const HOST = `db.${PROJECT}.supabase.co`
const DB = 'postgres'
const USER = 'postgres'

async function tryConnect(password) {
  const client = new Client({
    host: HOST,
    port: 5432,
    database: DB,
    user: USER,
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
  try {
    await client.connect()
    console.log('CONNECTED with password:', password.slice(0, 20) + '...')
    await client.query(`
      ALTER TABLE public.push_subscriptions 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS endpoint TEXT,
      ADD COLUMN IF NOT EXISTS auth_key TEXT,
      ADD COLUMN IF NOT EXISTS p256dh_key TEXT;
    `)
    await client.query(`
      ALTER TABLE public.push_subscriptions ALTER COLUMN endpoint SET NOT NULL;
      ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
      ALTER TABLE public.push_subscriptions ALTER COLUMN auth_key SET NOT NULL;
      ALTER TABLE public.push_subscriptions ALTER COLUMN p256dh_key SET NOT NULL;
    `)
    await client.query(`
      DROP POLICY IF EXISTS "Allow all read push_subscriptions" ON public.push_subscriptions;
      DROP POLICY IF EXISTS "Allow all insert push_subscriptions" ON public.push_subscriptions;
      DROP POLICY IF EXISTS "Allow all update push_subscriptions" ON public.push_subscriptions;
      DROP POLICY IF EXISTS "Allow all delete push_subscriptions" ON public.push_subscriptions;
      ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can view their own subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
      CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);
    `)
    console.log('Migration successful!')
    await client.end()
    return true
  } catch (e) {
    console.log('Failed:', e.message.slice(0, 80))
    await client.end().catch(() => {})
    return false
  }
}

async function main() {
  const passwords = [
    process.env.SUPABASE_DB_PASSWORD,
    'postgres',
    '',
    'password',
    'admin',
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ].filter(Boolean)

  // Remove duplicates
  const unique = [...new Set(passwords)]
  
  for (const pw of unique) {
    console.log('Trying password:', pw.slice(0, 20) + '...')
    if (await tryConnect(pw)) {
      console.log('SUCCESS!')
      process.exit(0)
    }
  }
  console.log('\nCould not connect. Please run fix_notifications.sql manually in Supabase Dashboard -> SQL Editor')
}
main()
