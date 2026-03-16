"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  normalizePublicSlug,
  getPublicSlugConflict,
} from "@/lib/slug"

export type SalesPage = {
  id: string
  title: string
  slug: string
  is_homepage: boolean
  created_at: string
}

function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
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
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authorized: false, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .single()

  if (!profile?.is_creator) {
    return { authorized: false, error: "Not authorized" }
  }

  return { authorized: true, error: null }
}

export async function getSalesPages(): Promise<{
  success: boolean
  data?: SalesPage[]
  error?: string
}> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("sales_pages")
    .select("id, title, slug, is_homepage, created_at")
    .order("created_at", { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: (data ?? []) as SalesPage[] }
}

export async function createSalesPage(params: {
  title: string
  slug: string
  is_homepage: boolean
}): Promise<{ success: true } | { success: false; error: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const slugNormalized = normalizePublicSlug(params.slug)
  if (!slugNormalized) {
    return { success: false, error: "Slug cannot be empty" }
  }

  const conflict = await getPublicSlugConflict(slugNormalized)
  if (conflict.conflict) {
    return { success: false, error: "This URL slug is already in use or reserved." }
  }

  if (params.is_homepage) {
    const { error: updateError } = await supabase
      .from("sales_pages")
      .update({ is_homepage: false })
      .eq("is_homepage", true)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  }

  const { error: insertError } = await supabase.from("sales_pages").insert({
    title: params.title.trim(),
    slug: slugNormalized,
    is_homepage: params.is_homepage,
    sections: [],
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

const DEFAULT_SECTIONS = [
  { id: "hero-1", type: "hero", enabled: true, settings: {}, content: {} },
  { id: "vision-1", type: "community_vision", enabled: true, settings: {}, content: {} },
  { id: "member-1", type: "member_experience", enabled: true, settings: {}, content: {} },
  { id: "education-1", type: "education_section", enabled: true, settings: {}, content: {} },
  { id: "courses-1", type: "courses_section", enabled: true, settings: {}, content: {} },
  { id: "marketplace-1", type: "marketplace_section", enabled: true, settings: {}, content: {} },
  { id: "ai-1", type: "ai_mentors", enabled: true, settings: {}, content: {} },
  { id: "tool-1", type: "tool_highlight", enabled: true, settings: {}, content: {} },
  { id: "masterclasses-1", type: "masterclasses_highlight", enabled: true, settings: {}, content: {} },
  { id: "plans-1", type: "membership_plans", enabled: true, settings: {}, content: {} },
  { id: "founders-1", type: "founders_bridge", enabled: true, settings: {}, content: {} },
  { id: "cta-1", type: "cta", enabled: true, settings: {}, content: {} },
] as const

function migrateRawSections(
  rawSections: Array<{
    id: string
    type: string
    enabled: boolean
    data?: Record<string, unknown>
    settings?: Record<string, unknown>
    content?: Record<string, unknown>
  }>
): SalesPageSection[] {
  return rawSections.map((s) => {
    const rawContent = (s.content ?? s.data ?? {}) as Record<string, unknown>
    const settings = (s.settings ?? {}) as Record<string, unknown>
    let content = rawContent

    if (s.type === "community_vision") {
      const legacy = [
        rawContent.bullet_1 ?? rawContent.bullet1,
        rawContent.bullet_2 ?? rawContent.bullet2,
        rawContent.bullet_3 ?? rawContent.bullet3,
      ].filter(Boolean)
      const bullets = Array.isArray(rawContent.bullets) && rawContent.bullets.length > 0
        ? rawContent.bullets
        : legacy
      content = { ...rawContent, bullets }
    }

    if (s.type === "hero") {
      content = {
        ...rawContent,
        hero_text: rawContent.hero_text ?? rawContent.subheadline ?? "",
        hero_image: rawContent.hero_image ?? rawContent.background_image ?? "",
        primary_button_anchor: rawContent.primary_button_anchor ?? rawContent.primary_button_url ?? "#membership-plans",
        backgroundImage: rawContent.backgroundImage === true || rawContent.backgroundImage === "true",
      }
    }

    if (s.type === "member_experience") {
      const boxes = Array.isArray(rawContent.boxes) && rawContent.boxes.length > 0
        ? rawContent.boxes
        : [
            { icon: "", title: "Community Connection", bullet1: "Community feed and shared conversations", bullet2: "Discover members via the directory", bullet3: "Messaging and relationship-building" },
            { icon: "", title: "Groups & Experiences", bullet1: "Join groups by topic and intent", bullet2: "Participate in guided discussions", bullet3: "Attend community experiences and live sessions" },
            { icon: "", title: "Learning & Growth", bullet1: "Education content shared by contributors", bullet2: "Courses for deeper transformation", bullet3: "Tools and resources to support action" },
          ]
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "",
        subheadline: rawContent.subheadline ?? "",
        boxes,
      }
    }

    const sectionType = s.type === "education" ? "education_section" : s.type === "courses" ? "courses_section" : s.type === "marketplace" ? "marketplace_section" : s.type

    if (sectionType === "education_section") {
      content = {
        headline: rawContent.headline ?? "",
        description: rawContent.description ?? "",
        expert_id: rawContent.expert_id ?? null,
        video_id: rawContent.video_id ?? null,
        article_id: rawContent.article_id ?? null,
        audio_id: rawContent.audio_id ?? null,
        document_id: rawContent.document_id ?? null,
      }
    }

    if (sectionType === "courses_section") {
      const defaultFree = {
        description: "Lead generation + onboarding into the community",
        bullet1: "Open to all visitors",
        bullet2: "Introduction to community value",
        bullet3: "Gateway to membership",
      }
      const defaultMember = {
        description: "Included for certain membership levels",
        bullet1: "Exclusive to paying members",
        bullet2: "Core transformation content",
        bullet3: "Ongoing learning path",
      }
      const defaultPaid = {
        description: "Premium deep dives offered by selected creators",
        bullet1: "Advanced specialized training",
        bullet2: "Expert-led deep dives",
        bullet3: "Revenue opportunity for creators",
      }
      const free = (rawContent.free_courses as Record<string, unknown>) ?? {}
      const member = (rawContent.member_courses as Record<string, unknown>) ?? {}
      const paid = (rawContent.paid_courses as Record<string, unknown>) ?? {}
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "",
        subheadline: rawContent.subheadline ?? "",
        free_courses: {
          description: free.description ?? defaultFree.description,
          bullet1: free.bullet1 ?? defaultFree.bullet1,
          bullet2: free.bullet2 ?? defaultFree.bullet2,
          bullet3: free.bullet3 ?? defaultFree.bullet3,
        },
        member_courses: {
          description: member.description ?? defaultMember.description,
          bullet1: member.bullet1 ?? defaultMember.bullet1,
          bullet2: member.bullet2 ?? defaultMember.bullet2,
          bullet3: member.bullet3 ?? defaultMember.bullet3,
        },
        paid_courses: {
          description: paid.description ?? defaultPaid.description,
          bullet1: paid.bullet1 ?? defaultPaid.bullet1,
          bullet2: paid.bullet2 ?? defaultPaid.bullet2,
          bullet3: paid.bullet3 ?? defaultPaid.bullet3,
        },
        featured_image: rawContent.featured_image ?? "",
      }
    }

    if (sectionType === "marketplace_section") {
      const defaultHighlights = [
        { title: "Feature coaching and service offers", text: "Showcase your expertise through your offerings" },
        { title: "Create visibility with aligned members", text: "Reach people who already value what you do" },
        { title: "Build credibility through trusted association", text: "Your presence in the community adds authority" },
        { title: "Drive leads from community traffic", text: "Convert engaged members into clients" },
      ]
      const rawHighlights = rawContent.highlights
      const highlights = Array.isArray(rawHighlights) && rawHighlights.length > 0
        ? (rawHighlights as Record<string, unknown>[]).map((h) => ({
            title: String(h.title ?? ""),
            text: String(h.text ?? ""),
          }))
        : defaultHighlights
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "",
        subheadline: rawContent.subheadline ?? "",
        highlights,
        image_url: rawContent.image_url ?? "",
      }
    }

    if (sectionType === "tool_highlight") {
      const defaultFeatures = [
        { icon: "", title: "Feature One", subtitle: "Short explanation of this feature" },
        { icon: "", title: "Feature Two", subtitle: "Short explanation of this feature" },
        { icon: "", title: "Feature Three", subtitle: "Short explanation of this feature" },
        { icon: "", title: "Feature Four", subtitle: "Short explanation of this feature" },
      ]
      const rawFeatures = rawContent.features
      const features = Array.isArray(rawFeatures) && rawFeatures.length > 0
        ? (rawFeatures as Record<string, unknown>[]).map((f) => ({
            icon: String(f.icon ?? ""),
            title: String(f.title ?? ""),
            subtitle: String(f.subtitle ?? ""),
          }))
        : defaultFeatures
      content = {
        ...rawContent,
        badge_title: rawContent.badge_title ?? "Powerful Feature",
        headline: rawContent.headline ?? "Highlight Your Best Tools",
        subheadline: rawContent.subheadline ?? "Showcase powerful tools available inside your community.",
        features,
        image: rawContent.image ?? "",
      }
    }

    if (sectionType === "masterclasses_highlight") {
      const defaultBoxes = [
        {
          title: "LIVE Events",
          text: "Host powerful live sessions directly inside your community.",
          bullets: ["Schedule and promote upcoming sessions", "Engage members in real-time learning", "Record sessions for future viewing"],
        },
        {
          title: "Expert Led",
          text: "Invite experts to share their knowledge with your community.",
          bullets: ["Feature guest experts and speakers", "Deliver deep-dive training sessions", "Create high-value educational events"],
        },
        {
          title: "Lead Your Own",
          text: "Community owners can run their own masterclasses anytime.",
          bullets: ["Teach your expertise live", "Build authority in your niche", "Create repeat learning experiences"],
        },
      ]
      const rawBoxes = rawContent.boxes
      const boxes = Array.isArray(rawBoxes) && rawBoxes.length > 0
        ? (rawBoxes as Record<string, unknown>[]).map((b) => {
            const rawBullets = Array.isArray(b.bullets) ? (b.bullets as unknown[]).map((x) => String(x ?? "")) : [String(b.bullet1 ?? ""), String(b.bullet2 ?? ""), String(b.bullet3 ?? "")]
            const bullets = rawBullets.length >= 3 ? rawBullets.slice(0, 3) : [...rawBullets, ...Array(3 - rawBullets.length).fill("")]
            return { title: String(b.title ?? ""), text: String(b.text ?? ""), bullets }
          })
        : defaultBoxes
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "Host Powerful Masterclasses Inside Your Community",
        subheadline: rawContent.subheadline ?? "Bring your members together through live learning experiences led by experts and community leaders.",
        boxes,
        image: rawContent.image ?? "",
      }
    }

    if (sectionType === "membership_plans") {
      const rawPlans = rawContent.plans
      const plans = Array.isArray(rawPlans) ? rawPlans.filter((x) => typeof x === "string") : []
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "",
        subheadline: rawContent.subheadline ?? rawContent.intro ?? "",
        plans,
      }
    }

    if (sectionType === "founders_bridge") {
      content = {
        headline: rawContent.headline ?? "",
        subheadline: rawContent.subheadline ?? rawContent.description ?? "",
        button_text: rawContent.button_text ?? "",
        button_url: rawContent.button_url ?? rawContent.button_link ?? "",
      }
    }

    if (sectionType === "generic") {
      const rawBullets = rawContent.bullets
      const bullets = Array.isArray(rawBullets) ? (rawBullets as string[]).filter((x) => typeof x === "string") : []
      content = {
        headline: rawContent.headline ?? "",
        body: rawContent.body ?? "",
        bullets,
        image: rawContent.image ?? rawContent.image_url ?? "",
        video_url: rawContent.video_url ?? "",
        layout: rawContent.layout ?? "image-right",
      }
    }

    if (s.type === "community_features") {
      const features = Array.isArray(rawContent.features) && rawContent.features.length > 0
        ? rawContent.features
        : [
            {
              image: "",
              title: "Member Feed",
              description: "A central place for updates, insights, and conversation where members engage and contribute.",
              bullet1: "Real-time updates and member posts",
              bullet2: "Rich media support for images, videos, and links",
              bullet3: "Engagement through comments, reactions, and shares",
            },
            {
              image: "",
              title: "Groups",
              description: "Focused spaces for real discussion, accountability, and transformation.",
              bullet1: "Topic-specific and intent-based groups",
              bullet2: "Public and private group options",
              bullet3: "Leader-guided discussions and accountability",
            },
          ]
      content = {
        ...rawContent,
        headline: rawContent.headline ?? "",
        features,
      }
    }

    return {
      id: s.id,
      type: sectionType,
      enabled: s.enabled,
      content,
      settings,
    }
  })
}

export type SalesPageSection = {
  id: string
  type: string
  enabled: boolean
  settings?: Record<string, unknown>
  content?: Record<string, string | string[] | Array<Record<string, string>> | undefined>
}

export type SalesPageWithSections = {
  id: string
  title: string
  slug: string
  is_homepage: boolean
  sections: SalesPageSection[]
}

export async function getSalesPageById(
  id: string
): Promise<SalesPageWithSections | null> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return null
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("sales_pages")
    .select("id, title, slug, is_homepage, sections")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const rawSections = Array.isArray(data.sections) && data.sections.length > 0
    ? (data.sections as Array<{
        id: string
        type: string
        enabled: boolean
        data?: Record<string, unknown>
        settings?: Record<string, unknown>
        content?: Record<string, unknown>
      }>)
    : [...DEFAULT_SECTIONS]
  const sections = migrateRawSections(rawSections)

  return {
    id: data.id,
    title: data.title,
    slug: data.slug ?? "",
    is_homepage: data.is_homepage ?? false,
    sections,
  }
}

// Education section: dropdown options (admin only) and resolved data (public rendering)
export type EducationExpertOption = {
  id: string
  name: string
  image_url: string | null
  bio: string | null
}

export type EducationContentOption = {
  id: string
  title: string
  image_url: string | null
  description: string | null
}

export type PlanForMembershipSection = {
  id: string
  name: string
  slug: string | null
  description: string | null
  price: number | null
  currency: string | null
  billing: string | null
  features: string[] | null
  most_popular: boolean | null
  payment_url: string | null
}

export async function getPlansForMembershipSection(): Promise<PlanForMembershipSection[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from("plans")
    .select("id, name, slug, description, price, currency, billing, features, most_popular, payment_url")
    .eq("active", true)
    .order("name", { ascending: true })
  return (data ?? []) as PlanForMembershipSection[]
}

export async function getPlansByIdsForSection(planIds: string[]): Promise<PlanForMembershipSection[]> {
  if (planIds.length === 0) return []
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from("plans")
    .select("id, name, slug, description, price, currency, billing, features, most_popular, payment_url")
    .eq("active", true)
    .in("id", planIds)
  const plansById = new Map((data ?? []).map((p) => [p.id, p]))
  return planIds.map((id) => plansById.get(id)).filter((p): p is PlanForMembershipSection => p != null)
}

export async function getEducationSectionOptions(): Promise<{
  experts: EducationExpertOption[]
  video: EducationContentOption[]
  article: EducationContentOption[]
  audio: EducationContentOption[]
  document: EducationContentOption[]
}> {
  const supabase = createServiceRoleClient()

  const [expertsRes, videoRes, articleRes, audioRes, documentRes] = await Promise.all([
    supabase
      .from("experts")
      .select("id, name, image_url, bio")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("content_entries")
      .select("id, title, image_url, description")
      .eq("content_type", "Video")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("content_entries")
      .select("id, title, image_url, description")
      .eq("content_type", "Article")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("content_entries")
      .select("id, title, image_url, description")
      .eq("content_type", "Audio")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    supabase
      .from("content_entries")
      .select("id, title, image_url, description")
      .eq("content_type", "Document")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ])

  return {
    experts: (expertsRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name ?? "",
      image_url: r.image_url ?? null,
      bio: r.bio ?? null,
    })),
    video: (videoRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      image_url: r.image_url ?? null,
      description: r.description ?? null,
    })),
    article: (articleRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      image_url: r.image_url ?? null,
      description: r.description ?? null,
    })),
    audio: (audioRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      image_url: r.image_url ?? null,
      description: r.description ?? null,
    })),
    document: (documentRes.data ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? "",
      image_url: r.image_url ?? null,
      description: r.description ?? null,
    })),
  }
}

export type EducationSectionResolvedData = {
  expert: EducationExpertOption | null
  video: EducationContentOption | null
  article: EducationContentOption | null
  audio: EducationContentOption | null
  document: EducationContentOption | null
}

export async function getEducationSectionResolvedData(params: {
  expert_id: string | null
  video_id: string | null
  article_id: string | null
  audio_id: string | null
  document_id: string | null
}): Promise<EducationSectionResolvedData> {
  const supabase = createServiceRoleClient()
  const ids = [params.expert_id, params.video_id, params.article_id, params.audio_id, params.document_id].filter(
    Boolean
  ) as string[]
  if (ids.length === 0) {
    return { expert: null, video: null, article: null, audio: null, document: null }
  }

  const [expertRes, videoRes, articleRes, audioRes, documentRes] = await Promise.all([
    params.expert_id
      ? supabase.from("experts").select("id, name, image_url, bio").eq("id", params.expert_id).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null }),
    params.video_id
      ? supabase.from("content_entries").select("id, title, image_url, description").eq("id", params.video_id).eq("content_type", "Video").eq("status", "published").maybeSingle()
      : Promise.resolve({ data: null }),
    params.article_id
      ? supabase.from("content_entries").select("id, title, image_url, description").eq("id", params.article_id).eq("content_type", "Article").eq("status", "published").maybeSingle()
      : Promise.resolve({ data: null }),
    params.audio_id
      ? supabase.from("content_entries").select("id, title, image_url, description").eq("id", params.audio_id).eq("content_type", "Audio").eq("status", "published").maybeSingle()
      : Promise.resolve({ data: null }),
    params.document_id
      ? supabase.from("content_entries").select("id, title, image_url, description").eq("id", params.document_id).eq("content_type", "Document").eq("status", "published").maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const mapExpert = (r: { id: string; name: string | null; image_url: string | null; bio: string | null } | null) =>
    r ? { id: r.id, name: r.name ?? "", image_url: r.image_url ?? null, bio: r.bio ?? null } : null
  const mapContent = (r: { id: string; title: string | null; image_url: string | null; description: string | null } | null) =>
    r ? { id: r.id, title: r.title ?? "", image_url: r.image_url ?? null, description: r.description ?? null } : null

  return {
    expert: mapExpert(expertRes.data),
    video: mapContent(videoRes.data),
    article: mapContent(articleRes.data),
    audio: mapContent(audioRes.data),
    document: mapContent(documentRes.data),
  }
}

export async function updateSalesPageSections(
  pageId: string,
  sections: SalesPageSection[]
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from("sales_pages")
    .update({ sections })
    .eq("id", pageId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getHomepageSalesPage(): Promise<{
  id: string
  title: string
  slug: string
  sections: SalesPageSection[]
} | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("sales_pages")
    .select("id, title, slug, sections")
    .eq("is_homepage", true)
    .maybeSingle()

  if (error || !data) return null

  const rawSections = Array.isArray(data.sections) && data.sections.length > 0
    ? (data.sections as Array<{
        id: string
        type: string
        enabled: boolean
        data?: Record<string, unknown>
        settings?: Record<string, unknown>
        content?: Record<string, unknown>
      }>)
    : [...DEFAULT_SECTIONS]
  const sections = migrateRawSections(rawSections)

  return {
    id: data.id,
    title: data.title ?? "",
    slug: data.slug ?? "",
    sections,
  }
}

export async function duplicateSalesPage(
  id: string
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { data: page, error: fetchError } = await supabase
    .from("sales_pages")
    .select("id, title, slug, is_homepage, sections")
    .eq("id", id)
    .maybeSingle()

  if (fetchError || !page) {
    return { success: false, error: "Page not found" }
  }

  const newSlug = `${page.slug}-copy-${Date.now()}`
  const slugNormalized = normalizePublicSlug(newSlug)
  const conflict = await getPublicSlugConflict(slugNormalized)
  if (conflict.conflict) {
    return { success: false, error: "Could not generate unique slug for duplicate" }
  }

  const rawSections = Array.isArray(page.sections) ? page.sections : []
  const sections = rawSections.map((s: Record<string, unknown>, i: number) => ({
    ...s,
    id: `section-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
  }))

  const { data: newPage, error: insertError } = await supabase
    .from("sales_pages")
    .insert({
      title: `${page.title} Copy`,
      slug: slugNormalized,
      is_homepage: false,
      sections,
    })
    .select("id")
    .single()

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true, data: { id: newPage.id } }
}

export async function updateSalesPageMetadata(
  id: string,
  updates: { title?: string; slug?: string }
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()
  const data: Record<string, unknown> = {}

  if (updates.slug != null) {
    const slugNormalized = normalizePublicSlug(updates.slug)
    if (!slugNormalized) {
      return { success: false, error: "Slug cannot be empty" }
    }
    const conflict = await getPublicSlugConflict(slugNormalized, {
      ignoreSalesPageId: id,
    })
    if (conflict.conflict) {
      return { success: false, error: "This URL slug is already in use or reserved." }
    }
    data.slug = slugNormalized
  }

  if (updates.title != null) {
    data.title = updates.title.trim()
  }

  if (Object.keys(data).length === 0) return { success: true }

  const { error } = await supabase.from("sales_pages").update(data).eq("id", id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function setSalesPageHomepage(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error: clearError } = await supabase
    .from("sales_pages")
    .update({ is_homepage: false })
    .eq("is_homepage", true)

  if (clearError) {
    return { success: false, error: clearError.message }
  }

  const { error } = await supabase
    .from("sales_pages")
    .update({ is_homepage: true })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
