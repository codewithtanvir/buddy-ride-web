-- =====================================================
-- CRITICAL SECURITY FIXES FOR BUDDY RIDE DATABASE
-- =====================================================

-- 1. Add server-side gender compatibility validation
-- Prevent users from requesting rides from different genders

-- Create a function to check gender compatibility
CREATE OR REPLACE FUNCTION check_gender_compatibility(
  requester_id UUID,
  ride_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  requester_gender TEXT;
  ride_owner_gender TEXT;
BEGIN
  -- Get requester's gender
  SELECT gender INTO requester_gender 
  FROM profiles 
  WHERE id = requester_id;
  
  -- Get ride owner's gender
  SELECT p.gender INTO ride_owner_gender
  FROM rides r
  JOIN profiles p ON r.user_id = p.id
  WHERE r.id = ride_id;
  
  -- Both genders must exist and be the same
  IF requester_gender IS NULL OR ride_owner_gender IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN requester_gender = ride_owner_gender;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_gender_compatibility(UUID, UUID) TO authenticated;

-- Create RLS policy to prevent gender-incompatible ride requests
CREATE POLICY "Gender compatibility required for ride requests" ON ride_requests
FOR INSERT WITH CHECK (
  -- Prevent users from requesting their own rides
  requester_id != (
    SELECT user_id FROM rides WHERE id = ride_id
  )
  AND
  -- Ensure gender compatibility
  check_gender_compatibility(requester_id, ride_id)
);

-- 2. Add policy to prevent multiple requests to same ride by same user
CREATE POLICY "Prevent duplicate ride requests" ON ride_requests
FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM ride_requests 
    WHERE ride_id = NEW.ride_id 
    AND requester_id = NEW.requester_id
  )
);

-- 3. Add policy to prevent requesting expired rides
CREATE POLICY "Prevent requests to expired rides" ON ride_requests
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM rides 
    WHERE id = ride_id 
    AND ride_time > NOW()
  )
);

-- 4. Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_ride_time ON rides(ride_time);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_requester ON ride_requests(ride_id, requester_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_ride_sender ON messages(ride_id, sender_id);

-- 5. Add constraint to ensure valid gender values
ALTER TABLE profiles 
ADD CONSTRAINT check_valid_gender 
CHECK (gender IN ('male', 'female') OR gender IS NULL);

-- 6. Add constraint to ensure ride times are in the future
ALTER TABLE rides
ADD CONSTRAINT check_future_ride_time
CHECK (ride_time > created_at);

-- 7. Add constraint to limit message content length
ALTER TABLE messages
ADD CONSTRAINT check_message_length
CHECK (length(content) <= 1000 AND length(content) > 0);

-- 8. Add constraint to limit ride request message length
ALTER TABLE ride_requests
ADD CONSTRAINT check_request_message_length
CHECK (message IS NULL OR (length(message) <= 500 AND length(message) > 0));

-- 9. Create function for automatic cleanup of expired rides
CREATE OR REPLACE FUNCTION cleanup_expired_rides() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete messages for expired rides first (foreign key constraint)
  DELETE FROM messages 
  WHERE ride_id IN (
    SELECT id FROM rides 
    WHERE ride_time < NOW() - INTERVAL '24 hours'
  );
  
  -- Delete ride requests for expired rides
  DELETE FROM ride_requests 
  WHERE ride_id IN (
    SELECT id FROM rides 
    WHERE ride_time < NOW() - INTERVAL '24 hours'
  );
  
  -- Delete expired rides
  DELETE FROM rides 
  WHERE ride_time < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for admin cleanup)
GRANT EXECUTE ON FUNCTION cleanup_expired_rides() TO authenticated;

-- 10. Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 11. Create comprehensive RLS policies for profiles
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Users can read all profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 12. Enhanced ride access policies
DROP POLICY IF EXISTS "Users can read all rides" ON rides;
CREATE POLICY "Users can read all rides" ON rides
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create rides" ON rides;
CREATE POLICY "Users can create rides" ON rides
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND gender IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Users can update own rides" ON rides;
CREATE POLICY "Users can update own rides" ON rides
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own rides" ON rides;
CREATE POLICY "Users can delete own rides" ON rides
FOR DELETE USING (auth.uid() = user_id);

-- 13. Create admin role check function
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 14. Add admin override policies
CREATE POLICY "Admins can manage all data" ON ride_requests
FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage all rides" ON rides
FOR ALL USING (is_admin());

-- 15. Create rate limiting for password resets (future enhancement)
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email_time ON password_reset_attempts(email, attempted_at);

-- Function to check reset attempt rate limiting
CREATE OR REPLACE FUNCTION check_reset_rate_limit(user_email TEXT) RETURNS BOOLEAN AS $$
BEGIN
  -- Allow max 3 attempts per hour per email
  RETURN (
    SELECT COUNT(*) 
    FROM password_reset_attempts 
    WHERE email = user_email 
    AND attempted_at > NOW() - INTERVAL '1 hour'
  ) < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_reset_rate_limit(TEXT) TO authenticated;

COMMENT ON TABLE password_reset_attempts IS 'Track password reset attempts for rate limiting';
COMMENT ON FUNCTION check_gender_compatibility IS 'Validates that ride requests only happen between same gender users';
COMMENT ON FUNCTION cleanup_expired_rides IS 'Removes old rides and associated data automatically';
