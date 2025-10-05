import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iyienwgzwtdslinbqyze.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aWVud2d6d3Rkc2xpbmJxeXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDc1MzcsImV4cCI6MjA3NTEyMzUzN30.prpZGWhnZM_YzSwhC0Ce51S7Is9Mh8KS0VKF-3_FIEs'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// For server-side operations (if needed)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aWVud2d6d3Rkc2xpbmJxeXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU0NzUzNywiZXhwIjoyMDc1MTIzNTM3fQ.cYJh8BBXCfrWVignzMKKHOVfZPRfzYJm41WTRJwlcvI'

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
