"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

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

export interface AdminBusinessListItem {
  id: string
  slug: string
  name: string
  logo_url: string | null
  short_description: string | null
  business_tags: string[]
  is_active: boolean
  is_featured: boolean
  is_sponsored: boolean
  created_at: string
  owner_name: string | null
}

interface AdminBusinessListResult {
  items: AdminBusinessListItem[]
}

export interface BusinessTagOption {
  id: string
  name: string
}

export async function getBusinessTags(): Promise<{ tags: BusinessTagOption[]; error?: string }> {
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
    .eq("type", "business_tag")
    .order("name", { ascending: true })
  if (error) {
    console.error("[getBusinessTags] error:", error)
    return { tags: [], error: "Failed to fetch business tags" }
  }
  return { tags: data ?? [] }
}

export async function getAdminBusinesses(): Promise<AdminBusinessListResult> {
  const { authorized } = await verifyAdminAccess()
  if (!authorized) {
    return { items: [] }
  }
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("businesses")
    .select("id, slug, name, logo_url, short_description, is_active, is_featured, is_sponsored, created_at, owner_id")
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) {
    console.error("[getAdminBusinesses] error:", error)
    return { items: [] }
  }
  const rows = data ?? []
  const ownerIds = [...new Set(rows.map((r) => (r as { owner_id?: string | null }).owner_id).filter(Boolean))] as string[]
  let ownerMap: Record<string, string | null> = {}
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    ownerMap = (profiles ?? []).reduce<Record<string, string | null>>((acc, p) => {
      acc[p.id] = (p as { full_name?: string | null }).full_name ?? null
      return acc
    }, {})
  }
  const items: AdminBusinessListItem[] = rows.map((row) => {
    const r = row as { owner_id?: string | null }
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      logo_url: row.logo_url,
      short_description: (row as { short_description?: string | null }).short_description ?? null,
      is_active: row.is_active,
      is_featured: row.is_featured ?? false,
      is_sponsored: row.is_sponsored ?? false,
      created_at: row.created_at,
      business_tags: [],
      owner_name: ownerMap[r.owner_id ?? ""] ?? null,
    }
  })
  return { items }
}

export async function createBusiness(input: {
  slug: string
  name: string
  logo_url: string | null
  business_tags: string[]
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
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
  const supabase = createServiceRoleClient()
  const { error: businessError } = await supabase.from("businesses").insert({
    slug: input.slug,
    name: input.name,
    logo_url: input.logo_url,
    is_active: true,
    is_featured: false,
    is_sponsored: false,
    owner_id: user?.id,
  })
  if (businessError) {
    console.error("[createBusiness] insert error:", businessError)
    return { success: false, error: "Failed to create business" }
  }
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function updateBusiness(input: {
  id: string
  slug?: string
  name?: string
  logo_url?: string | null
  business_tags?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const updatePayload: Record<string, unknown> = {}
  if (input.slug !== undefined) updatePayload.slug = input.slug
  if (input.name !== undefined) updatePayload.name = input.name
  if (input.logo_url !== undefined) updatePayload.logo_url = input.logo_url
  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: "No fields to update" }
  }
  const { error, count } = await supabase
    .from("businesses")
    .update(updatePayload)
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[updateBusiness] error:", error)
    return { success: false, error: "Failed to update business" }
  }
  if (count === 0) {
    return { success: false, error: "Business not found" }
  }
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function toggleBusinessActive(input: {
  id: string
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("businesses")
    .update({ is_active: input.is_active })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleBusinessActive] error:", error)
    return { success: false, error: "Failed to update business status" }
  }
  if (count === 0) {
    return { success: false, error: "Business not found" }
  }
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function toggleBusinessFeatured(input: {
  id: string
  is_featured: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("businesses")
    .update({ is_featured: input.is_featured })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleBusinessFeatured] error:", error)
    return { success: false, error: "Failed to update business featured status" }
  }
  if (count === 0) {
    return { success: false, error: "Business not found" }
  }
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function toggleBusinessSponsored(input: {
  id: string
  is_sponsored: boolean
}): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Sponsored flag not supported by current businesses schema" }
}

export async function featureBusiness(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("businesses").update({ is_featured: true }).eq("id", id)
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function unfeatureBusiness(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("businesses").update({ is_featured: false }).eq("id", id)
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function sponsorBusiness(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("businesses").update({ is_sponsored: false }).eq("is_sponsored", true)
  await supabase.from("businesses").update({ is_sponsored: true }).eq("id", id)
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export async function unsponsorBusiness(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("businesses").update({ is_sponsored: false }).eq("id", id)
  revalidatePath("/admin/businesses")
  revalidatePath("/members/productservices")
  return { success: true }
}

export type BusinessProfileForModal = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string
  category: string
  website_url: string | null
  social_links: Record<string, string> | string | null
  products: { id: string; name: string; description?: string }[]
  services: { id: string; name: string; description?: string }[]
}

export async function getBusinessProfileBySlug(slug: string): Promise<BusinessProfileForModal | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: biz, error } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, website_url, social_links")
    .eq("slug", slug)
    .single()
  if (error || !biz) return null
  const row = biz as { social_links?: Record<string, string> | string | null }
  const { data: serviceRows } = await supabase
    .from("services")
    .select("id, name, short_description")
    .eq("business_id", biz.id)
  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, short_description")
    .eq("business_id", biz.id)
  const products = (productRows ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? "",
    description: (p as { short_description?: string }).short_description ?? undefined,
  }))
  const services = (serviceRows ?? []).map((s) => ({
    id: s.id,
    name: s.name ?? "",
    description: (s as { short_description?: string }).short_description ?? undefined,
  }))
  return {
    id: biz.id,
    name: biz.name ?? "",
    slug: (biz as { slug?: string }).slug ?? "",
    logo_url: biz.logo_url ?? null,
    description: (biz as { description?: string }).description ?? "",
    category: "",
    website_url: (biz as { website_url?: string }).website_url ?? null,
    social_links: row.social_links ?? null,
    products,
    services,
  }
}
