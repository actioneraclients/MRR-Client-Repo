"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAboutPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("about_page")
    .select("sections, is_published")
    .limit(1)
    .single()

  if (error) {
    console.error("Error fetching about page:", error)
    return null
  }

  return data
}
