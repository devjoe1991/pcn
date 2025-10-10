import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, appealId, status, ticketValue } = await request.json();
    
    if (!userId || !appealId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update appeal status
    const { error: appealError } = await supabase
      .from('appeals')
      .update({ status })
      .eq('id', appealId)
      .eq('user_id', userId);

    if (appealError) {
      return NextResponse.json({ error: 'Failed to update appeal status' }, { status: 500 });
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate updates based on status change
    const updates: Record<string, unknown> = {};
    
    if (status === 'successful') {
      updates.successful_appeals = userData.successful_appeals + 1;
      updates.pending_appeals = userData.pending_appeals - 1;
      updates.total_savings = userData.total_savings + (ticketValue || 0);
    } else if (status === 'unsuccessful') {
      updates.unsuccessful_appeals = userData.unsuccessful_appeals + 1;
      updates.pending_appeals = userData.pending_appeals - 1;
    }

    // Update user statistics
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update user statistics' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appeal status updated successfully',
      updatedStats: updates
    });

  } catch (error) {
    console.error('Appeal status update error:', error);
    return NextResponse.json({ error: 'Failed to update appeal status' }, { status: 500 });
  }
}

