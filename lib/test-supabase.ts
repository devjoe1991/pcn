import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    // Test the connection by trying to read from the waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful!')
    console.log('Current waitlist entries:', data)
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

export async function addToWaitlist(email: string) {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert([{ email }])
      .select()
    
    if (error) {
      console.error('Error adding to waitlist:', error)
      return { success: false, error }
    }
    
    console.log('Successfully added to waitlist:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error adding to waitlist:', error)
    return { success: false, error }
  }
}
