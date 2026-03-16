import { createClient } from "@supabase/supabase-js"

export function normalizePublicSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export const RESERVED_PUBLIC_SLUGS = [
  "login",
  "reg",
  "signup",
  "admin",
  "dashboard",
  "api",
  "support",
  "terms",
  "privacy",
  "members",
  "onboarding",
  "founders",
  "preview",
  "reset-password",
  "forgot-password",
]

export function isReservedPublicSlug(slug: string) {
  return RESERVED_PUBLIC_SLUGS.includes(normalizePublicSlug(slug))
}

function getSupabaseServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export type PublicSlugConflictResult =
  | { conflict: false }
  | { conflict: true; source: "reserved" | "sales_page" | "opt_in_page" }

export async function getPublicSlugConflict(
  slug: string,
  options?: { ignoreSalesPageId?: string; ignoreOptInPageId?: string }
): Promise<PublicSlugConflictResult> {
  const normalized = normalizePublicSlug(slug)

  if (!normalized) {
    return { conflict: true, source: "reserved" }
  }

  if (isReservedPublicSlug(normalized)) {
    return { conflict: true, source: "reserved" }
  }

  const supabase = getSupabaseServiceClient()

  const salesPageQuery = supabase
    .from("sales_pages")
    .select("id")
    .eq("slug", normalized)
    .limit(1)

  if (options?.ignoreSalesPageId) {
    salesPageQuery.neq("id", options.ignoreSalesPageId)
  }

  const { data: salesPage } = await salesPageQuery.maybeSingle()

  if (salesPage) {
    return { conflict: true, source: "sales_page" }
  }

  const optInQuery = supabase
    .from("opt_in_pages")
    .select("id")
    .eq("slug", normalized)
    .limit(1)

  if (options?.ignoreOptInPageId) {
    optInQuery.neq("id", options.ignoreOptInPageId)
  }

  const { data: optInPage } = await optInQuery.maybeSingle()

  if (optInPage) {
    return { conflict: true, source: "opt_in_page" }
  }

  return { conflict: false }
}
