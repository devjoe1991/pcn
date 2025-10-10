-- Create comprehensive user profiles table with Stripe integration
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Personal Information
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Vehicle Information
  vehicle_registration TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_year INTEGER,
  
  -- PCN/Ticket Information
  pcn_number TEXT,
  pcn_date DATE,
  pcn_location TEXT,
  pcn_contravention TEXT,
  pcn_amount INTEGER, -- Amount in pence
  pcn_council TEXT,
  pcn_issuing_authority TEXT,
  
  -- Appeal Information
  appeal_status TEXT DEFAULT 'draft' CHECK (appeal_status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  appeal_submission_date DATE,
  appeal_response_date DATE,
  appeal_letter_content TEXT,
  appeal_grounds TEXT[],
  appeal_evidence_urls TEXT[],
  
  -- Compliance Analysis
  compliance_issues_found TEXT[],
  success_probability INTEGER CHECK (success_probability >= 0 AND success_probability <= 100),
  ai_analysis_notes TEXT,
  
  -- Financial Tracking
  total_appeals_created INTEGER DEFAULT 0,
  successful_appeals INTEGER DEFAULT 0,
  unsuccessful_appeals INTEGER DEFAULT 0,
  total_savings INTEGER DEFAULT 0, -- Total savings in pence
  total_fees_paid INTEGER DEFAULT 0, -- Total fees paid in pence
  
  -- Usage Tracking
  free_appeals_used INTEGER DEFAULT 0,
  paid_appeals_used INTEGER DEFAULT 0,
  last_free_appeal_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Communication
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
  communication_preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  
  -- Additional Data
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'cancelled', 'past_due')),
  stripe_payment_method_id TEXT,
  
  -- Analytics
  total_sessions INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referral_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_vehicle_registration ON user_profiles(vehicle_registration);
CREATE INDEX idx_user_profiles_pcn_number ON user_profiles(pcn_number);
CREATE INDEX idx_user_profiles_appeal_status ON user_profiles(appeal_status);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
CREATE INDEX idx_user_profiles_last_activity ON user_profiles(last_activity);
CREATE INDEX idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name'),
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_score INTEGER := 0;
BEGIN
  -- Calculate completion percentage based on filled fields
  IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN completion_score := completion_score + 10; END IF;
  IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN completion_score := completion_score + 10; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN completion_score := completion_score + 10; END IF;
  IF NEW.vehicle_registration IS NOT NULL AND NEW.vehicle_registration != '' THEN completion_score := completion_score + 15; END IF;
  IF NEW.vehicle_make IS NOT NULL AND NEW.vehicle_make != '' THEN completion_score := completion_score + 5; END IF;
  IF NEW.vehicle_model IS NOT NULL AND NEW.vehicle_model != '' THEN completion_score := completion_score + 5; END IF;
  IF NEW.pcn_number IS NOT NULL AND NEW.pcn_number != '' THEN completion_score := completion_score + 15; END IF;
  IF NEW.pcn_location IS NOT NULL AND NEW.pcn_location != '' THEN completion_score := completion_score + 10; END IF;
  IF NEW.appeal_letter_content IS NOT NULL AND NEW.appeal_letter_content != '' THEN completion_score := completion_score + 20; END IF;
  
  NEW.profile_completion_percentage := LEAST(completion_score, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update completion percentage
CREATE TRIGGER update_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Create payments table for Stripe integration
CREATE TABLE payments (
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
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Create updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all profiles (for admin functions)
CREATE POLICY "Service role can access all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for payments
-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all payments
CREATE POLICY "Service role can access all payments" ON payments
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
CREATE TRIGGER link_payment_to_profile_trigger
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
CREATE TRIGGER update_profile_on_payment_success_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_on_payment_success();

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;

-- Create view for user profile with payment summary
CREATE VIEW user_profile_with_payments AS
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

