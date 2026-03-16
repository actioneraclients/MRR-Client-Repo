"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/** Generate a kebab-case slug from a business name. */
function slugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return base || "business"
}

/** Return a slug that does not yet exist in businesses (append -2, -3, … or short id). */
async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", baseSlug)
    .limit(1)
  if (!existing?.length) return baseSlug
  for (let n = 2; n < 1000; n++) {
    const candidate = `${baseSlug}-${n}`
    const { data: taken } = await supabase.from("businesses").select("id").eq("slug", candidate).limit(1)
    if (!taken?.length) return candidate
  }
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
}

export async function createBusiness(input: {
  name: string
  short_description: string
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  social_links?: { linkedin?: string; instagram?: string; facebook?: string; twitter?: string } | null
  cta_text?: string | null
  cta_url?: string | null
  tag_ids?: string[]
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const name = input.name?.trim()
    const short_description = input.short_description?.trim()
    if (!name) return { success: false, error: "Name is required" }
    if (!short_description) return { success: false, error: "Short description is required" }

    const baseSlug = slugFromName(name)
    const slug = await ensureUniqueSlug(supabase, baseSlug)

    const { data: inserted, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name,
        slug,
        short_description: short_description || null,
        description: input.description?.trim() || null,
        logo_url: input.logo_url?.trim() || null,
        website_url: input.website_url?.trim() || null,
        social_links: input.social_links ?? null,
        cta_text: input.cta_text?.trim() || null,
        cta_url: input.cta_url?.trim() || null,
        status: "published",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[createBusiness]", error)
      return { success: false, error: error.message }
    }

    const tagIds = input.tag_ids?.filter(Boolean) ?? []
    if (inserted?.id && tagIds.length > 0) {
      const { error: relError } = await supabase.from("taxonomy_relations").insert(
        tagIds.map((taxonomy_id) => ({
          entity_type: "expert",
          entity_id: inserted.id,
          taxonomy_id,
        })),
      )
      if (relError) {
        console.error("[createBusiness] taxonomy_relations:", relError)
      }
    }

    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[createBusiness] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateBusiness(input: {
  id: string
  name: string
  short_description: string
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  social_links?: { linkedin?: string; instagram?: string; facebook?: string; twitter?: string } | null
  cta_text?: string | null
  cta_url?: string | null
  tag_ids?: string[]
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: "Not authenticated" }

    const name = input.name?.trim()
    const short_description = input.short_description?.trim()
    if (!name) return { success: false, error: "Name is required" }
    if (!short_description) return { success: false, error: "Short description is required" }

    const { error: updateError, count } = await supabase
      .from("businesses")
      .update({
        name,
        short_description: short_description || null,
        description: input.description?.trim() || null,
        logo_url: input.logo_url?.trim() || null,
        website_url: input.website_url?.trim() || null,
        social_links: input.social_links ?? null,
        cta_text: input.cta_text?.trim() || null,
        cta_url: input.cta_url?.trim() || null,
      })
      .eq("id", input.id)
      .eq("owner_id", user.id)
      .select("id", { count: "exact", head: true })

    if (updateError) {
      console.error("[updateBusiness]", updateError)
      return { success: false, error: updateError.message }
    }
    if (count === 0) return { success: false, error: "Unauthorized or business not found" }

    await supabase.from("taxonomy_relations").delete().eq("entity_type", "expert").eq("entity_id", input.id)
    const tagIds = input.tag_ids?.filter(Boolean) ?? []
    if (tagIds.length > 0) {
      await supabase.from("taxonomy_relations").insert(
        tagIds.map((taxonomy_id) => ({ entity_type: "expert", entity_id: input.id, taxonomy_id })),
      )
    }

    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[updateBusiness] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteBusiness(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: "Not authenticated" }

    await supabase.from("taxonomy_relations").delete().eq("entity_type", "expert").eq("entity_id", id)
    const { error, count } = await supabase
      .from("businesses")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id)
      .select("id", { count: "exact", head: true })

    if (error) {
      console.error("[deleteBusiness]", error)
      return { success: false, error: error.message }
    }
    if (count === 0) return { success: false, error: "Unauthorized or business not found" }
    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[deleteBusiness] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}
