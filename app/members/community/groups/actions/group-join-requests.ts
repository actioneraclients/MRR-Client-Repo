"use server"

import { createClient } from "@/lib/supabase/server"

export async function requestToJoinGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: existingRequest } = await supabase
    .from("group_join_requests")
    .select("id, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .in("status", ["pending", "rejected"])
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === "rejected") {
      return { success: false, error: "Your previous request was denied. Please contact the group admin." }
    }
    // Already pending
    return { success: true }
  }

  const { error } = await supabase.from("group_join_requests").insert({
    group_id: groupId,
    user_id: user.id,
    status: "pending",
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getMyGroupJoinRequestStatuses(): Promise<{
  success: boolean
  statuses: Record<string, "pending" | "rejected">
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: true, statuses: {} }
  }

  const { data: requests } = await supabase
    .from("group_join_requests")
    .select("group_id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "rejected"])

  if (!requests) {
    return { success: true, statuses: {} }
  }

  const result: Record<string, "pending" | "rejected"> = {}
  for (const req of requests) {
    result[req.group_id] = req.status as "pending" | "rejected"
  }

  return { success: true, statuses: result }
}

export async function getGroupOwnerInfo(
  groupId: string,
): Promise<{ success: boolean; owner?: { id: string; display_name: string }; groupName?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: group } = await supabase.from("groups").select("name, created_by").eq("id", groupId).single()

  if (!group) {
    return { success: false, error: "Group not found" }
  }

  const { data: owner } = await supabase.from("profiles").select("id, display_name").eq("id", group.created_by).single()

  if (!owner) {
    return { success: false, error: "Owner not found" }
  }

  return {
    success: true,
    owner: { id: owner.id, display_name: owner.display_name || "Group Admin" },
    groupName: group.name,
  }
}
