"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CommunityEventListItem = {
  id: string
  title: string
  eventType: string
  startDate: string
  endDate: string | null
  timeLabel: string
  costLabel: string | null
  shortDescription: string
  headerImageUrl: string | null
  createdBy: string
  creatorName: string
  creatorAvatarUrl: string | null
}

export type CommunityEventDetails = {
  id: string
  title: string
  eventType: string
  startDate: string
  endDate: string | null
  timeLabel: string
  costLabel: string | null
  fullDescription: string
  agenda: string[]
  benefits: string[]
  eventUrl: string
  headerImageUrl: string | null
  createdBy: string
}

/**
 * Read published community events
 * - Enforces RLS automatically
 * - Date-first ordering
 * - Returns flat, UI-ready data
 */
export async function getCommunityEvents() {
  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("community_events")
    .select(`
      id,
      title,
      event_type,
      start_date,
      end_date,
      time_label,
      cost_label,
      short_description,
      header_image_url,
      created_by,
      profiles!community_events_created_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getCommunityEvents error:", error)
    throw new Error("Failed to load community events")
  }

  return (
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      eventType: row.event_type,
      startDate: row.start_date,
      endDate: row.end_date,
      timeLabel: row.time_label,
      costLabel: row.cost_label,
      shortDescription: row.short_description,
      headerImageUrl: row.header_image_url,
      createdBy: row.created_by,
      creatorName: row.profiles?.full_name ?? "Unknown",
      creatorAvatarUrl: row.profiles?.avatar_url ?? null,
    })) ?? []
  )
}

export async function getCommunityEventById(eventId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("community_events")
    .select(`
      id,
      title,
      event_type,
      start_date,
      end_date,
      time_label,
      cost_label,
      full_description,
      agenda,
      benefits,
      event_url,
      header_image_url,
      created_by
    `)
    .eq("id", eventId)
    .single()

  if (error) {
    console.error("getCommunityEventById error:", error)
    throw new Error("Failed to load event details")
  }

  return {
    id: data.id,
    title: data.title,
    eventType: data.event_type,
    startDate: data.start_date,
    endDate: data.end_date,
    timeLabel: data.time_label,
    costLabel: data.cost_label,
    fullDescription: data.full_description,
    agenda: data.agenda ?? [],
    benefits: data.benefits ?? [],
    eventUrl: data.event_url,
    headerImageUrl: data.header_image_url,
    createdBy: data.created_by,
  }
}

export async function createCommunityEvent(input: {
  title: string
  eventType: string
  startDate: string
  endDate: string | null
  timeLabel: string
  costLabel: string | null
  shortDescription: string
  fullDescription: string | null
  agenda: string[]
  benefits: string[]
  eventUrl: string
  headerImageUrl: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const { error } = await supabase.from("community_events").insert({
    title: input.title,
    event_type: input.eventType,
    start_date: input.startDate,
    end_date: input.endDate,
    time_label: input.timeLabel,
    cost_label: input.costLabel,
    short_description: input.shortDescription,
    full_description: input.fullDescription,
    agenda: input.agenda,
    benefits: input.benefits,
    event_url: input.eventUrl,
    header_image_url: input.headerImageUrl,
    created_by: user.id,
  })

  if (error) {
    throw error
  }

  revalidatePath("/members/community/events")
}

export async function uploadEventImage(file: File) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("event-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-images").getPublicUrl(fileName)

  return publicUrl
}

export async function updateCommunityEvent(input: {
  id: string
  title: string
  short_description: string
  full_description: string
  event_type: string
  start_date: string
  end_date?: string | null
  time_label: string
  cost_label?: string | null
  event_url: string
  agenda: string[]
  benefits: string[]
  header_image_url?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error, count } = await supabase
    .from("community_events")
    .update({
      title: input.title,
      short_description: input.short_description,
      full_description: input.full_description,
      event_type: input.event_type,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      time_label: input.time_label,
      cost_label: input.cost_label ?? null,
      event_url: input.event_url,
      agenda: input.agenda,
      benefits: input.benefits,
      header_image_url: input.header_image_url ?? null,
    })
    .eq("id", input.id)
    .eq("created_by", user.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("updateCommunityEvent error:", error)
    return { success: false, error: "Failed to update event" }
  }

  if (count === 0) {
    return { success: false, error: "Unauthorized or event not found" }
  }

  revalidatePath("/members/community/events")
  return { success: true }
}

export async function deleteCommunityEvent(input: {
  id: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error, count } = await supabase
    .from("community_events")
    .delete()
    .eq("id", input.id)
    .eq("created_by", user.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("deleteCommunityEvent error:", error)
    return { success: false, error: "Failed to delete event" }
  }

  if (count === 0) {
    return { success: false, error: "Unauthorized or event not found" }
  }

  revalidatePath("/members/community/events")
  return { success: true }
}
