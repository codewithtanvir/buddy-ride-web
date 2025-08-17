-- Database function to optimize chat queries
-- This function gets all rides where a user is involved (either as owner or has messaged)

CREATE OR REPLACE FUNCTION get_user_chats(user_id UUID)
RETURNS TABLE (
  id UUID,
  from_location TEXT,
  to_location TEXT,
  ride_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  profiles JSONB,
  last_message JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_rides AS (
    -- Get rides owned by the user
    SELECT DISTINCT r.id, r.from_location, r.to_location, r.ride_time, r.notes, r.created_at, r.user_id
    FROM rides r
    WHERE r.user_id = get_user_chats.user_id
    
    UNION
    
    -- Get rides where user has sent messages
    SELECT DISTINCT r.id, r.from_location, r.to_location, r.ride_time, r.notes, r.created_at, r.user_id
    FROM rides r
    INNER JOIN messages m ON r.id = m.ride_id
    WHERE m.sender_id = get_user_chats.user_id
  ),
  rides_with_profiles AS (
    SELECT 
      ur.*,
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'student_id', p.student_id,
        'department', p.department,
        'gender', p.gender,
        'created_at', p.created_at
      ) as profile_data
    FROM user_rides ur
    LEFT JOIN profiles p ON ur.user_id = p.id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (m.ride_id)
      m.ride_id,
      jsonb_build_object(
        'content', m.content,
        'created_at', m.created_at,
        'sender_name', p.name
      ) as message_data
    FROM messages m
    LEFT JOIN profiles p ON m.sender_id = p.id
    WHERE m.ride_id IN (SELECT ur.id FROM user_rides ur)
    ORDER BY m.ride_id, m.created_at DESC
  )
  SELECT 
    rwp.id,
    rwp.from_location,
    rwp.to_location,
    rwp.ride_time,
    rwp.notes,
    rwp.created_at,
    rwp.user_id,
    rwp.profile_data,
    COALESCE(lm.message_data, NULL) as last_message
  FROM rides_with_profiles rwp
  LEFT JOIN latest_messages lm ON rwp.id = lm.ride_id
  ORDER BY 
    CASE 
      WHEN lm.message_data->>'created_at' IS NOT NULL 
      THEN (lm.message_data->>'created_at')::timestamptz
      ELSE rwp.created_at
    END DESC;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_ride_id_created_at ON messages(ride_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_chats(UUID) TO authenticated;
