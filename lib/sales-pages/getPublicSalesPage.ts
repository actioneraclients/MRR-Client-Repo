"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  ActivePlanForSalesPage,
  SalesPageRow,
} from "@/app/admin/sales-pages/sales-page-actions"

/**
 * Load the main public sales page from public_sales_pages (slug = "home").
 * Single source of truth for "/" and admin View Page preview.
 * Server-only; do not call from client.
 */
export async function getPublicSalesPage(): Promise<SalesPageRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("public_sales_pages")
    .select("*")
    .eq("slug", "home")
    .maybeSingle()

  return data as SalesPageRow | null
}

/**
 * Load the public sales page and plans to show in the Membership section.
 * - If selected_plan_ids is null or empty, returns all active plans (DB order).
 * - If selected_plan_ids is set, returns only those plans in that exact order; missing IDs are skipped.
 * Server-only; do not call from client.
 */
export async function getPublicSalesPageWithPlans(): Promise<{
  salesPage: SalesPageRow | null
  orderedPlans: ActivePlanForSalesPage[]
}> {
  const supabase = await createClient()

  const [pageResult, plansResult] = await Promise.all([
    supabase
      .from("public_sales_pages")
      .select("*")
      .eq("slug", "home")
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, name, description, price, currency, billing, features, most_popular, payment_url")
      .eq("active", true),
  ])

  const salesPage = (pageResult.data ?? null) as SalesPageRow | null
  const allPlans = (plansResult.data ?? []) as ActivePlanForSalesPage[]

  const plansById = new Map<string, ActivePlanForSalesPage>()
  for (const p of allPlans) plansById.set(p.id, p)

  const ids = salesPage?.selected_plan_ids
  if (ids == null || ids.length === 0) {
    return { salesPage, orderedPlans: allPlans }
  }

  const orderedPlans = ids
    .map((id) => plansById.get(id))
    .filter((p): p is ActivePlanForSalesPage => p != null)

  return { salesPage, orderedPlans }
}

/**
 * Load both public_sales_pages rows (slug = "home" and slug = "founders") and all active plans
 * for the admin sales pages UI. Server-only; do not call from client.
 */
export async function getAdminSalesPagesWithPlans(): Promise<{
  mainSalesPage: SalesPageRow | null
  foundersSalesPage: SalesPageRow | null
  orderedPlans: ActivePlanForSalesPage[]
}> {
  const supabase = await createClient()

  const [homeResult, foundersResult, plansResult] = await Promise.all([
    supabase
      .from("public_sales_pages")
      .select("*")
      .eq("slug", "home")
      .maybeSingle(),
    supabase
      .from("public_sales_pages")
      .select("*")
      .eq("slug", "founders")
      .maybeSingle(),
    supabase
      .from("plans")
      .select("id, name, description, price, currency, billing, features, most_popular, payment_url")
      .eq("active", true),
  ])

  const mainSalesPage = (homeResult.data ?? null) as SalesPageRow | null
  const foundersSalesPage = (foundersResult.data ?? null) as SalesPageRow | null
  const orderedPlans = (plansResult.data ?? []) as ActivePlanForSalesPage[]

  return { mainSalesPage, foundersSalesPage, orderedPlans }
}
