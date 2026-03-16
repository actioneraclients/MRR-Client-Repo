"use server"

import { createClient } from "@/lib/supabase/server"

// ─────────────────────────────────────────────────────────────────────────────
// getExpertsList - Fetch expert cards for the Experts grid
// ─────────────────────────────────────────────────────────────────────────────
export async function getExpertsList(params: {
  search?: string
  tag?: string
}): Promise<{
  items: {
    id: string
    slug: string
    name: string
    businessName: string | null
    image: string | null
    bio: string | null
    tags: string[]
  }[]
}> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("experts")
      .select("id, slug, name, business_name, image_url, bio, expert_tags")
      .eq("is_active", true)
      .order("name", { ascending: true })

    // Search filter - name ilike
    if (params.search && params.search.trim() !== "") {
      query = query.ilike("name", `%${params.search.trim()}%`)
    }

    // Tag filter - expert_tags contains
    if (params.tag && params.tag.trim() !== "") {
      query = query.contains("expert_tags", [params.tag.trim()])
    }

    const { data, error } = await query

    if (error) {
      console.error("[getExpertsList] Supabase error:", error)
      return { items: [] }
    }

    // Flatten to UI-ready shape
    const items = (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug ?? "",
      name: row.name ?? "",
      businessName: row.business_name ?? null,
      image: row.image_url ?? null,
      bio: row.bio ?? null,
      tags: Array.isArray(row.expert_tags) ? row.expert_tags : [],
    }))

    return { items }
  } catch (err) {
    console.error("[getExpertsList] Unexpected error:", err)
    return { items: [] }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getExpertBySlug - Fetch full expert profile for the Expert modal
// ─────────────────────────────────────────────────────────────────────────────
export async function getExpertBySlug(slug: string): Promise<{
  id: string
  slug: string
  name: string
  image: string | null
  businessName: string | null
  businessAbout: string | null
  website: string | null
  bio: string | null
  tags: string[]
} | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("experts")
      .select("id, slug, name, image_url, business_name, business_about, website_url, bio, expert_tags")
      .eq("is_active", true)
      .eq("slug", slug)
      .single()

    if (error) {
      // .single() throws if no row found - this is expected behavior
      if (error.code === "PGRST116") {
        return null
      }
      console.error("[getExpertBySlug] Supabase error:", error)
      return null
    }

    if (!data) {
      return null
    }

    // Flatten to UI-ready shape
    return {
      id: data.id,
      slug: data.slug ?? "",
      name: data.name ?? "",
      image: data.image_url ?? null,
      businessName: data.business_name ?? null,
      businessAbout: data.business_about ?? null,
      website: data.website_url ?? null,
      bio: data.bio ?? null,
      tags: Array.isArray(data.expert_tags) ? data.expert_tags : [],
    }
  } catch (err) {
    console.error("[getExpertBySlug] Unexpected error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getContentByExpert - Fetch "Content by Expert" list inside the Expert modal
// ─────────────────────────────────────────────────────────────────────────────
export async function getContentByExpert(expertId: string): Promise<
  {
    id: string
    slug: string
    title: string
    contentType: string
  }[]
> {
  try {
    const supabase = await createClient()

    const { data: expert, error: expertError } = await supabase
      .from("experts")
      .select("profile_id")
      .eq("id", expertId)
      .single()

    if (expertError || !expert?.profile_id) {
      return []
    }

    const { data, error } = await supabase
      .from("content_entries")
      .select("id, slug, title, content_type")
      .eq("status", "published")
      .eq("owner_id", expert.profile_id)
      .order("published_at", { ascending: false })

    if (error) {
      console.error("[getContentByExpert] Supabase error:", error)
      return []
    }

    // Flatten to UI-ready shape
    return (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug ?? "",
      title: row.title ?? "",
      contentType: row.content_type ?? "",
    }))
  } catch (err) {
    console.error("[getContentByExpert] Unexpected error:", err)
    return []
  }
}
