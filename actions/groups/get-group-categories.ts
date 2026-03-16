"use server"

import { createClient } from "@/lib/supabase/server"

export async function getGroupCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "category")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
