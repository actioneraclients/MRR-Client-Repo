"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function leaveGroup(groupId: string) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .select()

  if (error) {
    console.error("[leaveGroup] delete failed:", error)
    return { success: false, error: error.message }
  }

  if (!data || data.length === 0) {
    console.warn("[leaveGroup] no rows deleted")
  }

  return { success: true }
}
