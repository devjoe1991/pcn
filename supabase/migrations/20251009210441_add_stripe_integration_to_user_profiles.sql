-- Add Stripe integration columns to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- Create index for stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- Create payments table for Stripe integration
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT REFERENCES user_profiles(stripe_customer_id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  amount INTEGER NOT NULL, -- Amount in pence
  currency TEXT DEFAULT 'gbp',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
  payment_method TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Create updated_at trigger for payments
CREATE TRIGGER IF NOT EXISTS update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
-- Users can only see their own payments
CREATE POLICY IF NOT EXISTS "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY IF NOT EXISTS "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments
CREATE POLICY IF NOT EXISTS "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all payments
CREATE POLICY IF NOT EXISTS "Service role can access all payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to link payments to user profiles via Stripe customer ID
CREATE OR REPLACE FUNCTION link_payment_to_profile()
RETURNS TRIGGER AS $$
DECLARE
  profile_stripe_id TEXT;
BEGIN
  -- Get the stripe_customer_id from user_profiles
  SELECT stripe_customer_id INTO profile_stripe_id
  FROM user_profiles
  WHERE user_id = NEW.user_id;
  
  -- Update the payment with the stripe_customer_id from profile
  IF profile_stripe_id IS NOT NULL THEN
    NEW.stripe_customer_id := profile_stripe_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link payments to profiles
CREATE TRIGGER IF NOT EXISTS link_payment_to_profile_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION link_payment_to_profile();

-- Create function to update user profile when payment succeeds
CREATE OR REPLACE FUNCTION update_profile_on_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if payment status changed to 'succeeded'
  IF NEW.status = 'succeeded' AND (OLD.status IS NULL OR OLD.status != 'succeeded') THEN
    -- Update user profile with payment information
    UPDATE user_profiles 
    SET 
      total_fees_paid = COALESCE(total_fees_paid, 0) + NEW.amount,
      paid_appeals_used = COALESCE(paid_appeals_used, 0) + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update profile on successful payment
CREATE TRIGGER IF NOT EXISTS update_profile_on_payment_success_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_on_payment_success();

-- Grant permissions on payments table
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;

-- Create view for user profile with payment summary
CREATE OR REPLACE VIEW user_profile_with_payments AS
SELECT 
  up.*,
  COUNT(p.id) as total_payments,
  COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN 1 ELSE 0 END), 0) as successful_payments
FROM user_profiles up
LEFT JOIN payments p ON up.user_id = p.user_id
GROUP BY up.id, up.user_id, up.first_name, up.last_name, up.email, up.phone, 
         up.vehicle_registration, up.vehicle_make, up.vehicle_model, up.vehicle_color, 
         up.vehicle_year, up.pcn_number, up.pcn_date, up.pcn_location, up.pcn_contravention, 
         up.pcn_amount, up.pcn_council, up.pcn_issuing_authority, up.appeal_status, 
         up.appeal_submission_date, up.appeal_response_date, up.appeal_letter_content, 
         up.appeal_grounds, up.appeal_evidence_urls, up.compliance_issues_found, 
         up.success_probability, up.ai_analysis_notes, up.total_appeals_created, 
         up.successful_appeals, up.unsuccessful_appeals, up.total_savings, 
         up.total_fees_paid, up.free_appeals_used, up.paid_appeals_used, 
         up.last_free_appeal_reset, up.preferred_contact_method, 
         up.communication_preferences, up.created_at, up.updated_at, up.last_login, 
         up.profile_completion_percentage, up.custom_fields, up.notes, 
         up.stripe_customer_id, up.stripe_subscription_id, up.subscription_status, 
         up.stripe_payment_method_id, up.total_sessions, up.last_activity, 
         up.referral_source, up.utm_source, up.utm_medium, up.utm_campaign;

-- Grant permissions on the view
GRANT SELECT ON user_profile_with_payments TO authenticated;
GRANT SELECT ON user_profile_with_payments TO service_role;

