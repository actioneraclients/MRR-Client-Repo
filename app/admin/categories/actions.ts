"use server"

import { createClient } from "@/lib/supabase/server"

// Types
export type TaxonomyType = "category" | "content_tag" | "expert_tag"

export interface Taxonomy {
  id: string
  type: TaxonomyType
  name: string
  slug: string
  created_at: string
}

// Server Actions

export async function getTaxonomiesByType(type: TaxonomyType): Promise<Taxonomy[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, type, name, slug, created_at")
    .eq("type", type)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching taxonomies:", error)
    return []
  }

  return data ?? []
}

export async function createTaxonomy({
  type,
  name,
  slug,
}: {
  type: TaxonomyType
  name: string
  slug: string
}): Promise<{ data: Taxonomy | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .insert({
      type,
      name: name.trim(),
      slug: slug.trim(),
    })
    .select("id, type, name, slug, created_at")
    .single()

  if (error) {
    console.error("Error creating taxonomy:", error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateTaxonomy({
  id,
  name,
  slug,
}: {
  id: string
  name: string
  slug: string
}): Promise<{ data: Taxonomy | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .update({
      name: name.trim(),
      slug: slug.trim(),
    })
    .eq("id", id)
    .select("id, type, name, slug, created_at")
    .single()

  if (error) {
    console.error("Error updating taxonomy:", error)
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteTaxonomy(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.from("taxonomies").delete().eq("id", id)

  if (error) {
    console.error("Error deleting taxonomy:", error)
    return { error: error.message }
  }

  return { error: null }
}
