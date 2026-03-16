"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  normalizePublicSlug,
  getPublicSlugConflict,
} from "@/lib/slug"

function createServiceRoleClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

async function verifyAdminAccess(): Promise<{ authorized: boolean; error: string | null }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { authorized: false, error: "Not authenticated" }
  const { data: profile } = await supabase.from("profiles").select("is_creator").eq("id", user.id).single()
  if (!profile?.is_creator) return { authorized: false, error: "Not authorized" }
  return { authorized: true, error: null }
}

export interface OptInPageWithPlan {
  id: string
  name: string
  slug: string
  is_active: boolean
  logo_enabled: boolean | null
  use_brand_background: boolean | null
  use_background_color: boolean
  background_color: string | null
  headline: string | null
  left_subheadline: string | null
  left_body: string | null
  left_bullets: string[] | null
  video_url: string | null
  image_url: string | null
  cta_text: string | null
  confirmation_message: string | null
  plan_id: string | null
  created_at: string
  plans: { name: string } | null
}

export async function getAdminOptInPages(): Promise<{ items: OptInPageWithPlan[]; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { items: [], error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("opt_in_pages")
    .select("*, plans(name)")
    .order("created_at", { ascending: false })

  if (error) return { items: [], error: error.message }
  return { items: (data ?? []) as OptInPageWithPlan[] }
}

export interface PlanOption {
  id: string
  name: string
}

export async function getAllPlansForDropdown(): Promise<{ plans: PlanOption[]; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { plans: [], error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("plans")
    .select("id, name")
    .order("sort_order", { ascending: true })

  if (error) return { plans: [], error: error.message }
  return { plans: (data ?? []) as PlanOption[] }
}

export interface CreateOptInPageInput {
  name: string
  slug: string
  is_active: boolean
  logo_enabled: boolean
  use_brand_background: boolean
  use_background_color: boolean
  headline: string
  left_subheadline?: string | null
  left_body?: string | null
  left_bullets?: string[] | null
  video_url?: string | null
  image_url?: string | null
  cta_text?: string | null
  confirmation_message?: string | null
  plan_id?: string | null
}

export async function createOptInPage(
  input: CreateOptInPageInput
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const slug = normalizePublicSlug(input.slug || input.name)
  if (!slug) return { success: false, error: "Slug cannot be empty" }

  const conflict = await getPublicSlugConflict(slug)
  if (conflict.conflict) {
    return { success: false, error: "This URL slug is already in use or reserved." }
  }

  const supabase = createServiceRoleClient()

  const payload = {
    name: input.name.trim(),
    slug,
    is_active: input.is_active,
    logo_enabled: input.logo_enabled,
    use_brand_background: Boolean(input.use_brand_background),
    use_background_color: Boolean(input.use_background_color),
    headline: input.headline?.trim() || null,
    left_subheadline: input.left_subheadline?.trim() || null,
    left_body: input.left_body?.trim() || null,
    left_bullets: input.left_bullets ?? null,
    video_url: input.video_url?.trim() || null,
    image_url: input.image_url?.trim() || null,
    cta_text: input.cta_text?.trim() || null,
    confirmation_message: input.confirmation_message?.trim() || null,
    plan_id: input.plan_id || null,
  }

  const { error } = await supabase.from("opt_in_pages").insert([payload])

  if (error) {
    if (error.code === "23505") return { success: false, error: "This slug is already in use" }
    return { success: false, error: error.message }
  }
  return { success: true }
}

export interface UpdateOptInPageInput extends CreateOptInPageInput {
  id: string
}

export async function updateOptInPage(
  input: UpdateOptInPageInput
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const slug = normalizePublicSlug(input.slug || input.name)
  if (!slug) return { success: false, error: "Slug cannot be empty" }

  const conflict = await getPublicSlugConflict(slug, {
    ignoreOptInPageId: input.id,
  })
  if (conflict.conflict) {
    return { success: false, error: "This URL slug is already in use or reserved." }
  }

  const supabase = createServiceRoleClient()

  const payload = {
    name: input.name.trim(),
    slug,
    is_active: input.is_active,
    logo_enabled: input.logo_enabled,
    use_brand_background: Boolean(input.use_brand_background),
    use_background_color: Boolean(input.use_background_color),
    headline: input.headline?.trim() || null,
    left_subheadline: input.left_subheadline?.trim() || null,
    left_body: input.left_body?.trim() || null,
    left_bullets: input.left_bullets ?? null,
    video_url: input.video_url?.trim() || null,
    image_url: input.image_url?.trim() || null,
    cta_text: input.cta_text?.trim() || null,
    confirmation_message: input.confirmation_message?.trim() || null,
    plan_id: input.plan_id || null,
  }

  const { error } = await supabase.from("opt_in_pages").update(payload).eq("id", input.id)

  if (error) {
    if (error.code === "23505") return { success: false, error: "This slug is already in use" }
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function toggleOptInActive(
  id: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("opt_in_pages").update({ is_active }).eq("id", id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function softDeleteOptInPage(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.from("opt_in_pages").update({ is_active: false }).eq("id", id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
