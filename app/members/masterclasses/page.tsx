import { createClient } from "@/lib/supabase/server"
import MasterclassesPageClient from "./masterclasses-page-client"
import { getUserMasterclassPermissions } from "./can-user-create-masterclass"

export const dynamic = "force-dynamic"

type MasterclassStatus = "live" | "upcoming" | "past"
type MasterclassBadge = "free" | "premium" | "featured"

export type MasterclassForUI = {
  id: string
  title: string
  description: string
  hostName: string
  hostAvatar: string
  date: string
  time: string
  scheduledAt: string | null
  duration: string
  status: MasterclassStatus
  badge: MasterclassBadge
  image: string
  imagePath: string | null
  topics: string[]
  planningToAttend: number
  canAccess: boolean
  isOwner: boolean
  isReservedByUser: boolean
  videoUrl?: string | null
  whoItsFor?: string | null
  is_sponsored?: boolean
}

function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return "/placeholder.svg?height=450&width=800&text=Masterclass"
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return `${base}/storage/v1/object/public/masterclasses/${imagePath}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function parseTopics(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === "string")
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : []
    } catch {
      return raw.split("\n").map((s) => s.trim()).filter(Boolean)
    }
  }
  return []
}

export default async function MasterclassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userPlanId: string | null = null
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_id")
      .eq("id", user.id)
      .maybeSingle()
    userPlanId = profile?.plan_id ?? null
  }

  const [masterclassesRes, accessRes, countsRes, fallbackCountsRes, reservedRes] = await Promise.all([
    supabase
      .from("masterclasses")
      .select(
        "id, title, description, topics, who_its_for, image_path, video_url, scheduled_at, ends_at, duration_minutes, status, is_featured, is_sponsored, creator_id"
      )
      .in("status", ["approved", "live", "completed"])
      .order("scheduled_at", { ascending: true }),
    supabase.from("masterclass_access_plans").select("masterclass_id, plan_id"),
    supabase.rpc("get_masterclass_attendee_counts"),
    supabase.from("masterclass_attendees").select("masterclass_id"),
    user?.id
      ? supabase.from("masterclass_attendees").select("masterclass_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ])

  const masterclasses = masterclassesRes.data ?? []
  const accessRows = accessRes.data ?? []
  const countsRows = countsRes.data
  const fallbackRows = fallbackCountsRes.data ?? []
  const reservedRows = reservedRes?.data ?? []

  const attendeeCountMap: Record<string, number> = {}
  if (!countsRes.error && Array.isArray(countsRows)) {
    for (const row of countsRows) {
      const mid = (row as { masterclass_id?: string }).masterclass_id
      const n = (row as { attendee_count?: number }).attendee_count
      if (mid != null) attendeeCountMap[mid] = Number(n ?? 0)
    }
  } else {
    for (const row of fallbackRows) {
      const mid = row.masterclass_id
      if (mid) attendeeCountMap[mid] = (attendeeCountMap[mid] ?? 0) + 1
    }
  }

  const reservedByUser = new Set(reservedRows.map((r) => r.masterclass_id).filter(Boolean))

  const accessByMasterclass = accessRows.reduce<Record<string, string[]>>((acc, row) => {
    const mid = row.masterclass_id
    if (!mid) return acc
    if (!acc[mid]) acc[mid] = []
    if (row.plan_id) acc[mid].push(row.plan_id)
    return acc
  }, {})

  const creatorIds = [...new Set(masterclasses.map((m) => m.creator_id).filter(Boolean))] as string[]
  const creatorsMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  if (creatorIds.length > 0) {
    const { data: creators } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", creatorIds)
    for (const c of creators ?? []) {
      creatorsMap[c.id] = { full_name: c.full_name, avatar_url: c.avatar_url }
    }
  }

  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)

  const toUI = (row: (typeof masterclasses)[0]): MasterclassForUI => {
    const planIds = accessByMasterclass[row.id] ?? []
    const accessible =
      planIds.length === 0 ? true : (userPlanId != null && planIds.includes(userPlanId))
    const isOwner = !!(user?.id && row.creator_id && user.id === row.creator_id)
    const creator = row.creator_id ? creatorsMap[row.creator_id] : null
    const hostName = creator?.full_name ?? "Host"
    const hostAvatar = creator?.avatar_url
      ? (creator.avatar_url.startsWith("http")
        ? creator.avatar_url
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/profiles/${creator.avatar_url}`)
      : "/placeholder.svg?height=64&width=64&text=" + hostName.slice(0, 2).toUpperCase()

    const scheduledAt = row.scheduled_at ? new Date(row.scheduled_at) : null
    const endsAt = row.ends_at ? new Date(row.ends_at) : null

    let status: MasterclassStatus = "upcoming"
    if (row.status === "completed") status = "past"
    else if (row.status === "live" && scheduledAt && endsAt && now >= scheduledAt && now <= endsAt)
      status = "live"
    else if (row.status === "approved" || row.status === "live") status = "upcoming"

    const badge: MasterclassBadge = row.is_featured ? "featured" : "free"

    return {
      id: row.id,
      title: row.title ?? "",
      description: row.description ?? "",
      hostName,
      hostAvatar,
      date: scheduledAt ? formatDate(scheduledAt) : "",
      time: scheduledAt ? formatTime(scheduledAt) : "",
      scheduledAt: row.scheduled_at ?? null,
      duration: row.duration_minutes ? `${row.duration_minutes} min` : "",
      status,
      badge,
      image: getImageUrl(row.image_path),
      imagePath: row.image_path ?? null,
      topics: parseTopics(row.topics),
      planningToAttend: attendeeCountMap[row.id] ?? 0,
      canAccess: accessible,
      isOwner,
      isReservedByUser: reservedByUser.has(row.id),
      videoUrl: row.video_url,
      whoItsFor: row.who_its_for ?? null,
      is_sponsored: (row as { is_sponsored?: boolean }).is_sponsored ?? false,
    }
  }

  const allUI = masterclasses.map(toUI)

  const liveMasterclass = allUI.find((m) => m.status === "live") ?? null

  const sponsoredMasterclass = allUI.find((m) => m.is_sponsored) ?? null

  const masterclassesWithoutSponsored = allUI.filter((m) => !m.is_sponsored)

  const featuredMasterclasses = masterclassesWithoutSponsored.filter(
    (m) => m.badge === "featured" && m.status !== "past"
  )

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const thisWeekMasterclasses = masterclassesWithoutSponsored.filter((m) => {
    const row = masterclasses.find((r) => r.id === m.id)
    if (!row?.scheduled_at || row.status !== "approved") return false
    const d = new Date(row.scheduled_at)
    return d >= now && d <= sevenDaysFromNow
  })

  const pastMasterclasses = masterclassesWithoutSponsored.filter((m) => m.status === "past")

  const upcomingMasterclasses = masterclassesWithoutSponsored
    .filter((m) => {
      const row = masterclasses.find((r) => r.id === m.id)
      if (!row?.scheduled_at || row.status === "completed") return false
      const scheduled = new Date(row.scheduled_at)
      return scheduled > endOfWeek
    })
    .sort((a, b) => {
      const rowA = masterclasses.find((r) => r.id === a.id)
      const rowB = masterclasses.find((r) => r.id === b.id)
      const timeA = rowA?.scheduled_at ? new Date(rowA.scheduled_at).getTime() : 0
      const timeB = rowB?.scheduled_at ? new Date(rowB.scheduled_at).getTime() : 0
      return timeA - timeB
    })

  const { canCreateMasterclass, remainingMasterclasses } =
    await getUserMasterclassPermissions()

  let pageTitle = "Masterclasses"
  let pageDescription = "Live expert-led sessions designed to help you grow and connect."
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("member_navigation")
    .limit(1)
    .maybeSingle()
  const rawNav = siteSettings?.member_navigation
  if (rawNav != null) {
    let navItems: { id?: string; label?: string }[] | null = null
    if (Array.isArray(rawNav)) {
      navItems = rawNav as { id?: string; label?: string }[]
    } else if (typeof rawNav === "string") {
      try {
        const parsed = JSON.parse(rawNav)
        navItems = Array.isArray(parsed) ? (parsed as { id?: string; label?: string }[]) : null
      } catch {
        navItems = null
      }
    }
    if (navItems?.length) {
      const mcNav = navItems.find((item) => item?.id === "masterclasses")
      if (mcNav?.label != null && String(mcNav.label).trim() !== "") {
        pageTitle = String(mcNav.label).trim()
      }
    }
  }

  return (
    <MasterclassesPageClient
      featuredMasterclasses={featuredMasterclasses}
      liveMasterclass={liveMasterclass}
      sponsoredMasterclass={sponsoredMasterclass}
      thisWeekMasterclasses={thisWeekMasterclasses}
      upcomingMasterclasses={upcomingMasterclasses}
      pastMasterclasses={pastMasterclasses}
      canCreateMasterclass={canCreateMasterclass}
      remainingMasterclasses={remainingMasterclasses}
      attendeeCountMap={attendeeCountMap}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    />
  )
}
