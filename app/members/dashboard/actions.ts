"use server"

import { createClient } from "@/lib/supabase/server"

export type WeeklyItem = {
  date: string
  time: string
  title: string
  description: string
  button_url: string
}

export type SpotlightSettings = {
  media_url: string
  headline: string
  text: string
  button_url: string
}

function getYouTubeThumbnail(url: string | null): string | null {
  if (!url?.trim()) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null
}

export type InboxActivity = {
  unreadMessages: number
  siteUpdates: number
  groupMessages: number
}

export type Dashboard2Data = {
  displayName: string
  profileCompletePercent: number
  creatorHeadline: string
  creatorMessage: string | null
  creatorVideoUrl: string | null
  creatorVideoThumbnailUrl: string | null
  weeklyItems: WeeklyItem[]
  featuredSections: Record<string, unknown[]>
  spotlight: SpotlightSettings | null
  brandAccentColor: string
  inboxActivity: InboxActivity
}

function getMasterclassImageUrl(imagePath: string | null): string | null {
  if (!imagePath?.trim()) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return `${base}/storage/v1/object/public/masterclasses/${imagePath}`
}

export async function getDashboard2Data(): Promise<Dashboard2Data> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, full_name, avatar_url, bio, social_links")
    .eq("id", user?.id ?? "")
    .maybeSingle()

  const fullNameFromMeta = user?.user_metadata?.full_name as string | undefined
  const firstWordOfFullName = fullNameFromMeta?.trim?.()?.split(/\s+/)?.[0]
  const displayName =
    profile?.first_name?.trim() || firstWordOfFullName || "Member"

  const profileChecks = {
    name: !!(profile?.first_name || profile?.full_name),
    avatar: !!profile?.avatar_url,
    bio: !!profile?.bio,
    website:
      !!profile?.social_links &&
      typeof profile.social_links === "object" &&
      Object.keys(profile.social_links).length > 0,
  }
  const completedCount = Object.values(profileChecks).filter(Boolean).length
  const totalChecks = 4
  const profileCompletePercent = Math.round((completedCount / totalChecks) * 100)

  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("dashboard_settings, brand_accent_color")
    .single()

  const dashboard = (settingsData?.dashboard_settings as Record<string, unknown>) || {}
  const brandAccentColor =
    (typeof settingsData?.brand_accent_color === "string" && settingsData.brand_accent_color.trim()
      ? settingsData.brand_accent_color
      : "#2563eb") as string
  const creatorHeadline = (typeof dashboard.creator_headline === "string" ? dashboard.creator_headline : "") || ""
  const creatorMessage = typeof dashboard.creator_message === "string" ? dashboard.creator_message : null
  const creatorVideoUrl = typeof dashboard.creator_video_url === "string" ? dashboard.creator_video_url : null
  const rawWeeklyItems: WeeklyItem[] = Array.isArray(dashboard.weekly_items) ? dashboard.weekly_items : []
  const weeklyItems: WeeklyItem[] = rawWeeklyItems.filter(
    (event) => event?.title && typeof event.title === "string" && event.title.trim().length > 0
  )
  const featuredSections = (dashboard.featured_sections && typeof dashboard.featured_sections === "object"
    ? dashboard.featured_sections
    : {}) as Record<string, string[]>
  const spotlight = dashboard.spotlight && typeof dashboard.spotlight === "object"
    ? (dashboard.spotlight as SpotlightSettings)
    : null

  const sectionIds = {
    groups: featuredSections.groups || [],
    courses: featuredSections.courses || [],
    masterclasses: featuredSections.masterclasses || [],
    experts: featuredSections.experts || [],
    content: featuredSections.content || [],
    businesses: featuredSections.businesses || [],
    products: featuredSections.products || [],
    services: featuredSections.services || [],
    tools: featuredSections.tools || [],
  }

  const [groupsRes, coursesRes, masterclassesRes, expertsRes, contentRes, businessesRes, productsRes, servicesRes, toolsRes] =
    await Promise.all([
      sectionIds.groups.length
        ? supabase
            .from("groups")
            .select("id, name, description, avatar_url, listing_image_url, slug")
            .in("id", sectionIds.groups)
            .eq("status", "active")
        : Promise.resolve({ data: [] }),
      sectionIds.courses.length
        ? supabase
            .from("courses")
            .select("id, title, description, thumbnail_url")
            .in("id", sectionIds.courses)
            .eq("status", "approved")
        : Promise.resolve({ data: [] }),
      sectionIds.masterclasses.length
        ? supabase
            .from("masterclasses")
            .select("id, title, description, image_path, scheduled_at, status")
            .in("id", sectionIds.masterclasses)
        : Promise.resolve({ data: [] }),
      sectionIds.experts.length
        ? supabase
            .from("experts")
            .select("id, name, title, image_url, bio, slug")
            .in("id", sectionIds.experts)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      sectionIds.content.length
        ? supabase
            .from("content_entries")
            .select("id, title, description, image_url, content_type, slug")
            .in("id", sectionIds.content)
            .eq("status", "published")
        : Promise.resolve({ data: [] }),
      sectionIds.businesses.length
        ? supabase
            .from("businesses")
            .select("id, name, logo_url, description, short_description, slug")
            .in("id", sectionIds.businesses)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      sectionIds.products.length
        ? supabase
            .from("products")
            .select("id, name, short_description, image_url, price_label")
            .in("id", sectionIds.products)
        : Promise.resolve({ data: [] }),
      sectionIds.services.length
        ? supabase
            .from("services")
            .select("id, name, short_description, image_url, price_label")
            .in("id", sectionIds.services)
        : Promise.resolve({ data: [] }),
      sectionIds.tools.length
        ? supabase
            .from("tools")
            .select("id, name, short_description, image_url, launch_url")
            .in("id", sectionIds.tools)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
    ])

  const preserveOrder = <T extends { id: string }>(arr: T[], ids: string[]): T[] => {
    const map = new Map(arr.map((x) => [x.id, x]))
    return ids.map((id) => map.get(id)).filter(Boolean) as T[]
  }

  const groups = preserveOrder(groupsRes.data || [], sectionIds.groups).slice(0, 3)
  const courses = preserveOrder(coursesRes.data || [], sectionIds.courses).slice(0, 3)
  const masterclasses = preserveOrder(masterclassesRes.data || [], sectionIds.masterclasses)
    .slice(0, 3)
    .map((m) => ({
    ...m,
    image_url: getMasterclassImageUrl(m.image_path),
  }))
  const experts = preserveOrder(expertsRes.data || [], sectionIds.experts).slice(0, 3)
  const content = preserveOrder(contentRes.data || [], sectionIds.content).slice(0, 3)
  const businesses = preserveOrder(businessesRes.data || [], sectionIds.businesses).slice(0, 3)
  const products = preserveOrder(productsRes.data || [], sectionIds.products).slice(0, 3)
  const services = preserveOrder(servicesRes.data || [], sectionIds.services).slice(0, 3)
  const tools = preserveOrder(toolsRes.data || [], sectionIds.tools).slice(0, 3)

  let inboxActivity: InboxActivity = { unreadMessages: 0, siteUpdates: 0, groupMessages: 0 }
  if (user?.id) {
    const [convosRes, updatesRes, readsRes, groupMsgsRes, groupReadsRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("id, participant_one, participant_two, last_message_at, participant_one_last_read_at, participant_two_last_read_at")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`),
      supabase.from("site_updates").select("id"),
      supabase.from("site_update_reads").select("site_update_id").eq("user_id", user.id),
      supabase.from("messages").select("id").not("group_id", "is", null),
      supabase.from("group_message_reads").select("message_id").eq("user_id", user.id).is("hidden_at", null),
    ])
    const convos = convosRes.data || []
    const unreadConvos = convos.filter((c: { participant_one: string; participant_two: string; last_message_at: string | null; participant_one_last_read_at: string | null; participant_two_last_read_at: string | null }) => {
      if (!c.last_message_at) return false
      const isP1 = c.participant_one === user.id
      const myRead = isP1 ? c.participant_one_last_read_at : c.participant_two_last_read_at
      return !myRead || new Date(c.last_message_at) > new Date(myRead)
    })
    const readUpdateIds = new Set((readsRes.data || []).map((r: { site_update_id: string }) => r.site_update_id))
    const unreadUpdates = (updatesRes.data || []).filter((u: { id: string }) => !readUpdateIds.has(u.id)).length
    const readGroupIds = new Set((groupReadsRes.data || []).map((r: { message_id: string }) => r.message_id))
    const unreadGroup = (groupMsgsRes.data || []).filter((m: { id: string }) => !readGroupIds.has(m.id)).length
    inboxActivity = { unreadMessages: unreadConvos.length, siteUpdates: unreadUpdates, groupMessages: unreadGroup }
  }

  return {
    displayName,
    profileCompletePercent,
    creatorHeadline,
    creatorMessage,
    creatorVideoUrl,
    creatorVideoThumbnailUrl: getYouTubeThumbnail(creatorVideoUrl) || "https://storage.googleapis.com/uxpilot-auth.appspot.com/founder-message-video.jpg",
    weeklyItems,
    featuredSections: {
      groups,
      courses,
      masterclasses,
      experts,
      content,
      businesses,
      products,
      services,
      tools,
    },
    spotlight,
    brandAccentColor,
    inboxActivity,
  }
}
