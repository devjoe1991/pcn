import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { appealId, userId, paymentType } = await request.json();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json({ error: 'User not found or no Stripe customer ID' }, { status: 404 });
    }

    const amounts = {
      additional_appeal: 500, // £5 in pence
      vehicle_addition: 300, // £3 in pence
    };

    const amount = amounts[paymentType as keyof typeof amounts] || 500;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      customer: userData.stripe_customer_id,
      metadata: {
        appealId,
        userId,
        paymentType,
        userEmail: userData.email,
        userName: userData.full_name
      },
      description: paymentType === 'additional_appeal' 
        ? 'Additional PCN Appeal - £5' 
        : 'Vehicle Registration Change - £3'
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      customerId: userData.stripe_customer_id 
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}


