"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateGroup({
  groupId,
  name,
  description,
  visibility,
  allow_member_posts,
  require_post_approval,
  allow_member_events,
  allow_member_invites,
}: {
  groupId: string
  name: string
  description?: string | null
  visibility: "public" | "request" | "private"
  allow_member_posts: boolean
  require_post_approval: boolean
  allow_member_events: boolean
  allow_member_invites: boolean
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from("groups")
    .update({
      name,
      description,
      visibility,
      allow_member_posts,
      require_post_approval,
      allow_member_events,
      allow_member_invites,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", groupId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
