import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MasterclassTable, {
  type MasterclassRow,
  type CreatorOption,
} from "@/components/admin/masterclasses/MasterclassTable"

export const dynamic = "force-dynamic"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function getMasterclassImageUrl(
  supabase: SupabaseClient,
  imagePath: string | null
): string | null {
  if (!imagePath || !imagePath.trim()) return null
  const { data } = supabase.storage.from("masterclasses").getPublicUrl(imagePath)
  return data?.publicUrl ?? null
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

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default async function AdminMasterclassesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_creator")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.is_creator !== true) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Not authorized</p>
      </div>
    )
  }

  const { data: masterclasses } = await supabase
    .from("masterclasses")
    .select("id, title, description, topics, who_its_for, image_path, video_url, scheduled_at, duration_minutes, status, is_featured, is_sponsored, created_at, ends_at, creator_id")
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })

  const rows = masterclasses ?? []
  const creatorIds = [...new Set(rows.map((r) => r.creator_id).filter(Boolean))] as string[]
  const masterclassIds = rows.map((r) => r.id)

  const [creatorsRes, attendeesRes] = await Promise.all([
    creatorIds.length > 0
      ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", creatorIds)
      : Promise.resolve({ data: [] }),
    masterclassIds.length > 0
      ? supabase.from("masterclass_attendees").select("masterclass_id").in("masterclass_id", masterclassIds)
      : Promise.resolve({ data: [] }),
  ])

  const creatorsMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
  for (const c of creatorsRes.data ?? []) {
    creatorsMap.set(c.id, { full_name: c.full_name ?? null, avatar_url: c.avatar_url ?? null })
  }

  const attendeeCountMap: Record<string, number> = {}
  for (const a of attendeesRes.data ?? []) {
    const mid = a.masterclass_id
    if (mid) attendeeCountMap[mid] = (attendeeCountMap[mid] ?? 0) + 1
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const masterclassRows: MasterclassRow[] = rows.map((row) => {
    const creator = row.creator_id ? creatorsMap.get(row.creator_id) : null
    const avatarUrl = creator?.avatar_url
    const hostAvatarUrl = avatarUrl
      ? avatarUrl.startsWith("http")
        ? avatarUrl
        : `${baseUrl}/storage/v1/object/public/profiles/${avatarUrl}`
      : null
    return {
      id: row.id,
      title: row.title ?? "—",
      description: row.description ?? "",
      topics: parseTopics(row.topics),
      whoItsFor: row.who_its_for ?? null,
      videoUrl: row.video_url ?? null,
      imageUrl: getMasterclassImageUrl(supabase, row.image_path),
      hostName: creator?.full_name?.trim() ?? "—",
      hostAvatarUrl,
      scheduledAtFormatted: formatScheduledAt(row.scheduled_at),
      scheduledAt: row.scheduled_at ?? null,
      durationMinutes: row.duration_minutes ?? null,
      durationFormatted: row.duration_minutes != null ? `${row.duration_minutes} min` : "",
      status: row.status ?? "—",
      isFeatured: row.is_featured ?? false,
      isSponsored: row.is_sponsored ?? false,
      creatorId: row.creator_id ?? null,
      attendeeCount: attendeeCountMap[row.id] ?? 0,
    }
  })

  const creators: CreatorOption[] = (creatorsRes.data ?? []).map((c) => ({
    id: c.id,
    fullName: c.full_name?.trim() ?? "Unknown",
  })).sort((a, b) => a.fullName.localeCompare(b.fullName))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin • Masterclasses</h1>
      </div>
      <MasterclassTable masterclasses={masterclassRows} creators={creators} />
    </div>
  )
}
