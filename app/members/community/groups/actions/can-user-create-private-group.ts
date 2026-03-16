"use server"

import { createClient } from "@/lib/supabase/server"

export async function canUserCreatePrivateGroup(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // Get user's plan_id from profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan_id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.plan_id) return false

  // Check enabled plan permission
  const { data: perm, error: permError } = await supabase
    .from("plan_permissions")
    .select("id")
    .eq("plan_id", profile.plan_id)
    .eq("permission_key", "create_private_group")
    .eq("enabled", true)
    .maybeSingle()

  if (permError) return false

  return !!perm
}
