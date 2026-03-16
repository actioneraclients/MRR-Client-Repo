"use server"

import { createClient } from "@/lib/supabase/server"

// UI-ready types (match client component expectations)
export type BusinessListItem = {
  id: string
  owner_id: string | null
  name: string
  slug: string
  logo_url: string | null
  description: string
  category: string
  website_url: string | null
  cta_text: string | null
  cta_url: string | null
  socials: { platform: string; url: string }[]
  products: { id: string; name: string; description?: string }[]
  services: { id: string; name: string; description?: string }[]
  is_sponsored?: boolean
}

export type ProductListItem = {
  id: string
  owner_id: string | null
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  business_id: string
  product_format: string
  price_text: string | null
  who_its_for: string
  benefits: string[]
  business: { id: string; name: string; logo_url: string | null }
  is_sponsored?: boolean
}

export type ServiceListItem = {
  id: string
  owner_id: string | null
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  business_id: string
  engagement_type: string
  delivery_format: string
  who_its_for: string
  benefits: string[]
  business: { id: string; name: string; logo_url: string | null }
  is_sponsored?: boolean
}

function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str
  return str.slice(0, maxLen).trim() + (str.length > maxLen ? "…" : "")
}

/** Fetch taxonomy tag names for given entity type and entity ids (batched). */
async function getTagsForEntities(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: string,
  entityIds: string[],
): Promise<Map<string, string[]>> {
  if (entityIds.length === 0) return new Map()
  const { data: relations } = await supabase
    .from("taxonomy_relations")
    .select("entity_id, taxonomy_id")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds)

  const taxonomyIds = Array.from(new Set((relations ?? []).map((r) => r.taxonomy_id).filter(Boolean)))
  const tagMap = new Map<string, string[]>()
  entityIds.forEach((id) => tagMap.set(id, []))

  if (taxonomyIds.length === 0) return tagMap

  const { data: taxonomies } = await supabase
    .from("taxonomies")
    .select("id, name")
    .in("id", taxonomyIds)

  const taxonomyById = new Map((taxonomies ?? []).map((t) => [t.id, t.name]))
  ;(relations ?? []).forEach((r) => {
    const name = taxonomyById.get(r.taxonomy_id)
    if (name) {
      const list = tagMap.get(r.entity_id) ?? []
      if (!list.includes(name)) list.push(name)
      tagMap.set(r.entity_id, list)
    }
  })
  return tagMap
}

/** Fetch taxonomy IDs for a single entity (for edit form). */
async function getTaxonomyIdsForEntity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: string,
  entityId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("taxonomy_relations")
    .select("taxonomy_id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
  return (data ?? []).map((r) => r.taxonomy_id).filter(Boolean)
}

export async function getBusinessById(id: string): Promise<{
  id: string
  name: string
  short_description: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  social_links: { linkedin?: string; instagram?: string; facebook?: string; twitter?: string } | null
  cta_text: string | null
  cta_url: string | null
  tag_ids: string[]
} | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, short_description, description, logo_url, website_url, social_links, cta_text, cta_url")
    .eq("id", id)
    .single()
  if (error || !data) return null
  const tagIds = await getTaxonomyIdsForEntity(supabase, "expert", id)
  const row = data as { short_description?: string; social_links?: unknown }
  return {
    id: data.id,
    name: data.name ?? "",
    short_description: row.short_description ?? "",
    description: data.description ?? null,
    logo_url: data.logo_url ?? null,
    website_url: data.website_url ?? null,
    social_links: (row.social_links as { linkedin?: string; instagram?: string; facebook?: string; twitter?: string }) ?? null,
    cta_text: data.cta_text ?? null,
    cta_url: data.cta_url ?? null,
    tag_ids: tagIds,
  }
}

export async function getServiceById(id: string): Promise<{
  id: string
  business_id: string
  name: string
  short_description: string
  description: string | null
  image_url: string | null
  price_label: string | null
  delivery_type: string | null
  cta_text: string | null
  cta_url: string | null
  tag_ids: string[]
} | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("services")
    .select("id, business_id, name, short_description, description, image_url, price_label, delivery_type, cta_text, cta_url")
    .eq("id", id)
    .single()
  if (error || !data) return null
  const tagIds = await getTaxonomyIdsForEntity(supabase, "service", id)
  const row = data as { short_description?: string }
  return {
    id: data.id,
    business_id: data.business_id ?? "",
    name: data.name ?? "",
    short_description: row.short_description ?? "",
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    price_label: data.price_label ?? null,
    delivery_type: data.delivery_type ?? null,
    cta_text: data.cta_text ?? null,
    cta_url: data.cta_url ?? null,
    tag_ids: tagIds,
  }
}

export async function getProductById(id: string): Promise<{
  id: string
  business_id: string
  name: string
  short_description: string
  description: string | null
  image_url: string | null
  product_format: string | null
  who_its_for: string | null
  benefits: string[]
  price_label: string | null
  cta_text: string | null
  cta_url: string | null
  tag_ids: string[]
} | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, business_id, name, short_description, description, image_url, product_format, who_its_for, benefits, price_label, cta_text, cta_url")
    .eq("id", id)
    .single()
  if (error || !data) return null
  const tagIds = await getTaxonomyIdsForEntity(supabase, "product", id)
  const row = data as { short_description?: string; who_its_for?: string; benefits?: string[] }
  return {
    id: data.id,
    business_id: data.business_id ?? "",
    name: data.name ?? "",
    short_description: row.short_description ?? "",
    description: data.description ?? null,
    image_url: data.image_url ?? null,
    product_format: row.product_format ?? null,
    who_its_for: row.who_its_for ?? null,
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    price_label: data.price_label ?? null,
    cta_text: data.cta_text ?? null,
    cta_url: data.cta_url ?? null,
    tag_ids: tagIds,
  }
}

export async function getBusinessesList(): Promise<BusinessListItem[]> {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("businesses")
    .select("id, owner_id, name, slug, description, logo_url, website_url, cta_text, cta_url, social_links, is_sponsored")
    .eq("status", "published")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("[getBusinessesList]", error)
    return []
  }
  const list = rows ?? []
  const entityIds = list.map((b) => b.id)
  const tagsMap = await getTagsForEntities(supabase, "business", entityIds)

  return list.map((b) => {
    const row = b as { owner_id?: string; social_links?: { linkedin?: string; instagram?: string; facebook?: string; twitter?: string } | null }
    const socials: { platform: string; url: string }[] = []
    if (row.social_links) {
      if (row.social_links.linkedin) socials.push({ platform: "linkedin", url: row.social_links.linkedin })
      if (row.social_links.instagram) socials.push({ platform: "instagram", url: row.social_links.instagram })
      if (row.social_links.facebook) socials.push({ platform: "facebook", url: row.social_links.facebook })
      if (row.social_links.twitter) socials.push({ platform: "twitter", url: row.social_links.twitter })
    }
    return {
      id: b.id,
      owner_id: row.owner_id ?? null,
      name: b.name ?? "",
      slug: (b as { slug?: string }).slug ?? "",
      logo_url: b.logo_url ?? null,
      description: b.description ?? "",
      category: (tagsMap.get(b.id)?.[0] as string) ?? "",
      website_url: b.website_url ?? null,
      cta_text: b.cta_text ?? null,
      cta_url: b.cta_url ?? null,
      socials,
      products: [],
      services: [],
      is_sponsored: (b as { is_sponsored?: boolean }).is_sponsored ?? false,
    }
  })
}

/** Full business profile for modal (by slug), with related products and services. */
export async function getBusinessBySlug(slug: string): Promise<{
  id: string
  owner_id: string | null
  name: string
  slug: string
  logo_url: string | null
  description: string
  category: string
  website_url: string | null
  cta_text: string | null
  cta_url: string | null
  social_links: Record<string, string> | string | null
  products: { id: string; name: string; description?: string }[]
  services: { id: string; name: string; description?: string }[]
} | null> {
  const supabase = await createClient()
  const { data: biz, error } = await supabase
    .from("businesses")
    .select("id, owner_id, name, slug, description, logo_url, website_url, cta_text, cta_url, social_links")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .single()
  if (error || !biz) return null
  const entityIds = [biz.id]
  const tagsMap = await getTagsForEntities(supabase, "business", entityIds)
  const row = biz as { owner_id?: string; social_links?: Record<string, string> | string | null }
  const { data: serviceRows } = await supabase
    .from("services")
    .select("id, name, short_description")
    .eq("business_id", biz.id)
    .eq("status", "published")
  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, short_description")
    .eq("business_id", biz.id)
    .eq("status", "published")
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
    owner_id: row.owner_id ?? null,
    name: biz.name ?? "",
    slug: (biz as { slug?: string }).slug ?? "",
    logo_url: biz.logo_url ?? null,
    description: biz.description ?? "",
    category: (tagsMap.get(biz.id)?.[0] as string) ?? "",
    website_url: biz.website_url ?? null,
    cta_text: biz.cta_text ?? null,
    cta_url: biz.cta_url ?? null,
    social_links: row.social_links ?? null,
    products,
    services,
  }
}

export async function getServicesList(): Promise<ServiceListItem[]> {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("services")
    .select("id, owner_id, business_id, name, short_description, description, image_url, price_label, delivery_type, cta_text, cta_url, is_sponsored")
    .eq("status", "published")
    .order("name", { ascending: true })

  if (error) {
    console.error("[getServicesList]", error)
    return []
  }
  const list = rows ?? []
  if (list.length === 0) return []

  const businessIds = Array.from(new Set(list.map((s) => s.business_id).filter(Boolean)))
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .in("id", businessIds)
  const businessMap = new Map((businesses ?? []).map((b) => [b.id, b]))

  const entityIds = list.map((s) => s.id)
  const tagsMap = await getTagsForEntities(supabase, "service", entityIds)

  return list.map((s) => {
    const biz = businessMap.get(s.business_id)
    const desc = s.description ?? ""
    const row = s as { short_description?: string | null; owner_id?: string }
    const shortDesc = row.short_description?.trim()
    return {
      id: s.id,
      owner_id: row.owner_id ?? null,
      name: s.name ?? "",
      short_description: shortDesc || truncate(desc, 160),
      long_description: desc,
      image_url: s.image_url ?? null,
      cta_text: s.cta_text ?? null,
      cta_url: s.cta_url ?? null,
      business_id: s.business_id ?? "",
      engagement_type: "",
      delivery_format: (s.delivery_type as string) ?? "",
      who_its_for: "",
      benefits: [],
      business: {
        id: biz?.id ?? s.business_id ?? "",
        name: biz?.name ?? "",
        logo_url: biz?.logo_url ?? null,
      },
      is_sponsored: (s as { is_sponsored?: boolean }).is_sponsored ?? false,
    }
  })
}

export async function getProductsList(): Promise<ProductListItem[]> {
  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from("products")
    .select("id, owner_id, business_id, name, short_description, description, image_url, product_format, who_its_for, benefits, price_label, cta_text, cta_url, is_sponsored")
    .eq("status", "published")
    .order("name", { ascending: true })

  if (error) {
    console.error("[getProductsList]", error)
    return []
  }
  const list = rows ?? []
  if (list.length === 0) return []

  const businessIds = Array.from(new Set(list.map((p) => p.business_id).filter(Boolean)))
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .in("id", businessIds)
  const businessMap = new Map((businesses ?? []).map((b) => [b.id, b]))

  const entityIds = list.map((p) => p.id)
  const tagsMap = await getTagsForEntities(supabase, "product", entityIds)

  return list.map((p) => {
    const biz = businessMap.get(p.business_id)
    const desc = p.description ?? ""
    const row = p as { short_description?: string | null; who_its_for?: string | null; benefits?: string[] | null; owner_id?: string }
    const shortDesc = row.short_description?.trim()
    const whoItsFor = row.who_its_for?.trim() ?? ""
    const benefitsList = Array.isArray(row.benefits) ? row.benefits : []
    return {
      id: p.id,
      owner_id: row.owner_id ?? null,
      name: p.name ?? "",
      short_description: shortDesc || truncate(desc, 160),
      long_description: desc,
      image_url: p.image_url ?? null,
      cta_text: p.cta_text ?? null,
      cta_url: p.cta_url ?? null,
      business_id: p.business_id ?? "",
      product_format: (p.product_format as string) ?? "",
      price_text: (p.price_label as string) ?? null,
      who_its_for: whoItsFor,
      benefits: benefitsList,
      business: {
        id: biz?.id ?? p.business_id ?? "",
        name: biz?.name ?? "",
        logo_url: biz?.logo_url ?? null,
      },
      is_sponsored: (p as { is_sponsored?: boolean }).is_sponsored ?? false,
    }
  })
}

/** Businesses owned by the current user (for Service/Product dropdown). */
export type MyBusinessOption = { id: string; name: string; logo_url: string | null }

export async function getMyBusinesses(): Promise<MyBusinessOption[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return []

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .eq("owner_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    console.error("[getMyBusinesses]", error)
    return []
  }
  return (data ?? []).map((b) => ({ id: b.id, name: b.name ?? "", logo_url: b.logo_url ?? null }))
}
