import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, vehicleReg } = await request.json();
    
    if (!userId || !vehicleReg) {
      return NextResponse.json({ error: 'User ID and vehicle registration required' }, { status: 400 });
    }

    // Check if user already has a vehicle registered
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('vehicle_reg')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user already has a vehicle, they need to pay to change it
    if (userData.vehicle_reg && userData.vehicle_reg !== vehicleReg) {
      return NextResponse.json({ 
        error: 'Vehicle change requires payment',
        requiresPayment: true,
        currentVehicle: userData.vehicle_reg,
        newVehicle: vehicleReg
      }, { status: 402 });
    }

    // Update vehicle registration
    const { error: updateError } = await supabase
      .from('users')
      .update({ vehicle_reg: vehicleReg.toUpperCase() })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vehicle registration updated successfully'
    });

  } catch (error) {
    console.error('Vehicle update error:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

