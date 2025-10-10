import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - Retrieve user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Use the optimized function for better performance
    const { data: profile, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: profile[0] || null });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      firstName,
      lastName,
      phone,
      vehicleRegistration,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      pcnNumber,
      pcnDate,
      pcnLocation,
      pcnContravention,
      pcnAmount,
      pcnCouncil,
      pcnIssuingAuthority,
      appealStatus,
      appealLetterContent,
      appealGrounds,
      complianceIssues,
      successProbability,
      aiAnalysisNotes,
      customFields,
      notes
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    // Add fields if provided
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (vehicleRegistration !== undefined) updateData.vehicle_registration = vehicleRegistration;
    if (vehicleMake !== undefined) updateData.vehicle_make = vehicleMake;
    if (vehicleModel !== undefined) updateData.vehicle_model = vehicleModel;
    if (vehicleColor !== undefined) updateData.vehicle_color = vehicleColor;
    if (vehicleYear !== undefined) updateData.vehicle_year = vehicleYear;
    if (pcnNumber !== undefined) updateData.pcn_number = pcnNumber;
    if (pcnDate !== undefined) updateData.pcn_date = pcnDate;
    if (pcnLocation !== undefined) updateData.pcn_location = pcnLocation;
    if (pcnContravention !== undefined) updateData.pcn_contravention = pcnContravention;
    if (pcnAmount !== undefined) updateData.pcn_amount = pcnAmount;
    if (pcnCouncil !== undefined) updateData.pcn_council = pcnCouncil;
    if (pcnIssuingAuthority !== undefined) updateData.pcn_issuing_authority = pcnIssuingAuthority;
    if (appealStatus !== undefined) updateData.appeal_status = appealStatus;
    if (appealLetterContent !== undefined) updateData.appeal_letter_content = appealLetterContent;
    if (appealGrounds !== undefined) updateData.appeal_grounds = appealGrounds;
    if (complianceIssues !== undefined) updateData.compliance_issues_found = complianceIssues;
    if (successProbability !== undefined) updateData.success_probability = successProbability;
    if (aiAnalysisNotes !== undefined) updateData.ai_analysis_notes = aiAnalysisNotes;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (notes !== undefined) updateData.notes = notes;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...updateData
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      profile: result,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// PUT - Update specific fields
export async function PUT(request: NextRequest) {
  try {
    const { userId, field, value } = await request.json();

    if (!userId || !field) {
      return NextResponse.json({ error: 'User ID and field required' }, { status: 400 });
    }

    // Use the optimized function for better performance and security
    const { data, error } = await supabase
      .rpc('update_user_profile', { 
        p_user_id: userId, 
        p_field: field, 
        p_value: value 
      });

    if (error) {
      console.error('Error updating profile field:', error);
      return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      updated: data,
      message: `${field} updated successfully` 
    });

  } catch (error) {
    console.error('Profile field update error:', error);
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
  }
}

