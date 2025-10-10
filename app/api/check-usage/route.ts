import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use the optimized view for better performance
    const { data: userData, error: userError } = await supabase
      .from('user_profile_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if free appeal should be reset (monthly)
    const now = new Date();
    const lastReset = new Date(userData.last_free_appeal_reset);
    const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                       now.getFullYear() !== lastReset.getFullYear();

    let updates: Record<string, unknown> = {};
    if (shouldReset) {
      updates = {
        free_appeals_used: 0,
        last_free_appeal_reset: now.toISOString()
      };
    }

    // Update if needed using the optimized function
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        // Update local data
        Object.assign(userData, updates);
      }
    }

    return NextResponse.json({
      vehicleReg: userData.vehicle_registration,
      totalAppeals: userData.total_appeals_created,
      freeAppealsUsed: userData.free_appeals_used,
      paidAppealsUsed: userData.paid_appeals_used,
      hasFreeAppeal: userData.has_free_appeal,
      stripeCustomerId: userData.stripe_customer_id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email
    });

  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
  }
}

