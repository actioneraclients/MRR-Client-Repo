-- RPC function to delete a group event, bypassing RLS
-- This function runs with SECURITY DEFINER to ensure consistent deletion

CREATE OR REPLACE FUNCTION delete_group_event(p_event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM group_events WHERE id = p_event_id;
END;
$$;

-- Grant execute permission to authenticated users
-- Authorization is handled in the server action before calling this function
GRANT EXECUTE ON FUNCTION delete_group_event(UUID) TO authenticated;
