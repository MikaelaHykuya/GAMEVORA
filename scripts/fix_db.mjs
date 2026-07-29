import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://vzdwtudduxjvxjniyexm.supabase.co', 'sb_publishable_uUcmakLhdV3owqSTRPyc8Q_MyMINIcm')

async function run() {
  const { data, error } = await supabase
    .from('games')
    .update({ voratools_link: 'https://vzdwtudduxjvxjniyexm.supabase.co/storage/v1/object/public/game-assets/voratools/GV-CALL_OF_DUTY_MODERN_WARFARE.zip' })
    .eq('steam_appid', '2000950')
    .select()

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('Success:', data)
  }
}
run()
