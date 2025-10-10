import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// POST - Create or update payment record
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      stripePaymentIntentId,
      stripeChargeId,
      amount,
      currency = 'gbp',
      status,
      paymentMethod,
      description,
      metadata = {}
    } = await request.json();

    if (!userId || !stripePaymentIntentId || !amount || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, stripePaymentIntentId, amount, status' 
      }, { status: 400 });
    }

    // Get user's stripe_customer_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_payment_intent_id: stripePaymentIntentId,
        stripe_charge_id: stripeChargeId,
        amount: amount,
        currency: currency,
        status: status,
        payment_method: paymentMethod,
        description: description,
        metadata: metadata
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Payment record created successfully' 
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update payment status
export async function PUT(request: NextRequest) {
  try {
    const {
      stripePaymentIntentId,
      status,
      stripeChargeId,
      metadata = {}
    } = await request.json();

    if (!stripePaymentIntentId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: stripePaymentIntentId, status' 
      }, { status: 400 });
    }

    // Update payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: status,
        stripe_charge_id: stripeChargeId,
        metadata: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Payment updated successfully' 
    });

  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Retrieve user payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments });

  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

