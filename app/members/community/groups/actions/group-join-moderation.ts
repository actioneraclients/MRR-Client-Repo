"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPendingJoinRequestsForGroup(groupId: string): Promise<
  {
    requestId: string
    userId: string
    requestedAt: string
    fullName: string | null
    avatarUrl: string | null
  }[]
> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("group_join_requests")
    .select(
      `
      id,
      user_id,
      created_at,
      profiles!group_join_requests_user_id_fkey (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("group_id", groupId)
    .eq("status", "pending")

  if (error || !data) return []

  return data.map((row) => {
    const profile = row.profiles as { full_name: string | null; avatar_url: string | null } | null
    return {
      requestId: row.id,
      userId: row.user_id,
      requestedAt: row.created_at,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    }
  })
}

export async function approveJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Fetch the join request
  const { data: request, error: fetchError } = await supabase
    .from("group_join_requests")
    .select("id, group_id, user_id")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: "Join request not found" }
  }

  // Insert user into group_members
  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: request.group_id,
    user_id: request.user_id,
    role: "member",
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  const { error: updateError } = await supabase
    .from("group_join_requests")
    .update({ status: "approved" })
    .eq("id", requestId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export async function denyJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase.from("group_join_requests").update({ status: "rejected" }).eq("id", requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
