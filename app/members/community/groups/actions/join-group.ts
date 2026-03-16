"use server"

import { createClient } from "@/lib/supabase/server"

export async function joinGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "You must be logged in to join a group" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("[joinGroup] failed to fetch profile:", profileError)
    return { success: false, error: "Profile not found" }
  }

  // Check if user is already a member
  const { data: existingMembership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single()

  if (existingMembership) {
    return { success: false, error: "You are already a member of this group" }
  }

  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  })

  if (insertError) {
    console.error("[joinGroup] insert error:", insertError)
    return { success: false, error: insertError.message }
  }

  return { success: true }
}
