-- Real-time Chat Fix: Ensure RLS policies allow real-time subscriptions

-- First, enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for messages table
-- Policy for users to read messages from rides they have access to
CREATE POLICY "Users can read messages from accessible rides" ON messages
FOR SELECT USING (
  -- User is the ride owner
  ride_id IN (
    SELECT id FROM rides WHERE user_id = auth.uid()
  )
  OR
  -- User has sent messages to this ride
  ride_id IN (
    SELECT DISTINCT ride_id FROM messages WHERE sender_id = auth.uid()
  )
  OR
  -- User has an accepted request for this ride
  ride_id IN (
    SELECT ride_id FROM ride_requests 
    WHERE requester_id = auth.uid() AND status = 'accepted'
  )
);

-- Policy for users to insert messages to rides they have access to
CREATE POLICY "Users can insert messages to accessible rides" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    -- User is the ride owner
    ride_id IN (
      SELECT id FROM rides WHERE user_id = auth.uid()
    )
    OR
    -- User has previously sent messages to this ride
    ride_id IN (
      SELECT DISTINCT ride_id FROM messages WHERE sender_id = auth.uid()
    )
    OR
    -- User has an accepted request for this ride
    ride_id IN (
      SELECT ride_id FROM ride_requests 
      WHERE requester_id = auth.uid() AND status = 'accepted'
    )
  )
);

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Create function to check if user can access a ride's chat
CREATE OR REPLACE FUNCTION can_access_ride_chat(ride_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is ride owner
  IF EXISTS (
    SELECT 1 FROM rides r WHERE r.id = ride_id AND r.user_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has sent messages to this ride
  IF EXISTS (
    SELECT 1 FROM messages m WHERE m.ride_id = ride_id AND m.sender_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has accepted request for this ride
  IF EXISTS (
    SELECT 1 FROM ride_requests rr 
    WHERE rr.ride_id = ride_id AND rr.requester_id = user_id AND rr.status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION can_access_ride_chat(UUID, UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_ride_id ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_id_status ON ride_requests(ride_id, status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_requester_id_status ON ride_requests(requester_id, status);
