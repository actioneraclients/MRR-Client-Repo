"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export type SalesPageType = "main" | "founders"

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

function getSalesPageSlug(pageType: SalesPageType) {
  return pageType === "founders" ? "founders" : "home"
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

  if (!profile?.is_creator) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, error: null }
}

export interface SalesPageHeroRow {
  logo_url: string | null
  hero_headline: string | null
  hero_intro_text: string | null
  hero_image_url: string | null
  hero_video_url: string | null
}

export interface SalesPageRow extends SalesPageHeroRow {
  vision_headline: string | null
  vision_body_text: string | null
  vision_image_url: string | null
  vision_who_for_bullets: string[] | null
  education_headline: string | null
  show_courses: boolean | null
  show_marketplace: boolean | null
  show_ai_mentors: boolean | null
  show_founders_bridge: boolean | null
  membership_headline: string | null
  membership_intro: string | null
  selected_plan_ids: string[] | null
  founders_spots_available: number | null
  founders_invite_headline: string | null
  founders_invite_body: string | null
  founders_invite_media_url: string | null
  founders_invite_media_type: "image" | "video" | null
  founders_comparison_headline: string | null
  founders_comparison_subhead: string | null
  founders_price_lifetime: number | null
  founders_price_comparison_monthly: number | null
  founders_claim_headline: string | null
  founders_claim_body: string | null
  founders_faq: { question: string; answer: string }[] | null
}

export interface UpdateSalesPageCommunityVisionPayload {
  vision_headline?: string | null
  vision_body_text?: string | null
  vision_image_url?: string | null
  vision_who_for_bullets?: string[] | null
}

export async function updateSalesPageCommunityVision(
  pageType: SalesPageType,
  payload: UpdateSalesPageCommunityVisionPayload,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (payload.vision_headline !== undefined)
    updatePayload.vision_headline = payload.vision_headline
  if (payload.vision_body_text !== undefined)
    updatePayload.vision_body_text = payload.vision_body_text
  if (payload.vision_image_url !== undefined)
    updatePayload.vision_image_url = payload.vision_image_url
  if (payload.vision_who_for_bullets !== undefined)
    updatePayload.vision_who_for_bullets = payload.vision_who_for_bullets

  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", getSalesPageSlug(pageType))

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateSalesPageEducationSection(
  pageType: SalesPageType,
  payload: { education_headline?: string | null },
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (payload.education_headline !== undefined)
    updatePayload.education_headline = payload.education_headline

  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", getSalesPageSlug(pageType))

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface UpdateSalesPageVisibilityPayload {
  show_courses?: boolean
  show_marketplace?: boolean
  show_ai_mentors?: boolean
  show_founders_bridge?: boolean
}

export async function updateSalesPageVisibility(
  pageType: SalesPageType,
  payload: UpdateSalesPageVisibilityPayload,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (payload.show_courses !== undefined)
    updatePayload.show_courses = payload.show_courses
  if (payload.show_marketplace !== undefined)
    updatePayload.show_marketplace = payload.show_marketplace
  if (payload.show_ai_mentors !== undefined)
    updatePayload.show_ai_mentors = payload.show_ai_mentors
  if (payload.show_founders_bridge !== undefined)
    updatePayload.show_founders_bridge = payload.show_founders_bridge

  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", getSalesPageSlug(pageType))

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface ActivePlanForSalesPage {
  id: string
  name: string
  price: number | null
  currency: string | null
  billing: string | null
  features: string[] | null
  most_popular: boolean | null
  payment_url: string | null
}

export async function getActivePlansForSalesPage(): Promise<{
  success: boolean
  data?: ActivePlanForSalesPage[]
  error?: string
}> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("plans")
    .select("id, name, price, currency, billing, features, most_popular, payment_url")
    .eq("active", true)
    .order("name", { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: (data ?? []) as ActivePlanForSalesPage[] }
}

export async function updateSalesPagePlans(
  pageType: SalesPageType,
  payload: {
    selected_plan_ids: string[]
    membership_headline?: string | null
    membership_intro?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    selected_plan_ids: payload.selected_plan_ids,
    updated_at: new Date().toISOString(),
  }
  if (payload.membership_headline !== undefined)
    updatePayload.membership_headline = payload.membership_headline ?? null
  if (payload.membership_intro !== undefined)
    updatePayload.membership_intro = payload.membership_intro ?? null

  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", getSalesPageSlug(pageType))

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface UpdateSalesPageHeroPayload {
  logo_url?: string | null
  hero_headline?: string | null
  hero_intro_text?: string | null
  hero_image_url?: string | null
  hero_video_url?: string | null
}

export async function updateSalesPageHero(
  pageType: SalesPageType,
  payload: UpdateSalesPageHeroPayload,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (payload.logo_url !== undefined) updatePayload.logo_url = payload.logo_url
  if (payload.hero_headline !== undefined) updatePayload.hero_headline = payload.hero_headline
  if (payload.hero_intro_text !== undefined) updatePayload.hero_intro_text = payload.hero_intro_text
  if (payload.hero_image_url !== undefined) updatePayload.hero_image_url = payload.hero_image_url
  if (payload.hero_video_url !== undefined) updatePayload.hero_video_url = payload.hero_video_url

  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", getSalesPageSlug(pageType))

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function uploadSalesPageImage(
  pageType: SalesPageType,
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const file = formData.get("file") as File | null
  const kind = formData.get("kind") as string | null
  if (!file || !kind) {
    return { success: false, error: "Missing file or kind" }
  }

  const supabase = createServiceRoleClient()
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const fileName = `sales-pages/${pageType}/${kind}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("dashboard-assets")
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: urlData } = supabase.storage.from("dashboard-assets").getPublicUrl(fileName)
  return { success: true, url: urlData.publicUrl }
}

export async function updateFoundersAvailability(payload: {
  founders_spots_available: number | null
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from("public_sales_pages")
    .update({
      founders_spots_available: payload.founders_spots_available,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "founders")
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateFoundersInviteSection(payload: {
  founders_invite_headline?: string | null
  founders_invite_body?: string | null
  founders_invite_media_url?: string | null
  founders_invite_media_type?: "image" | "video" | null
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.founders_invite_headline !== undefined) updatePayload.founders_invite_headline = payload.founders_invite_headline
  if (payload.founders_invite_body !== undefined) updatePayload.founders_invite_body = payload.founders_invite_body
  if (payload.founders_invite_media_url !== undefined) updatePayload.founders_invite_media_url = payload.founders_invite_media_url
  if (payload.founders_invite_media_type !== undefined) updatePayload.founders_invite_media_type = payload.founders_invite_media_type
  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", "founders")
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateFoundersComparisonSection(payload: {
  founders_comparison_headline?: string | null
  founders_comparison_subhead?: string | null
  founders_price_lifetime?: number | null
  founders_price_comparison_monthly?: number | null
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.founders_comparison_headline !== undefined) updatePayload.founders_comparison_headline = payload.founders_comparison_headline
  if (payload.founders_comparison_subhead !== undefined) updatePayload.founders_comparison_subhead = payload.founders_comparison_subhead
  if (payload.founders_price_lifetime !== undefined) updatePayload.founders_price_lifetime = payload.founders_price_lifetime
  if (payload.founders_price_comparison_monthly !== undefined) updatePayload.founders_price_comparison_monthly = payload.founders_price_comparison_monthly
  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", "founders")
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateFoundersClaimSection(payload: {
  founders_claim_headline?: string | null
  founders_claim_body?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.founders_claim_headline !== undefined) updatePayload.founders_claim_headline = payload.founders_claim_headline
  if (payload.founders_claim_body !== undefined) updatePayload.founders_claim_body = payload.founders_claim_body
  const { error } = await supabase
    .from("public_sales_pages")
    .update(updatePayload)
    .eq("slug", "founders")
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateFoundersFaq(payload: {
  founders_faq: { question: string; answer: string }[] | null
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from("public_sales_pages")
    .update({
      founders_faq: payload.founders_faq,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", "founders")
  if (error) return { success: false, error: error.message }
  return { success: true }
}
