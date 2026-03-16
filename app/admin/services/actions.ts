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

export type ServiceAdminListItem = {
  id: string
  slug: string
  name: string
  image_url: string | null
  short_description: string | null
  is_active: boolean
  is_featured: boolean
  is_sponsored: boolean
  created_at: string
  owner_name: string | null
}

export async function getAdminServices(): Promise<{ items: ServiceAdminListItem[] }> {
  const { authorized } = await verifyAdminAccess()
  if (!authorized) {
    return { items: [] }
  }
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, name, image_url, short_description, is_active, is_featured, is_sponsored, created_at, owner_id")
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) {
    console.error("[getAdminServices] error:", error)
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
  const items: ServiceAdminListItem[] = rows.map((row) => {
    const r = row as { owner_id?: string | null }
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      image_url: row.image_url ?? null,
      short_description: (row as { short_description?: string | null }).short_description ?? null,
      is_active: row.is_active ?? false,
      is_featured: row.is_featured ?? false,
      is_sponsored: row.is_sponsored ?? false,
      created_at: row.created_at ?? "",
      owner_name: ownerMap[r.owner_id ?? ""] ?? null,
    }
  })
  return { items }
}

/** Full service profile for View Service modal (by slug). */
export type ServiceProfileForModal = {
  id: string
  slug: string
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  price_text: string | null
  delivery_type: string
  cta_text: string | null
  cta_url: string | null
  business: { id: string; name: string; logo_url: string | null }
}

export async function getServiceBySlug(slug: string): Promise<ServiceProfileForModal | null> {
  const supabase = createServiceRoleClient()
  const { data: service, error } = await supabase
    .from("services")
    .select("id, slug, name, short_description, description, image_url, price_label, delivery_type, cta_text, cta_url, business_id")
    .eq("slug", slug)
    .single()
  if (error || !service) return null
  const businessId = (service as { business_id?: string }).business_id
  if (!businessId) {
    return {
      id: service.id,
      slug: (service as { slug?: string }).slug ?? "",
      name: service.name ?? "",
      short_description: ((service as { short_description?: string }).short_description ?? "").trim(),
      long_description: (service as { description?: string | null }).description ?? "",
      image_url: service.image_url ?? null,
      price_text: (service as { price_label?: string | null }).price_label ?? null,
      delivery_type: (service as { delivery_type?: string }).delivery_type ?? "",
      cta_text: (service as { cta_text?: string | null }).cta_text ?? null,
      cta_url: (service as { cta_url?: string | null }).cta_url ?? null,
      business: { id: businessId, name: "", logo_url: null },
    }
  }
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .eq("id", businessId)
    .single()
  return {
    id: service.id,
    slug: (service as { slug?: string }).slug ?? "",
    name: service.name ?? "",
    short_description: ((service as { short_description?: string }).short_description ?? "").trim(),
    long_description: (service as { description?: string | null }).description ?? "",
    image_url: service.image_url ?? null,
    price_text: (service as { price_label?: string | null }).price_label ?? null,
    delivery_type: (service as { delivery_type?: string }).delivery_type ?? "",
    cta_text: (service as { cta_text?: string | null }).cta_text ?? null,
    cta_url: (service as { cta_url?: string | null }).cta_url ?? null,
    business: {
      id: biz?.id ?? businessId,
      name: biz?.name ?? "",
      logo_url: biz?.logo_url ?? null,
    },
  }
}

export async function toggleServiceActive(input: {
  id: string
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("services")
    .update({ is_active: input.is_active })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleServiceActive] error:", error)
    return { success: false, error: "Failed to update service status" }
  }
  if (count === 0) {
    return { success: false, error: "Service not found" }
  }
  revalidatePath("/admin/services")
  return { success: true }
}

export async function toggleServiceFeatured(input: {
  id: string
  is_featured: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("services")
    .update({ is_featured: input.is_featured })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleServiceFeatured] error:", error)
    return { success: false, error: "Failed to update service featured status" }
  }
  if (count === 0) {
    return { success: false, error: "Service not found" }
  }
  revalidatePath("/admin/services")
  return { success: true }
}

export async function toggleServiceSponsored(input: {
  id: string
  is_sponsored: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("services")
    .update({ is_sponsored: input.is_sponsored })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleServiceSponsored] error:", error)
    return { success: false, error: "Failed to update service sponsored status" }
  }
  if (count === 0) {
    return { success: false, error: "Service not found" }
  }
  revalidatePath("/admin/services")
  return { success: true }
}

export async function featureService(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("services").update({ is_featured: true }).eq("id", id)
  revalidatePath("/admin/services")
  return { success: true }
}

export async function unfeatureService(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("services").update({ is_featured: false }).eq("id", id)
  revalidatePath("/admin/services")
  return { success: true }
}

export async function sponsorService(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("services").update({ is_sponsored: false }).eq("is_sponsored", true)
  await supabase.from("services").update({ is_sponsored: true }).eq("id", id)
  revalidatePath("/admin/services")
  return { success: true }
}

export async function unsponsorService(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("services").update({ is_sponsored: false }).eq("id", id)
  revalidatePath("/admin/services")
  return { success: true }
}
