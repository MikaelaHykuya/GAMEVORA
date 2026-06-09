import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vzdwtudduxjvxjniyexm.supabase.co'
const SUPABASE_KEY = 'sb_publishable_uUcmakLhdV3owqSTRPyc8Q_MyMINIcm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
