"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createMasterclass(input: {
  title: string
  description?: string | null
  topics?: string[] | null
  who_its_for?: string | null
  scheduled_at: string
  duration_minutes: number
  image_path?: string | null
  video_url?: string | null
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("masterclasses").insert({
    title: input.title.trim(),
    description: input.description?.trim() || null,
    topics: input.topics || null,
    who_its_for: input.who_its_for?.trim() || null,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    image_path: input.image_path || null,
    video_url: input.video_url || null,
    creator_id: user.id,
    status: "pending",
  })

  if (error) {
    console.error("[createMasterclass]", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/members/masterclasses")

  return { success: true }
}
