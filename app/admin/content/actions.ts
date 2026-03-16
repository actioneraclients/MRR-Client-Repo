"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// =====================================================
// Types
// =====================================================

export interface AdminContentListItem {
  id: string
  slug: string | null
  title: string
  content_type: string
  category: string | null
  status: string
  published_at: string | null
  created_at: string
  owner: {
    full_name: string | null
    avatar_url: string | null
  } | null
  is_featured: boolean
  is_sponsored: boolean
  plan_ids: string[] | null
}

interface AdminContentListResult {
  items: AdminContentListItem[]
}

// =====================================================
// Helper: Check if string is a UUID
// =====================================================

function isUUID(str: string | null): boolean {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// =====================================================
// Admin: Get All Content (no status filtering)
// =====================================================

export async function getAdminContentList(): Promise<AdminContentListResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { items: [] }
  }

  const { data, error } = await supabase
    .from("content_entries")
    .select(
      `
      id,
      slug,
      title,
      content_type,
      category,
      status,
      published_at,
      created_at,
      is_featured,
      is_sponsored,
      plan_ids,
      profiles!content_entries_owner_profile_fkey (
        full_name,
        avatar_url
      )
    `,
    )
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAdminContentList] error:", error)
    return { items: [] }
  }

  const items: AdminContentListItem[] = []

  for (const row of data ?? []) {
    let categoryDisplay = row.category

    // If category looks like a UUID, fetch the taxonomy name
    if (isUUID(row.category)) {
      const { data: taxonomy } = await supabase.from("taxonomies").select("name").eq("id", row.category).single()

      categoryDisplay = taxonomy?.name ?? null
    }

    const rawPlanIds = (row as { plan_ids?: string | string[] | null }).plan_ids
    let planIds: string[] | null = null
    if (rawPlanIds != null) {
      if (Array.isArray(rawPlanIds)) {
        planIds = rawPlanIds.filter((id): id is string => typeof id === "string")
      } else if (typeof rawPlanIds === "string") {
        try {
          const parsed = JSON.parse(rawPlanIds)
          planIds = Array.isArray(parsed) ? parsed.filter((id: unknown): id is string => typeof id === "string") : null
        } catch {
          planIds = null
        }
      }
    }

    items.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      content_type: row.content_type,
      category: categoryDisplay,
      status: row.status,
      published_at: row.published_at,
      created_at: row.created_at,
      owner: row.profiles
        ? {
            full_name: row.profiles.full_name,
            avatar_url: row.profiles.avatar_url,
          }
        : null,
      is_featured: row.is_featured ?? false,
      is_sponsored: row.is_sponsored ?? false,
      plan_ids: planIds,
    })
  }

  return { items }
}

// =====================================================
// Admin: Get Plans (for Plan Access modal)
// =====================================================

export async function getPlans() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("plans")
    .select("id, name")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching plans:", error)
    return []
  }

  return data ?? []
}

// =====================================================
// Admin: Update Content Plan Access
// =====================================================

export async function updateContentPlanAccess(contentId: string, planIds: string[]) {
  const supabase = await createClient()

  // If planIds is empty → content visible to everyone (plan_ids = null)
  // If plans are selected → plan_ids = planIds
  const updateValue = planIds.length === 0 ? null : planIds

  const { error } = await supabase
    .from("content_entries")
    .update({ plan_ids: updateValue })
    .eq("id", contentId)

  if (error) {
    console.error("Error updating content plan access:", error)
    return { success: false }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}

// =====================================================
// Admin: Toggle Content Status (draft <-> published)
// =====================================================

export async function toggleAdminContentStatus(input: {
  id: string
  nextStatus: "draft" | "published"
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const updatePayload: Record<string, any> = {
    status: input.nextStatus,
  }

  if (input.nextStatus === "published") {
    updatePayload.published_at = new Date().toISOString()
  } else {
    updatePayload.published_at = null
  }

  const { error, count } = await supabase
    .from("content_entries")
    .update(updatePayload)
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[toggleAdminContentStatus] error:", error)
    return { success: false, error: "Failed to update status" }
  }

  if (count === 0) {
    return { success: false, error: "Content not found or unauthorized" }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}

// =====================================================
// Admin: Toggle Featured Content
// =====================================================

export async function toggleFeaturedContent(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: current } = await supabase.from("content_entries").select("is_featured").eq("id", entryId).single()

  if (!current) {
    return { success: false, error: "Content not found" }
  }

  const { error: updateError, count: updateCount } = await supabase
    .from("content_entries")
    .update({ is_featured: !current.is_featured })
    .eq("id", entryId)
    .select("id", { count: "exact", head: true })

  if (updateError) {
    console.error("[toggleFeaturedContent] error:", updateError)
    return { success: false, error: "Failed to toggle featured" }
  }

  if (updateCount === 0) {
    return { success: false, error: "Content not found" }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}

// =====================================================
// Admin: Set Sponsored Content
// =====================================================

export async function setSponsoredContent(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // First clear any existing sponsor
  await supabase.from("content_entries").update({ is_sponsored: false }).eq("is_sponsored", true)

  // Then set the selected entry as sponsored
  const { error, count } = await supabase
    .from("content_entries")
    .update({ is_sponsored: true })
    .eq("id", entryId)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[setSponsoredContent] error:", error)
    return { success: false, error: "Failed to set sponsored" }
  }

  if (count === 0) {
    return { success: false, error: "Content not found" }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}

// =====================================================
// Admin: Remove Sponsored Content
// =====================================================

export async function removeSponsoredContent(entryId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error, count } = await supabase
    .from("content_entries")
    .update({ is_sponsored: false })
    .eq("id", entryId)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[removeSponsoredContent] error:", error)
    return { success: false, error: "Failed to remove sponsored" }
  }

  if (count === 0) {
    return { success: false, error: "Content not found" }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}
// =====================================================

export async function adminDeleteContent(input: {
  id: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error, count } = await supabase
    .from("content_entries")
    .delete()
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[adminDeleteContent] error:", error)
    return { success: false, error: "Failed to delete content" }
  }

  if (count === 0) {
    return { success: false, error: "Content not found or unauthorized" }
  }

  revalidatePath("/admin/content")
  revalidatePath("/members/education")

  return { success: true }
}

// =====================================================
// Admin: Get Content by Slug (draft + published)
// Used for "View Content" modal
// =====================================================

export async function getAdminContentBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("content_entries")
    .select(
      `
      id,
      slug,
      title,
      description,
      content_type,
      image_url,
      video_url,
      audio_url,
      document_url,
      article_body,
      cta_text,
      cta_url,
      status,
      published_at,
      profiles!content_entries_owner_profile_fkey (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("slug", slug)
    .single()

  if (error || !data) {
    console.error("[getAdminContentBySlug] error:", error)
    return null
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    contentType: data.content_type,
    image: data.image_url,
    author: data.profiles?.full_name ?? null,
    authorImage: data.profiles?.avatar_url ?? null,
    status: data.status,
    publishedAt: data.published_at,
    ctaText: data.cta_text,
    ctaUrl: data.cta_url,
    fullContent: {
      videoUrl: data.video_url ?? undefined,
      audioUrl: data.audio_url ?? undefined,
      documentUrl: data.document_url ?? undefined,
      articleBody: data.article_body ?? undefined,
    },
  }
}
