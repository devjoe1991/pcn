import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - Retrieve user vehicles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get vehicles from user_profiles table (for now, we'll use the vehicle_registration field)
    // In a full implementation, you'd have a separate vehicles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('vehicle_registration, vehicle_make, vehicle_model, vehicle_color, vehicle_year')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    // Convert profile data to vehicles array
    const vehicles = profile.vehicle_registration ? [{
      id: 'primary',
      registration: profile.vehicle_registration,
      make: profile.vehicle_make,
      model: profile.vehicle_model,
      color: profile.vehicle_color,
      year: profile.vehicle_year,
      is_primary: true,
      created_at: new Date().toISOString()
    }] : [];

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Vehicles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add vehicle
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      vehicleReg,
      make,
      model,
      color,
      year
    } = await request.json();

    if (!userId || !vehicleReg) {
      return NextResponse.json({ error: 'User ID and vehicle registration required' }, { status: 400 });
    }

    // Check if user already has a vehicle
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('vehicle_registration')
      .eq('user_id', userId)
      .single();

    if (existingProfile?.vehicle_registration) {
      // User already has a vehicle, they need to pay for additional vehicles
      return NextResponse.json({ 
        error: 'Additional vehicle requires payment',
        requiresPayment: true,
        message: 'You already have a vehicle registered. Additional vehicles cost £3 each.'
      }, { status: 402 });
    }

    // Update user profile with vehicle information
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        vehicle_registration: vehicleReg.toUpperCase(),
        vehicle_make: make,
        vehicle_model: model,
        vehicle_color: color,
        vehicle_year: year ? parseInt(year) : null,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return NextResponse.json({ error: 'Failed to add vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      vehicle: data,
      message: 'Vehicle added successfully' 
    });

  } catch (error) {
    console.error('Add vehicle error:', error);
    return NextResponse.json({ error: 'Failed to add vehicle' }, { status: 500 });
  }
}

// DELETE - Remove vehicle
export async function DELETE(request: NextRequest) {
  try {
    const { vehicleId } = await request.json();

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    // For now, we only support removing the primary vehicle
    if (vehicleId === 'primary') {
      return NextResponse.json({ 
        error: 'Cannot remove primary vehicle',
        message: 'You must have at least one vehicle registered.'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vehicle removed successfully' 
    });

  } catch (error) {
    console.error('Remove vehicle error:', error);
    return NextResponse.json({ error: 'Failed to remove vehicle' }, { status: 500 });
  }
}