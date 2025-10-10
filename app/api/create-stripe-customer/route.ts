import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json();
    
    if (!userId || !email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        supabase_user_id: userId
      }
    });

    // Update user profile with Stripe customer ID
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile with Stripe customer ID:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      success: true,
      customerId: customer.id 
    });

  } catch (error) {
    console.error('Stripe customer creation error:', error);
    return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 });
  }
}

