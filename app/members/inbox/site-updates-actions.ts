"use server"

import { createClient } from "@/lib/supabase/server"

export type SiteUpdate = {
  id: string
  title: string
  body: string
  created_at: string
  admin_name: string
  admin_avatar_url: string | null
  is_read: boolean
}

export async function getSiteUpdates(): Promise<SiteUpdate[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. Fetch site updates ONLY
  const { data: updates } = await supabase
    .from("site_updates")
    .select("id, title, body, created_at, created_by")
    .order("created_at", { ascending: false })

  if (!updates || updates.length === 0) return []

  // 2. Fetch admin profiles
  const adminIds = [...new Set(updates.map((u) => u.created_by))]
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", adminIds)

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  // 3. Fetch read states for THIS USER
  const { data: reads } = await supabase.from("site_update_reads").select("site_update_id").eq("user_id", user.id)

  const readSet = new Set(reads?.map((r) => r.site_update_id) ?? [])

  // 4. Return flat, UI-ready data
  return updates.map((update) => {
    const admin = profileMap.get(update.created_by)

    return {
      id: update.id,
      title: update.title,
      body: update.body,
      created_at: update.created_at,
      admin_name: admin?.full_name ?? "Admin",
      admin_avatar_url: admin?.avatar_url ?? null,
      is_read: readSet.has(update.id),
    }
  })
}

export async function markSiteUpdateRead(siteUpdateId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  await supabase
    .from("site_update_reads")
    .insert({
      site_update_id: siteUpdateId,
      user_id: user.id,
    })
    .select()
    .maybeSingle()
}

export async function markAllSiteUpdatesRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get all unread updates for this user
  const { data: updates } = await supabase.from("site_updates").select("id")

  if (!updates || updates.length === 0) return

  // Get already read updates
  const { data: readUpdates } = await supabase.from("site_update_reads").select("site_update_id").eq("user_id", user.id)

  const readIds = new Set(readUpdates?.map((r) => r.site_update_id) ?? [])
  const unreadIds = updates.filter((u) => !readIds.has(u.id)).map((u) => u.id)

  if (unreadIds.length === 0) return

  // Insert read records for all unread updates
  await supabase.from("site_update_reads").insert(
    unreadIds.map((id) => ({
      site_update_id: id,
      user_id: user.id,
    })),
  )
}
