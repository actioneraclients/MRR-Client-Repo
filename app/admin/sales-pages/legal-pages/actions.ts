"use server"

import { createClient } from "@/lib/supabase/server"

export async function getLegalPages() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("legal_pages")
    .select("*")
    .order("page_type")

  if (error) {
    console.error("Error loading legal pages:", error)
    return []
  }

  return data ?? []
}

export async function updateLegalPage(pageType: string, content: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("legal_pages")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("page_type", pageType)

  if (error) {
    console.error("Error updating legal page:", error)
    throw error
  }
}
