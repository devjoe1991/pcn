import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if free appeal should be reset (monthly)
    const now = new Date();
    const lastReset = new Date(userData.last_free_appeal_reset);
    const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                       now.getFullYear() !== lastReset.getFullYear();

    let updates: any = {};
    if (shouldReset) {
      updates = {
        free_appeals_used: 0,
        last_free_appeal_reset: now.toISOString()
      };
    }

    // Update if needed
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      // Update local data
      Object.assign(userData, updates);
    }

    // Calculate if user has free appeal available
    const hasFreeAppeal = userData.free_appeals_used < 1;

    return NextResponse.json({
      vehicleReg: userData.vehicle_reg,
      totalAppeals: userData.total_appeals,
      successfulAppeals: userData.successful_appeals,
      unsuccessfulAppeals: userData.unsuccessful_appeals,
      pendingAppeals: userData.pending_appeals,
      totalTicketValue: userData.total_ticket_value,
      totalSavings: userData.total_savings,
      freeAppealsUsed: userData.free_appeals_used,
      paidAppealsUsed: userData.paid_appeals_used,
      hasFreeAppeal
    });

  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
  }
}

