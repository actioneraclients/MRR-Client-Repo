"use server"

import { createClient } from "@/lib/supabase/server"

export async function getModerationProfile(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  // Fetch profile directly — no directory filtering
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      avatar_url,
      company,
      job_title,
      bio,
      social_links
    `,
    )
    .eq("id", userId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { profile: data }
}
