import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Test the connection by trying to read from the waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful!',
      data: data 
    });
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Connection failed' 
    }, { status: 500 });
  }
}
