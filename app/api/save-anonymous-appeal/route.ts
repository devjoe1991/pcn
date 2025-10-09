import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, appealContent, numberPlate, ticketValue } = await request.json();
    
    if (!userId || !appealContent) {
      return NextResponse.json({ error: 'User ID and appeal content required' }, { status: 400 });
    }

    // Create the appeal in the database
    const { data: appeal, error: appealError } = await supabase
      .from('appeals')
      .insert({
        user_id: userId,
        content: appealContent,
        number_plate: numberPlate || null,
        ticket_value: ticketValue || 0,
        status: 'draft',
        is_free_appeal: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (appealError) {
      console.error('Error creating appeal:', appealError);
      return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
    }

    // Update user's free appeals used count
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        free_appeals_used: 1,
        total_appeals: 1,
        pending_appeals: 1
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      appealId: appeal.id,
      message: 'Appeal saved successfully!' 
    });

  } catch (error) {
    console.error('Save anonymous appeal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
