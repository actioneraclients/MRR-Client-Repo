"use server"

import { createClient } from "@/lib/supabase/server"

type GetDirectoryMembersInput = {
  page?: number
  pageSize?: number
  name?: string
  city?: string
  country?: string
}

function normalizeSocial(raw: unknown): {
  linkedin: string | null
  youtube: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  twitter: string | null
  x: string | null
  website: string | null
} {
  const defaults = {
    linkedin: null,
    youtube: null,
    instagram: null,
    facebook: null,
    tiktok: null,
    twitter: null,
    x: null,
    website: null,
  }

  if (!raw || typeof raw !== "object") return defaults

  // Handle array format: [{ platform: "linkedin", url: "..." }, ...]
  if (Array.isArray(raw)) {
    const result = { ...defaults }
    for (const item of raw) {
      if (item && typeof item === "object" && typeof item.platform === "string" && typeof item.url === "string") {
        const key = item.platform.toLowerCase() as keyof typeof defaults
        if (key in result) {
          result[key] = item.url
        }
      }
    }
    return result
  }

  // Handle object format: { linkedin: "...", twitter: "..." }
  const obj = raw as Record<string, unknown>
  return {
    linkedin: typeof obj.linkedin === "string" ? obj.linkedin : null,
    youtube: typeof obj.youtube === "string" ? obj.youtube : null,
    instagram: typeof obj.instagram === "string" ? obj.instagram : null,
    facebook: typeof obj.facebook === "string" ? obj.facebook : null,
    tiktok: typeof obj.tiktok === "string" ? obj.tiktok : null,
    twitter: typeof obj.twitter === "string" ? obj.twitter : null,
    x: typeof obj.x === "string" ? obj.x : null,
    website: typeof obj.website === "string" ? obj.website : null,
  }
}

export async function getDirectoryMembers(input: GetDirectoryMembersInput = {}) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  const authUser = authData?.user?.id ?? null
  const authError = authErr?.message ?? null

  // 2. Raw directory_members count
  const { count: directoryMembersCount, error: dmErr } = await supabase
    .from("directory_members")
    .select("user_id", { count: "exact", head: true })
  const directoryMembersError = dmErr?.message ?? null

  // 3. Raw profiles count (limit 5)
  const {
    data: profilesData,
    count: profilesCount,
    error: profErr,
  } = await supabase.from("profiles").select("id, full_name", { count: "exact" }).limit(5)
  const profilesError = profErr?.message ?? null

  // 4. FK embed test
  const { data: embedRows, error: embedErr } = await supabase
    .from("directory_members")
    .select(`
      user_id,
      profiles!directory_members_user_id_fkey (
        id,
        full_name
      )
    `)
    .limit(5)
  const embedError = embedErr?.message ?? null

  const debug = {
    authUser,
    authError,
    directoryMembersCount,
    directoryMembersError,
    profilesCount,
    profilesError,
    embedRows,
    embedError,
  }

  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20
  const nameFilter = (input.name ?? "").trim()
  const cityFilter = (input.city ?? "").trim()
  const countryFilter = (input.country ?? "").trim()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from("directory_members").select(
    `
      user_id,
      created_at,
      profiles!directory_members_user_id_fkey (
        id,
        full_name,
        avatar_url,
        company,
        job_title,
        bio,
        city,
        country,
        social_links
      )
    `,
    { count: "exact" },
  )

  // Apply name filter (ILIKE on embedded profiles)
  if (nameFilter.length > 0) {
    query = query.ilike("profiles.full_name", `%${nameFilter}%`)
  }

  // Apply city filter (ILIKE on embedded profiles)
  if (cityFilter.length > 0) {
    query = query.ilike("profiles.city", `%${cityFilter}%`)
  }

  // Apply country filter (exact match on embedded profiles)
  if (countryFilter.length > 0) {
    query = query.eq("profiles.country", countryFilter)
  }

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data: rows, error, count } = await query

  if (error || !rows) {
    return {
      debug,
      members: [],
      totalCount: count ?? 0,
      error: error?.message ?? null,
    }
  }

  const members = rows
    .filter((row) => row.profiles !== null)
    .map((row) => {
      const profile = row.profiles as {
        id: string
        full_name: string | null
        avatar_url: string | null
        company: string | null
        job_title: string | null
        bio: string | null
        city: string | null
        country: string | null
        social_links: unknown
      } | null

      return {
        id: row.user_id,
        memberSince: row.created_at,
        name: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        businessName: profile?.company ?? null,
        expertise: profile?.job_title ?? null,
        bio: profile?.bio ?? null,
        social: normalizeSocial(profile?.social_links),
      }
    })

  return {
    debug,
    members,
    totalCount: count ?? members.length,
    error: null,
  }
}
