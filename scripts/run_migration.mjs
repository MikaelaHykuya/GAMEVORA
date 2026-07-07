import { createClient } from '../node_modules/@supabase/supabase-js/dist/module/index.js'

const supabase = createClient(
  'https://vzdwtudduxjvxjniyexm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3Mzg2NTY4MDAsCiAgImV4cCI6IDE4OTY1MDA0MDAKfQ.0kToamOOMw3Z5Qhtq0VExAYPS4Ef_DAis5vOSY9FdmA'
)

const { error } = await supabase.rpc('exec_sql', {
  sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';"
})

if (error) {
  // try raw query as fallback
  const { error: e2 } = await supabase.from('_sql').insert({ query: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';" }).single()
  console.log('Fallback error:', e2?.message)
}
console.log('Done:', error ? error.message : 'OK')
