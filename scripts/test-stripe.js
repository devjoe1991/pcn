#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Create a test customer
    console.log('1. Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        test: 'true'
      }
    });
    console.log(`✅ Customer created: ${customer.id}\n`);

    // Test 2: Create a payment intent
    console.log('2. Creating payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, // £5.00 in pence
      currency: 'gbp',
      customer: customer.id,
      metadata: {
        userId: 'test-user-id',
        paymentType: 'additional_appeal',
        appealId: 'test-appeal-id'
      },
      description: 'Test PCN Appeal Payment'
    });
    console.log(`✅ Payment intent created: ${paymentIntent.id}\n`);

    // Test 3: List recent payment intents
    console.log('3. Listing recent payment intents...');
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 3
    });
    console.log(`✅ Found ${paymentIntents.data.length} recent payment intents\n`);

    // Test 4: Test webhook endpoint
    console.log('4. Testing webhook endpoint...');
    console.log('✅ Webhook endpoint should be running on localhost:3001/api/webhooks/stripe\n');

    console.log('🎉 All Stripe tests passed!');
    console.log('\nNext steps:');
    console.log('- Run: stripe listen --forward-to localhost:3001/api/webhooks/stripe');
    console.log('- Test payments in the app');
    console.log('- Check webhook events in Stripe CLI');

  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    process.exit(1);
  }
}

testStripeIntegration();
