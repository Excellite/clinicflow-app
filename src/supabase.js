import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lwxscvysrxwnryqankft.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VFlrG8cCFKpdD2UMHq0dSw_ijhyVV35'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)