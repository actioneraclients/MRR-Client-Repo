"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const SINGLETON_ID = 1

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

async function verifyAdminAccess() {
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

/**
 * This interface MUST mirror site_settings columns EXACTLY
 */
export interface SiteSettingsPayload {
  brand_primary_color?: string
  brand_accent_color?: string
  brand_background_color?: string
  brand_logo_url?: string
  site_title?: string
  meta_description?: string
  favicon_url?: string
  social_image_url?: string
  member_navigation?: unknown[]
  site_domain?: string
  upgrade_link?: string
  billing_link?: string
  site_terms_url?: string
  site_privacy_url?: string
  enable_google_auth?: boolean
  dashboard_settings?: {
    creator_headline?: string
    creator_message?: string
    creator_video_url?: string | null
    header_image_url?: string | null
    featured_tools?: string[]
    featured_groups?: string[]
    featured_content?: string[]
    featured_experts?: string[]
    featured_business?: string | null
    weekly_items?: Array<{ date: string; time: string; title: string; description: string; button_url: string }>
    featured_sections?: {
      groups?: string[]
      courses?: string[]
      masterclasses?: string[]
      experts?: string[]
      content?: string[]
      businesses?: string[]
      products?: string[]
      services?: string[]
      tools?: string[]
    }
    spotlight?: { media_url: string; headline: string; text: string; button_url: string }
  }
}

export async function updateSiteSettings(payload: SiteSettingsPayload): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  // CRITICAL: do NOT pass through unknown keys
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.brand_primary_color !== undefined) updatePayload.brand_primary_color = payload.brand_primary_color
  if (payload.brand_accent_color !== undefined) updatePayload.brand_accent_color = payload.brand_accent_color
  if (payload.brand_background_color !== undefined)
    updatePayload.brand_background_color = payload.brand_background_color
  if (payload.brand_logo_url !== undefined) updatePayload.brand_logo_url = payload.brand_logo_url
  if (payload.site_title !== undefined) updatePayload.site_title = payload.site_title
  if (payload.meta_description !== undefined) updatePayload.meta_description = payload.meta_description
  if (payload.favicon_url !== undefined) updatePayload.favicon_url = payload.favicon_url
  if (payload.social_image_url !== undefined) updatePayload.social_image_url = payload.social_image_url
  if (payload.member_navigation !== undefined) updatePayload.member_navigation = payload.member_navigation
  if (payload.site_domain !== undefined) updatePayload.site_domain = payload.site_domain
  if (payload.upgrade_link !== undefined) updatePayload.upgrade_link = payload.upgrade_link
  if (payload.billing_link !== undefined) updatePayload.billing_link = payload.billing_link
  if (payload.site_terms_url !== undefined) updatePayload.site_terms_url = payload.site_terms_url
  if (payload.site_privacy_url !== undefined) updatePayload.site_privacy_url = payload.site_privacy_url
  if (payload.enable_google_auth !== undefined) updatePayload.enable_google_auth = payload.enable_google_auth

  if (payload.dashboard_settings !== undefined) {
    // Fetch existing dashboard_settings first
    const { data: existingData } = await supabase
      .from("site_settings")
      .select("dashboard_settings")
      .eq("id", SINGLETON_ID)
      .single()

    const existingDashboardSettings = (existingData?.dashboard_settings as Record<string, unknown>) || {}

    // Merge: new values override existing, but preserve any keys not in the new payload
    updatePayload.dashboard_settings = {
      ...existingDashboardSettings,
      ...payload.dashboard_settings,
    }
  }

  const { error } = await supabase.from("site_settings").update(updatePayload).eq("id", SINGLETON_ID)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface DashboardDropdownData {
  tools: { id: string; name: string; image_url?: string | null }[]
  groups: { id: string; name: string; avatar_url?: string | null }[]
  contentItems: { id: string; title: string; content_type: string; image_url: string | null }[]
  experts: { id: string; name: string; title: string | null; image_url?: string | null }[]
  businesses: { id: string; name: string; logo_url?: string | null }[]
  courses: { id: string; title: string; thumbnail_url?: string | null }[]
  masterclasses: { id: string; title: string; image_path?: string | null }[]
  products: { id: string; name: string; image_url?: string | null }[]
  services: { id: string; name: string; image_url?: string | null }[]
  dashboardSettings: {
    creator_headline?: string
    creator_message?: string
    creator_video_url?: string
    header_image_url?: string | null
    featured_tools?: string[]
    featured_groups?: string[]
    featured_content?: string[]
    featured_experts?: string[]
    featured_business?: string | null
    weekly_items?: Array<{ date: string; time: string; title: string; description: string; button_url: string }>
    featured_sections?: Record<string, string[]>
    spotlight?: { media_url: string; headline: string; text: string; button_url: string }
  }
}

export async function getDashboardDropdownData(): Promise<{
  success: boolean
  data?: DashboardDropdownData
  error?: string
}> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  // Fetch active tools
  const { data: toolsData, error: toolsError } = await supabase
    .from("tools")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (toolsError) {
    return { success: false, error: `Failed to fetch tools: ${toolsError.message}` }
  }

  // Fetch active groups (not deleted)
  const { data: groupsData, error: groupsError } = await supabase
    .from("groups")
    .select("id, name")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (groupsError) {
    return { success: false, error: `Failed to fetch groups: ${groupsError.message}` }
  }

  const { data: contentData, error: contentError } = await supabase
    .from("content_entries")
    .select("id, title, content_type, image_url")
    .eq("status", "published")
    .order("title", { ascending: true })

  if (contentError) {
    return { success: false, error: `Failed to fetch content: ${contentError.message}` }
  }

  const { data: expertsData, error: expertsError } = await supabase
    .from("experts")
    .select("id, name, title")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (expertsError) {
    return { success: false, error: `Failed to fetch experts: ${expertsError.message}` }
  }

  const { data: businessesData } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("is_active", true)
    .order("name")

  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url")
    .eq("status", "approved")
    .order("title", { ascending: true })

  const { data: masterclassesData } = await supabase
    .from("masterclasses")
    .select("id, title, image_path")
    .in("status", ["approved", "live", "pending"])
    .order("title", { ascending: true })

  const { data: productsData } = await supabase
    .from("products")
    .select("id, name, image_url")
    .order("name", { ascending: true })

  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name, image_url")
    .order("name", { ascending: true })

  // Fetch current dashboard settings
  const { data: settingsData, error: settingsError } = await supabase
    .from("site_settings")
    .select("dashboard_settings")
    .eq("id", SINGLETON_ID)
    .single()

  if (settingsError) {
    return { success: false, error: `Failed to fetch settings: ${settingsError.message}` }
  }

  const dashboardSettings = (settingsData?.dashboard_settings as DashboardDropdownData["dashboardSettings"]) || {}

  return {
    success: true,
    data: {
      tools: toolsData || [],
      groups: groupsData || [],
      contentItems: contentData || [],
      experts: expertsData || [],
      businesses: businessesData || [],
      courses: coursesData || [],
      masterclasses: masterclassesData || [],
      products: productsData || [],
      services: servicesData || [],
      dashboardSettings: {
        creator_headline: typeof dashboardSettings.creator_headline === "string" ? dashboardSettings.creator_headline : "",
        creator_message: typeof dashboardSettings.creator_message === "string" ? dashboardSettings.creator_message : "",
        creator_video_url: typeof dashboardSettings.creator_video_url === "string" ? dashboardSettings.creator_video_url : "",
        header_image_url: dashboardSettings.header_image_url || null,
        featured_tools: dashboardSettings.featured_tools || [],
        featured_groups: dashboardSettings.featured_groups || [],
        featured_content: dashboardSettings.featured_content || [],
        featured_experts: dashboardSettings.featured_experts || [],
        featured_business: dashboardSettings.featured_business ?? null,
        weekly_items: Array.isArray(dashboardSettings.weekly_items) ? dashboardSettings.weekly_items : [],
        featured_sections: dashboardSettings.featured_sections && typeof dashboardSettings.featured_sections === "object" ? dashboardSettings.featured_sections : {},
        spotlight: dashboardSettings.spotlight && typeof dashboardSettings.spotlight === "object" ? dashboardSettings.spotlight : undefined,
      },
    },
  }
}
