import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      appealContent, 
      numberPlate, 
      ticketValue, 
      isFreeAppeal,
      imageUrl 
    } = await request.json();
    
    if (!userId || !appealContent || !numberPlate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Create appeal record
    const { data: appealData, error: appealError } = await supabase
      .from('appeals')
      .insert({
        user_id: userId,
        number_plate: numberPlate.toUpperCase(),
        appeal_content: appealContent,
        ticket_value: ticketValue || 0,
        is_free_appeal: isFreeAppeal,
        image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (appealError) {
      return NextResponse.json({ error: 'Failed to create appeal record' }, { status: 500 });
    }

    // Calculate updates for user statistics
    const updates: Record<string, unknown> = {
      total_appeals: userData.total_appeals + 1,
      pending_appeals: userData.pending_appeals + 1,
      total_ticket_value: userData.total_ticket_value + (ticketValue || 0)
    };

    if (isFreeAppeal) {
      updates.free_appeals_used = userData.free_appeals_used + 1;
    } else {
      updates.paid_appeals_used = userData.paid_appeals_used + 1;
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user statistics' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appeal created successfully',
      appealId: appealData.id,
      appealData: {
        totalAppeals: updates.total_appeals,
        pendingAppeals: updates.pending_appeals,
        isFreeAppeal
      }
    });

  } catch (error) {
    console.error('Appeal creation error:', error);
    return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
  }
}

