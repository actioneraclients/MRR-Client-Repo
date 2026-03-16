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

export type ProductAdminListItem = {
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

export async function getAdminProducts(): Promise<{ items: ProductAdminListItem[] }> {
  const { authorized } = await verifyAdminAccess()
  if (!authorized) {
    return { items: [] }
  }
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, image_url, short_description, is_active, is_featured, is_sponsored, created_at, owner_id")
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) {
    console.error("[getAdminProducts] error:", error)
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
  const items: ProductAdminListItem[] = rows.map((row) => {
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

/** Full product profile for View Product modal (by slug). Uses createClient() server-side. */
export type ProductProfileForModal = {
  id: string
  slug: string
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  product_format: string
  price_text: string | null
  who_its_for: string
  benefits: string[]
  cta_text: string | null
  cta_url: string | null
  business: { id: string; name: string; logo_url: string | null }
}

export async function getProductBySlug(slug: string): Promise<ProductProfileForModal | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: product, error } = await supabase
    .from("products")
    .select("id, slug, name, short_description, description, image_url, product_format, who_its_for, benefits, price_label, cta_text, cta_url, business_id")
    .eq("slug", slug)
    .single()
  if (error || !product) return null
  const businessId = (product as { business_id?: string }).business_id
  if (!businessId) {
    return {
      id: product.id,
      slug: (product as { slug?: string }).slug ?? "",
      name: product.name ?? "",
      short_description: ((product as { short_description?: string }).short_description ?? "").trim(),
      long_description: (product as { description?: string | null }).description ?? "",
      image_url: product.image_url ?? null,
      product_format: (product as { product_format?: string }).product_format ?? "",
      price_text: (product as { price_label?: string | null }).price_label ?? null,
      who_its_for: ((product as { who_its_for?: string }).who_its_for ?? "").trim(),
      benefits: Array.isArray((product as { benefits?: string[] }).benefits) ? (product as { benefits: string[] }).benefits : [],
      cta_text: (product as { cta_text?: string | null }).cta_text ?? null,
      cta_url: (product as { cta_url?: string | null }).cta_url ?? null,
      business: { id: businessId, name: "", logo_url: null },
    }
  }
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .eq("id", businessId)
    .single()
  return {
    id: product.id,
    slug: (product as { slug?: string }).slug ?? "",
    name: product.name ?? "",
    short_description: ((product as { short_description?: string }).short_description ?? "").trim(),
    long_description: (product as { description?: string | null }).description ?? "",
    image_url: product.image_url ?? null,
    product_format: (product as { product_format?: string }).product_format ?? "",
    price_text: (product as { price_label?: string | null }).price_label ?? null,
    who_its_for: ((product as { who_its_for?: string }).who_its_for ?? "").trim(),
    benefits: Array.isArray((product as { benefits?: string[] }).benefits) ? (product as { benefits: string[] }).benefits : [],
    cta_text: (product as { cta_text?: string | null }).cta_text ?? null,
    cta_url: (product as { cta_url?: string | null }).cta_url ?? null,
    business: {
      id: biz?.id ?? businessId,
      name: biz?.name ?? "",
      logo_url: biz?.logo_url ?? null,
    },
  }
}

export async function toggleProductActive(input: {
  id: string
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("products")
    .update({ is_active: input.is_active })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleProductActive] error:", error)
    return { success: false, error: "Failed to update product status" }
  }
  if (count === 0) {
    return { success: false, error: "Product not found" }
  }
  revalidatePath("/admin/products")
  return { success: true }
}

export async function toggleProductFeatured(input: {
  id: string
  is_featured: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("products")
    .update({ is_featured: input.is_featured })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleProductFeatured] error:", error)
    return { success: false, error: "Failed to update product featured status" }
  }
  if (count === 0) {
    return { success: false, error: "Product not found" }
  }
  revalidatePath("/admin/products")
  return { success: true }
}

export async function toggleProductSponsored(input: {
  id: string
  is_sponsored: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }
  const supabase = createServiceRoleClient()
  const { error, count } = await supabase
    .from("products")
    .update({ is_sponsored: input.is_sponsored })
    .eq("id", input.id)
    .select("id", { count: "exact", head: true })
  if (error) {
    console.error("[toggleProductSponsored] error:", error)
    return { success: false, error: "Failed to update product sponsored status" }
  }
  if (count === 0) {
    return { success: false, error: "Product not found" }
  }
  revalidatePath("/admin/products")
  return { success: true }
}

export async function featureProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("products").update({ is_featured: true }).eq("id", id)
  revalidatePath("/admin/products")
  return { success: true }
}

export async function unfeatureProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("products").update({ is_featured: false }).eq("id", id)
  revalidatePath("/admin/products")
  return { success: true }
}

export async function sponsorProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("products").update({ is_sponsored: false }).eq("is_sponsored", true)
  await supabase.from("products").update({ is_sponsored: true }).eq("id", id)
  revalidatePath("/admin/products")
  return { success: true }
}

export async function unsponsorProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }
  const supabase = createServiceRoleClient()
  await supabase.from("products").update({ is_sponsored: false }).eq("id", id)
  revalidatePath("/admin/products")
  return { success: true }
}
