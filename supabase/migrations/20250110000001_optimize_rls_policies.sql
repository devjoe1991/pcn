-- Optimize RLS policies for better performance
-- Drop existing policies and recreate with optimized conditions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON user_profiles;

-- Create optimized RLS policies with better performance
-- Use more efficient conditions and add indexes for RLS

-- Optimized SELECT policy - users can only see their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Optimized UPDATE policy - users can only update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Optimized INSERT policy - users can only insert their own profile
CREATE POLICY "user_profiles_insert_own" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Service role can access all profiles (for admin functions)
CREATE POLICY "user_profiles_service_role" ON user_profiles
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Create additional indexes to optimize RLS performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_uid ON user_profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lookup ON user_profiles(email) WHERE email IS NOT NULL;

-- Optimize the handle_new_user function for better performance
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use a more efficient insert with conflict handling
  INSERT INTO public.user_profiles (user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name'),
    NEW.raw_user_meta_data->>'last_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user profile efficiently
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  vehicle_registration TEXT,
  free_appeals_used INTEGER,
  paid_appeals_used INTEGER,
  total_appeals_created INTEGER,
  last_free_appeal_reset TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and requesting their own data
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.first_name,
    up.last_name,
    up.email,
    up.vehicle_registration,
    up.free_appeals_used,
    up.paid_appeals_used,
    up.total_appeals_created,
    up.last_free_appeal_reset,
    up.stripe_customer_id,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$;

-- Create function to update user profile efficiently
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id UUID,
  p_field TEXT,
  p_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated and updating their own data
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Use dynamic SQL for field updates
  EXECUTE format('UPDATE user_profiles SET %I = $1, updated_at = NOW(), last_activity = NOW() WHERE user_id = $2', p_field)
  USING p_value, p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- Create view for efficient user profile access
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
  user_id,
  first_name,
  last_name,
  email,
  vehicle_registration,
  free_appeals_used,
  paid_appeals_used,
  total_appeals_created,
  last_free_appeal_reset,
  stripe_customer_id,
  created_at,
  updated_at,
  last_activity,
  -- Calculate if user has free appeal available
  CASE 
    WHEN free_appeals_used = 0 THEN true
    WHEN last_free_appeal_reset IS NULL THEN true
    WHEN EXTRACT(EPOCH FROM (NOW() - last_free_appeal_reset)) > 2592000 THEN true -- 30 days
    ELSE false
  END as has_free_appeal
FROM user_profiles;

-- Grant permissions on the view
GRANT SELECT ON user_profile_summary TO authenticated;
GRANT SELECT ON user_profile_summary TO service_role;

-- Create RLS policy for the view
ALTER VIEW user_profile_summary SET (security_invoker = true);

-- Add comments for documentation
COMMENT ON POLICY "user_profiles_select_own" ON user_profiles IS 'Users can only view their own profile data';
COMMENT ON POLICY "user_profiles_update_own" ON user_profiles IS 'Users can only update their own profile data';
COMMENT ON POLICY "user_profiles_insert_own" ON user_profiles IS 'Users can only insert their own profile data';
COMMENT ON POLICY "user_profiles_service_role" ON user_profiles IS 'Service role has full access for admin functions';
COMMENT ON FUNCTION public.get_user_profile(UUID) IS 'Efficiently get user profile with RLS checks';
COMMENT ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) IS 'Efficiently update user profile field with RLS checks';
COMMENT ON VIEW user_profile_summary IS 'Optimized view for user profile data with calculated fields';
