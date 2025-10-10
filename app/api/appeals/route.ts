import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - Retrieve user appeals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get appeals from user_profiles table
    // In a full implementation, you'd have a separate appeals table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        pcn_number,
        pcn_date,
        pcn_location,
        pcn_contravention,
        pcn_amount,
        pcn_council,
        appeal_status,
        appeal_submission_date,
        appeal_response_date,
        appeal_letter_content,
        appeal_grounds,
        compliance_issues_found,
        success_probability,
        ai_analysis_notes,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching appeals:', error);
      return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
    }

    // Convert profile data to appeals array
    const appeals = [];
    
    if (profile.pcn_number) {
      appeals.push({
        id: `appeal-${profile.pcn_number}`,
        user_id: userId,
        appeal_content: profile.ai_analysis_notes || 'PCN appeal created',
        number_plate: profile.pcn_number,
        ticket_value: profile.pcn_amount || 0,
        status: profile.appeal_status || 'draft',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        appeal_letter_content: profile.appeal_letter_content,
        success_probability: profile.success_probability,
        compliance_issues_found: profile.compliance_issues_found || []
      });
    }

    return NextResponse.json({ appeals });
  } catch (error) {
    console.error('Appeals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new appeal
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      appealContent,
      numberPlate,
      ticketValue,
      isFreeAppeal = true
    } = await request.json();

    if (!userId || !appealContent) {
      return NextResponse.json({ error: 'User ID and appeal content required' }, { status: 400 });
    }

    // Get current user data first
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('total_appeals_created, free_appeals_used, paid_appeals_used')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Update user profile with appeal information
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        pcn_number: numberPlate,
        pcn_amount: ticketValue,
        appeal_status: 'draft',
        ai_analysis_notes: appealContent,
        total_appeals_created: userData.total_appeals_created + 1,
        free_appeals_used: isFreeAppeal ? userData.free_appeals_used + 1 : userData.free_appeals_used,
        paid_appeals_used: !isFreeAppeal ? userData.paid_appeals_used + 1 : userData.paid_appeals_used,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error creating appeal:', error);
      return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      appeal: data,
      message: 'Appeal created successfully' 
    });

  } catch (error) {
    console.error('Create appeal error:', error);
    return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
  }
}