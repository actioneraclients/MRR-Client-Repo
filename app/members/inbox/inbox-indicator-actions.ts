"use server"

import { createClient } from "@/lib/supabase/server"

export async function getInboxUnreadIndicator(): Promise<{ hasUnread: boolean }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasUnread: false }

  const { data: updates, error: updatesErr } = await supabase
    .from("site_updates")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(50)

  if (updatesErr || !updates || updates.length === 0) {
    return { hasUnread: false }
  }

  const updateIds = updates.map((u) => u.id)

  const { data: reads, error: readsErr } = await supabase
    .from("site_update_reads")
    .select("site_update_id")
    .eq("user_id", user.id)
    .in("site_update_id", updateIds)

  if (readsErr) return { hasUnread: false }

  const readSet = new Set((reads || []).map((r) => r.site_update_id))

  const hasUnread = updateIds.some((id) => !readSet.has(id))

  return { hasUnread }
}
