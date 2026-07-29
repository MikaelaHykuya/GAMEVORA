import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vzdwtudduxjvxjniyexm.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZHd0dWRkdXhqdnhqbml5ZXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjA4ODgsImV4cCI6MjA5NjU5Njg4OH0.PdGtmWgUDWBMzukFfA_mh9WODSnmMiWWqLXx3yabVKA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
