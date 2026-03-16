-- SECURITY DEFINER function to return masterclass attendee counts
-- Bypasses RLS so authenticated users can see total counts (no user identities exposed)
create or replace function public.get_masterclass_attendee_counts()
returns table(masterclass_id uuid, attendee_count bigint)
language sql
security definer
set search_path = public
as $$
  select masterclass_id, count(*)::bigint as attendee_count
  from public.masterclass_attendees
  group by masterclass_id
$$;

-- Grant execute to authenticated users
grant execute on function public.get_masterclass_attendee_counts() to authenticated;
