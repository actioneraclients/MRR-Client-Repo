"use server"

import { createClient } from "@/lib/supabase/server"

export type GroupCategory = {
  id: string
  name: string
}

export async function getGroupCategories(): Promise<GroupCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "category")
    .order("name", { ascending: true })

  if (error) {
    console.error("[getGroupCategories] Error fetching categories:", error)
    return []
  }

  return data ?? []
}
