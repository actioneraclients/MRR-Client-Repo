"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// =====================================================
// =====================================================

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

// =====================================================
// Types
// =====================================================

export interface AdminExpertListItem {
  id: string
  profile_id: string
  slug: string
  name: string
  title: string | null
  avatar_url: string | null
  business_name: string | null
  business_about: string | null
  bio: string | null
  website_url: string | null
  expert_tags: string[] | null
  is_active: boolean
  created_at: string
}

interface AdminExpertListResult {
  items: AdminExpertListItem[]
}

export interface ExpertTagOption {
  id: string
  name: string
}

export interface ProfileForExpertSelect {
  id: string
  full_name: string
  job_title: string | null
  avatar_url: string | null
  company: string | null
  bio: string | null
  plan_id: string | null
}

// =====================================================
// Admin: Get Expert Tags from Taxonomies
// =====================================================

export async function getExpertTags(): Promise<{ tags: ExpertTagOption[]; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { tags: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "expert_tag")
    .order("name", { ascending: true })

  if (error) {
    console.error("[getExpertTags] error:", error)
    return { tags: [], error: "Failed to fetch expert tags" }
  }

  return { tags: data ?? [] }
}

// =====================================================
// Admin: Get All Experts (active + inactive)
// =====================================================

export async function getAdminExperts(): Promise<AdminExpertListResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { items: [] }
  }

  const { data, error } = await supabase
    .from("experts")
    .select(
      `
      id,
      profile_id,
      slug,
      name,
      title,
      image_url,
      business_name,
      business_about,
      bio,
      website_url,
      expert_tags,
      is_active,
      created_at
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAdminExperts] error:", error)
    return { items: [] }
  }

  const items: AdminExpertListItem[] = (data ?? []).map((row) => ({
    id: row.id,
    profile_id: row.profile_id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    avatar_url: row.image_url,
    business_name: row.business_name,
    business_about: row.business_about,
    bio: row.bio,
    website_url: row.website_url,
    expert_tags: row.expert_tags,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  }))

  return { items }
}

// =====================================================
// Admin: Create Expert
// =====================================================

export async function createExpert(input: {
  profile_id: string
  slug: string
  name: string
  title: string
  image_url: string | null
  business_name: string | null
  business_about: string | null
  bio: string | null
  website_url: string | null
  expert_tags: string[]
  plan_id?: string
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const cookieStore = await cookies()
  const authSupabase = createServerClient(
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
  } = await authSupabase.auth.getUser()

  const { error: expertError } = await supabase.from("experts").insert({
    profile_id: input.profile_id,
    slug: input.slug,
    name: input.name,
    title: input.title,
    image_url: input.image_url,
    business_name: input.business_name,
    business_about: input.business_about,
    bio: input.bio,
    website_url: input.website_url,
    expert_tags: input.expert_tags,
    created_by: user?.id,
    is_active: true,
  })

  if (expertError) {
    console.error("[createExpert] insert error:", expertError)
    return { success: false, error: "Failed to create expert" }
  }

  if (input.plan_id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan_id: input.plan_id })
      .eq("id", input.profile_id)

    if (profileError) {
      console.error("[createExpert] profile update error:", profileError)
      return { success: false, error: "Expert created but failed to update profile plan" }
    }
  }

  revalidatePath("/admin/experts")
  revalidatePath("/members/experts")

  return { success: true }
}

// =====================================================
// Admin: Update Expert
// =====================================================

export async function updateExpert(input: {
  id: string
  slug?: string
  name?: string
  title?: string
  image_url?: string | null
  business_name?: string | null
  business_about?: string | null
  bio?: string | null
  website_url?: string | null
  expert_tags?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const updatePayload: Record<string, any> = {}

  if (input.slug !== undefined) updatePayload.slug = input.slug
  if (input.name !== undefined) updatePayload.name = input.name
  if (input.title !== undefined) updatePayload.title = input.title
  if (input.image_url !== undefined) updatePayload.image_url = input.image_url
  if (input.business_name !== undefined) updatePayload.business_name = input.business_name
  if (input.business_about !== undefined) updatePayload.business_about = input.business_about
  if (input.bio !== undefined) updatePayload.bio = input.bio
  if (input.website_url !== undefined) updatePayload.website_url = input.website_url
  if (input.expert_tags !== undefined) updatePayload.expert_tags = input.expert_tags

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: "No fields to update" }
  }

  const { error, count } = await supabase
    .from("experts")
    .update(updatePayload)
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[updateExpert] error:", error)
    return { success: false, error: "Failed to update expert" }
  }

  if (count === 0) {
    return { success: false, error: "Expert not found" }
  }

  revalidatePath("/admin/experts")
  revalidatePath("/members/experts")

  return { success: true }
}

// =====================================================
// Admin: Toggle Expert Active Status
// =====================================================

export async function toggleExpertActive(input: {
  id: string
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error, count } = await supabase
    .from("experts")
    .update({ is_active: input.is_active })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })

  if (error) {
    console.error("[toggleExpertActive] error:", error)
    return { success: false, error: "Failed to update expert status" }
  }

  if (count === 0) {
    return { success: false, error: "Expert not found" }
  }

  revalidatePath("/admin/experts")
  revalidatePath("/members/experts")

  return { success: true }
}

// =====================================================
// Admin: Get Profiles for Expert Select Dropdown
// =====================================================

export async function getProfilesForExpertSelect(): Promise<{
  profiles: ProfileForExpertSelect[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { profiles: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, avatar_url, company, bio, plan_id")
    .order("full_name", { ascending: true })

  if (error) {
    console.error("[getProfilesForExpertSelect] error:", error)
    return { profiles: [], error: "Failed to fetch profiles" }
  }

  return { profiles: data ?? [] }
}
