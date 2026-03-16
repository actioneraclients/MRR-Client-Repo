"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/** Generate a kebab-case slug from a name (match businesses exactly). */
function slugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return base || "service"
}

/** Return a slug that does not yet exist in services (append -2, -3, … or short id). */
async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
): Promise<string> {
  const { data: existing } = await supabase
    .from("services")
    .select("id")
    .eq("slug", baseSlug)
    .limit(1)
  if (!existing?.length) return baseSlug
  for (let n = 2; n < 1000; n++) {
    const candidate = `${baseSlug}-${n}`
    const { data: taken } = await supabase.from("services").select("id").eq("slug", candidate).limit(1)
    if (!taken?.length) return candidate
  }
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
}

export async function createService(input: {
  business_id: string
  name: string
  short_description: string
  description?: string | null
  image_url?: string | null
  price_label?: string | null
  delivery_type?: string | null
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

    const business_id = input.business_id?.trim()
    const name = input.name?.trim()
    const short_description = input.short_description?.trim()
    if (!business_id || !name) return { success: false, error: "Business and name are required" }
    if (!short_description) return { success: false, error: "Short description is required" }

    const baseSlug = slugFromName(name)
    const slug = await ensureUniqueSlug(supabase, baseSlug)

    const { data: inserted, error } = await supabase
      .from("services")
      .insert({
        owner_id: user.id,
        business_id,
        name,
        slug,
        short_description: short_description || null,
        description: input.description?.trim() || null,
        image_url: input.image_url?.trim() || null,
        price_label: input.price_label?.trim() || null,
        delivery_type: input.delivery_type?.trim() || null,
        cta_text: input.cta_text?.trim() || null,
        cta_url: input.cta_url?.trim() || null,
        status: "published",
        is_public: true,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[createService]", error)
      return { success: false, error: error.message }
    }

    const tagIds = input.tag_ids?.filter(Boolean) ?? []
    if (inserted?.id && tagIds.length > 0) {
      const { error: relError } = await supabase.from("taxonomy_relations").insert(
        tagIds.map((taxonomy_id) => ({
          entity_type: "service",
          entity_id: inserted.id,
          taxonomy_id,
        })),
      )
      if (relError) {
        console.error("[createService] taxonomy_relations:", relError)
        // don't fail the whole request; service was created
      }
    }

    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[createService] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateService(input: {
  id: string
  business_id: string
  name: string
  short_description: string
  description?: string | null
  image_url?: string | null
  price_label?: string | null
  delivery_type?: string | null
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

    const business_id = input.business_id?.trim()
    const name = input.name?.trim()
    const short_description = input.short_description?.trim()
    if (!business_id || !name) return { success: false, error: "Business and name are required" }
    if (!short_description) return { success: false, error: "Short description is required" }

    const { error: updateError, count } = await supabase
      .from("services")
      .update({
        business_id,
        name,
        short_description: short_description || null,
        description: input.description?.trim() || null,
        image_url: input.image_url?.trim() || null,
        price_label: input.price_label?.trim() || null,
        delivery_type: input.delivery_type?.trim() || null,
        cta_text: input.cta_text?.trim() || null,
        cta_url: input.cta_url?.trim() || null,
      })
      .eq("id", input.id)
      .eq("owner_id", user.id)
      .select("id", { count: "exact", head: true })

    if (updateError) {
      console.error("[updateService]", updateError)
      return { success: false, error: updateError.message }
    }
    if (count === 0) return { success: false, error: "Unauthorized or service not found" }

    await supabase.from("taxonomy_relations").delete().eq("entity_type", "service").eq("entity_id", input.id)
    const tagIds = input.tag_ids?.filter(Boolean) ?? []
    if (tagIds.length > 0) {
      await supabase.from("taxonomy_relations").insert(
        tagIds.map((taxonomy_id) => ({ entity_type: "service", entity_id: input.id, taxonomy_id })),
      )
    }

    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[updateService] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}

export async function deleteService(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return { success: false, error: "Not authenticated" }

    await supabase.from("taxonomy_relations").delete().eq("entity_type", "service").eq("entity_id", id)
    const { error, count } = await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id)
      .select("id", { count: "exact", head: true })

    if (error) {
      console.error("[deleteService]", error)
      return { success: false, error: error.message }
    }
    if (count === 0) return { success: false, error: "Unauthorized or service not found" }
    revalidatePath("/members/productservices")
    return { success: true }
  } catch (err) {
    console.error("[deleteService] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}
