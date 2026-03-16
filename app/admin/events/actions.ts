"use server"

import { createClient } from "@/lib/supabase/server"

type EventFilters = {
  search?: string
  eventType?: string
  status?: "published" | "unpublished"
}

export async function getAdminCommunityEvents(filters?: EventFilters) {
  const supabase = await createClient()

  let query = supabase
    .from("community_events")
    .select(`
      id,
      title,
      event_type,
      short_description,
      start_date,
      end_date,
      time_label,
      cost_label,
      event_url,
      header_image_url,
      is_published,
      created_at,
      profiles!community_events_created_by_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`)
  }

  if (filters?.eventType) {
    query = query.eq("event_type", filters.eventType)
  }

  if (filters?.status === "published") {
    query = query.eq("is_published", true)
  }

  if (filters?.status === "unpublished") {
    query = query.eq("is_published", false)
  }

  const { data, error } = await query

  if (error) {
    console.error("Admin events fetch error:", error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    event_type: row.event_type,
    short_description: row.short_description,
    start_date: row.start_date,
    end_date: row.end_date,
    time_label: row.time_label,
    cost_label: row.cost_label,
    event_url: row.event_url,
    header_image_url: row.header_image_url,
    is_published: row.is_published,
    organizer: row.profiles
      ? {
          id: row.profiles.id,
          full_name: row.profiles.full_name,
          email: row.profiles.email,
          avatar_url: row.profiles.avatar_url,
        }
      : null,
  }))
}

export async function toggleCommunityEventPublished(eventId: string, publish: boolean) {
  const supabase = await createClient()

  const { error } = await supabase.from("community_events").update({ is_published: publish }).eq("id", eventId)

  if (error) {
    console.error("Toggle published error:", error)
    return { success: false }
  }

  return { success: true }
}
