import { supabase } from './supabase';
import { UserProfileService } from './user-profile';

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (data.user && !error) {
    try {
      // Create Stripe customer via API call
      const response = await fetch('/api/create-stripe-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: email,
          name: fullName
        }),
      });

      if (response.ok) {
        const { customerId } = await response.json();
        // Update user profile with Stripe customer ID
        await UserProfileService.updateField(data.user.id, 'stripe_customer_id', customerId);
      }
    } catch (stripeError) {
      console.error('Failed to create Stripe customer:', stripeError);
    }
  }
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export const getStripeCustomerId = async (userId: string) => {
  const { data } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  
  return data?.stripe_customer_id;
};
