"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ============================================================================
// Types
// ============================================================================

interface ContentListParams {
  search?: string
  contentType?: string
  category?: string
  tag?: string
  page?: number
  pageSize?: number
  includeAll?: boolean
}

interface ContentListItem {
  id: string
  slug: string
  title: string
  description: string
  contentType: string
  category: string | null
  tags: string[]
  image: string | null
  author: string | null
  authorImage: string | null
  owner_id: string | null
  is_featured?: boolean
  is_sponsored?: boolean
  plan_ids?: string[] | null
}

interface ContentListResult {
  items: ContentListItem[]
  total: number
  page: number
  pageSize: number
  /** First (and only) sponsored item, if any. Excluded from items. */
  sponsoredItem: ContentListItem | null
}

interface ContentDetail {
  id: string
  slug: string
  title: string
  description: string | null
  contentType: string
  image: string | null
  author: string | null
  authorImage: string | null
  ctaText: string | null
  ctaUrl: string | null
  tags: string[]
  fullContent: {
    videoUrl?: string
    audioUrl?: string
    documentUrl?: string
    articleBody?: string
  }
}

interface ContentFilters {
  categories: string[]
  tags: string[]
  contentTypes: string[]
}

// ============================================================================
// getContentList
// ============================================================================

function rowToContentListItem(row: any): ContentListItem {
  const rawPlanIds = row.plan_ids
  let planIds: string[] | null = null
  if (rawPlanIds != null) {
    if (Array.isArray(rawPlanIds)) {
      planIds = rawPlanIds
    } else if (typeof rawPlanIds === "string") {
      try {
        planIds = JSON.parse(rawPlanIds) as string[]
      } catch {
        planIds = null
      }
    }
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    contentType: row.content_type,
    category: row.category || null,
    tags: row.tags || [],
    image: row.image_url || null,
    author: row.profiles?.full_name || null,
    authorImage: row.profiles?.avatar_url || null,
    owner_id: row.owner_id || null,
    is_featured: row.is_featured ?? false,
    is_sponsored: row.is_sponsored ?? false,
    plan_ids: planIds,
  }
}

export async function getContentList(params: ContentListParams): Promise<ContentListResult> {
  try {
    const supabase = await createClient()

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 12
    const includeAll = params.includeAll ?? false

    // --- Sponsored spotlight: fetch the one sponsored item ---
    let sponsoredItem: ContentListItem | null = null
    const { data: sponsoredRow, error: sponsoredErr } = await supabase
      .from("content_entries")
      .select(
        `
        id,
        slug,
        title,
        description,
        content_type,
        category,
        tags,
        image_url,
        owner_id,
        is_featured,
        is_sponsored,
        plan_ids,
        profiles!content_entries_owner_profile_fkey (
          full_name,
          avatar_url
        )
      `
      )
      .eq("status", "published")
      .eq("is_sponsored", true)
      .limit(1)
      .maybeSingle()

    if (!sponsoredErr && sponsoredRow) {
      sponsoredItem = rowToContentListItem(sponsoredRow)
    }

    // --- Featured + regular grid: all content excluding sponsored, ordered featured first ---
    const selectWithFeatured = `
        id,
        slug,
        title,
        description,
        content_type,
        category,
        tags,
        image_url,
        owner_id,
        is_featured,
        is_sponsored,
        plan_ids,
        profiles!content_entries_owner_profile_fkey (
          full_name,
          avatar_url
        )
      `
    const selectMinimal = `
        id,
        slug,
        title,
        description,
        content_type,
        category,
        tags,
        image_url,
        owner_id,
        plan_ids,
        profiles!content_entries_owner_profile_fkey (
          full_name,
          avatar_url
        )
      `

    let query = supabase
      .from("content_entries")
      .select(selectWithFeatured, { count: "exact" })
      .eq("status", "published")

    if (sponsoredItem) {
      query = query.neq("id", sponsoredItem.id)
    }

    query = query.order("is_featured", { ascending: false }).order("published_at", { ascending: false })

    if (params.search) {
      query = query.ilike("title", `%${params.search}%`)
    }
    if (params.contentType) {
      query = query.eq("content_type", params.contentType)
    }
    if (params.category) {
      query = query.eq("category", params.category)
    }
    if (params.tag) {
      const { data: tagRow } = await supabase
        .from("taxonomies")
        .select("id")
        .eq("type", "content_tag")
        .eq("name", params.tag)
        .single()

      if (!tagRow) {
        return { items: [], total: 0, page, pageSize, sponsoredItem }
      }

      query = query.contains("tags", [tagRow.id])
    }

    if (!includeAll) {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    let { data, error, count } = await query

    // Fallback if is_featured/is_sponsored columns don't exist yet
    if (error && (error.message?.includes("column") || error.message?.includes("does not exist"))) {
      query = supabase
        .from("content_entries")
        .select(selectMinimal, { count: "exact" })
        .eq("status", "published")

      if (sponsoredItem) {
        query = query.neq("id", sponsoredItem.id)
      }
      query = query.order("published_at", { ascending: false })

      if (params.search) {
        query = query.ilike("title", `%${params.search}%`)
      }
      if (params.contentType) {
        query = query.eq("content_type", params.contentType)
      }
      if (params.category) {
        query = query.eq("category", params.category)
      }
      if (params.tag) {
        const { data: tagRow } = await supabase
          .from("taxonomies")
          .select("id")
          .eq("type", "content_tag")
          .eq("name", params.tag)
          .single()
        if (tagRow) {
          query = query.contains("tags", [tagRow.id])
        }
      }
      if (!includeAll) {
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)
      }
      const fallback = await query
      data = fallback.data
      error = fallback.error
      count = fallback.count
    }

    if (error) {
      console.error("[getContentList] Supabase error:", error)
      return { items: [], total: 0, page, pageSize, sponsoredItem }
    }

    const items: ContentListItem[] = (data || []).map((row: any) => rowToContentListItem(row))

    return {
      items,
      total: count ?? 0,
      page,
      pageSize,
      sponsoredItem,
    }
  } catch (err) {
    console.error("[getContentList] Unexpected error:", err)
    return { items: [], total: 0, page: 1, pageSize: 12, sponsoredItem: null }
  }
}

// ============================================================================
// getContentBySlug
// ============================================================================

export async function getContentBySlug(slug: string): Promise<ContentDetail | null> {
  try {
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
        tags,
        image_url,
        video_url,
        audio_url,
        document_url,
        article_body,
        cta_text,
        cta_url,
        profiles!content_entries_owner_profile_fkey (
          full_name,
          avatar_url
        )
      `,
      )
      .eq("status", "published")
      .eq("slug", slug)
      .single()

    if (error || !data) {
      if (error) {
        console.error("[getContentBySlug] Supabase error:", error)
      }
      return null
    }

    const row = data as any
    let tagNames: string[] = []
    if (row.tags && Array.isArray(row.tags) && row.tags.length > 0) {
      const { data: tagRows } = await supabase
        .from("taxonomies")
        .select("id, name")
        .in("id", row.tags)
        .eq("type", "content_tag")
      const idToName = new Map((tagRows || []).map((t: { id: string; name: string }) => [t.id, t.name]))
      tagNames = row.tags.map((id: string) => idToName.get(id) ?? id).filter(Boolean)
    }

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description || null,
      contentType: row.content_type,
      image: row.image_url || null,
      author: row.profiles?.full_name || null,
      authorImage: row.profiles?.avatar_url || null,
      ctaText: row.cta_text ?? null,
      ctaUrl: row.cta_url ?? null,
      tags: tagNames,
      fullContent: {
        videoUrl: row.video_url || undefined,
        audioUrl: row.audio_url || undefined,
        documentUrl: row.document_url || undefined,
        articleBody: row.article_body || undefined,
      },
    }
  } catch (err) {
    console.error("[getContentBySlug] Unexpected error:", err)
    return null
  }
}

// ============================================================================
// getContentFilters
// ============================================================================

export async function getContentFilters(): Promise<ContentFilters> {
  try {
    const supabase = await createClient()

    const { data: contentData, error: contentError } = await supabase
      .from("content_entries")
      .select("content_type")
      .eq("status", "published")

    if (contentError) {
      console.error("[getContentFilters] Supabase error:", contentError)
      return { categories: [], tags: [], contentTypes: [] }
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("taxonomies")
      .select("name")
      .eq("type", "category")
      .order("name", { ascending: true })

    if (categoriesError) {
      console.error("[getContentFilters] Categories fetch error:", categoriesError)
    }

    const { data: tagsData, error: tagsError } = await supabase
      .from("taxonomies")
      .select("name")
      .eq("type", "content_tag")
      .order("name", { ascending: true })

    if (tagsError) {
      console.error("[getContentFilters] Tags fetch error:", tagsError)
    }

    // Deduplicate content types in JS
    const contentTypesSet = new Set<string>()

    for (const row of contentData || []) {
      if (row.content_type) {
        contentTypesSet.add(row.content_type)
      }
    }

    const categories = (categoriesData || []).map((c) => c.name).filter(Boolean)
    const tags = (tagsData || []).map((t) => t.name).filter(Boolean)

    return {
      categories,
      tags,
      contentTypes: Array.from(contentTypesSet).sort(),
    }
  } catch (err) {
    console.error("[getContentFilters] Unexpected error:", err)
    return { categories: [], tags: [], contentTypes: [] }
  }
}

// ===============================
// ===============================
export async function createEducationContent(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      error: {
        message: "Not authenticated",
        details: null,
        hint: null,
        code: "AUTH_ERROR",
      },
    }
  }

  const title = formData.get("title") as string
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const contentType = formData.get("content_type") as string
  const tags = JSON.parse((formData.get("tags") as string) || "[]")

  const { error } = await supabase.from("content_entries").insert({
    title,
    slug,
    description: (formData.get("description") as string) || null,
    content_type: contentType,
    category: (formData.get("category") as string) || null,
    tags,
    image_url: (formData.get("image_url") as string) || null,
    video_url: contentType === "Video" ? (formData.get("video_url") as string) || null : null,
    audio_url: contentType === "Audio" ? (formData.get("audio_url") as string) || null : null,
    document_url: contentType === "Document" ? (formData.get("document_url") as string) || null : null,
    article_body: contentType === "Article" ? (formData.get("article_body") as string) || null : null,
    cta_text: (formData.get("cta_text") as string) || null,
    cta_url: (formData.get("cta_url") as string) || null,
    owner_id: user.id,
    status: "published",
    published_at: new Date().toISOString(),
    created_by: user.id,
  })

  if (error) {
    return {
      ok: false,
      error: {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    }
  }

  revalidatePath("/members/education")
  return { ok: true }
}

// ============================================================================
// deleteEducationContent
// ============================================================================

export async function deleteEducationContent(input: {
  id: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error, count } = await supabase
    .from("content_entries")
    .delete()
    .eq("id", input.id)
    .eq("owner_id", user.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("deleteEducationContent error:", error)
    return { success: false, error: "Failed to delete content" }
  }

  if (count === 0) {
    return { success: false, error: "Unauthorized or content not found" }
  }

  revalidatePath("/members/education")
  return { success: true }
}

// ============================================================================
// updateEducationContent
// ============================================================================

export async function updateEducationContent(input: {
  id: string
  title: string
  description: string | null
  content_type: string
  category: string | null
  tags: string[]
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  document_url: string | null
  article_body: string | null
  cta_text: string | null
  cta_url: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const { error, count } = await supabase
    .from("content_entries")
    .update({
      title: input.title,
      slug,
      description: input.description,
      content_type: input.content_type,
      category: input.category,
      tags: input.tags,
      image_url: input.image_url,
      video_url: input.video_url,
      audio_url: input.audio_url,
      document_url: input.document_url,
      article_body: input.article_body,
      cta_text: input.cta_text,
      cta_url: input.cta_url,
    })
    .eq("id", input.id)
    .eq("owner_id", user.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("updateEducationContent error:", error)
    return { success: false, error: "Failed to update content" }
  }

  if (count === 0) {
    return { success: false, error: "Unauthorized or content not found" }
  }

  revalidatePath("/members/education")
  return { success: true }
}

// ============================================================================
// getEducationContentById for edit mode
// ============================================================================

export async function getEducationContentById(id: string): Promise<{
  id: string
  title: string
  description: string | null
  content_type: string
  category: string | null
  tags: string[]
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  document_url: string | null
  article_body: string | null
  cta_text: string | null
  cta_url: string | null
} | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("content_entries")
    .select(
      `
      id,
      title,
      description,
      content_type,
      category,
      tags,
      image_url,
      video_url,
      audio_url,
      document_url,
      article_body,
      cta_text,
      cta_url
    `,
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    console.error("getEducationContentById error:", error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    content_type: data.content_type,
    category: data.category,
    tags: data.tags || [],
    image_url: data.image_url,
    video_url: data.video_url,
    audio_url: data.audio_url,
    document_url: data.document_url,
    article_body: data.article_body,
    cta_text: data.cta_text,
    cta_url: data.cta_url,
  }
}
