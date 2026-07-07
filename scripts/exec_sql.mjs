import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vzdwtudduxjvxjniyexm.supabase.co',
  'sb_publishable_uUcmakLhdV3owqSTRPyc8Q_MyMINIcm'
)

// Try exec_sql RPC first
let { error } = await supabase.rpc('exec_sql', {
  sql_text: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';"
})

if (error && error.message.includes('Could not find the function')) {
  console.log('exec_sql RPC not available, trying pg-meta API...')
  const res = await fetch('https://vzdwtudduxjvxjniyexm.supabase.co/pg-api/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'sb_publishable_uUcmakLhdV3owqSTRPyc8Q_MyMINIcm',
      'Authorization': 'Bearer sb_publishable_uUcmakLhdV3owqSTRPyc8Q_MyMINIcm'
    },
    body: JSON.stringify({
      query: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'default';"
    })
  })
  console.log('pg-meta status:', res.status)
  const text = await res.text()
  console.log('pg-meta response:', text)
}

console.log('Done')
