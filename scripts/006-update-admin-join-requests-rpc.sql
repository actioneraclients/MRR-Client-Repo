-- Update the get_admin_group_join_requests function to only return pending requests
CREATE OR REPLACE FUNCTION get_admin_group_join_requests()
RETURNS TABLE (
  id uuid,
  group_id uuid,
  group_name text,
  requester_id uuid,
  status text,
  created_at timestamptz,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT
    gjr.id,
    gjr.group_id,
    g.name AS group_name,
    gjr.user_id AS requester_id,
    gjr.status,
    gjr.created_at,
    p.full_name,
    p.avatar_url
  FROM group_members gm
  INNER JOIN groups g ON g.id = gm.group_id
  INNER JOIN group_join_requests gjr ON gjr.group_id = gm.group_id
  INNER JOIN profiles p ON p.id = gjr.user_id
  WHERE gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin', 'moderator')
    AND gjr.status = 'pending'
  ORDER BY gjr.created_at DESC;
$$;
