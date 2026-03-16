"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

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

export interface UpgradePlan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  billing: string
  is_free: boolean
  stripe_payment_link: string | null
}

export interface UpgradeTool {
  id: string
  name: string
}

export interface UpgradePageData {
  currentPlanId: string | null
  stripeCustomerId: string | null
  plans: UpgradePlan[]
  permissionMatrix: Record<string, Record<string, boolean>>
  tools: UpgradeTool[]
  toolMatrix: Record<string, Record<string, boolean>>
  billingLink: string | null
  upgradePlanIds: string[] | null
  showFoundersSection: boolean | null
}

export async function getUpgradePageData(): Promise<
  { success: true; data: UpgradePageData } | { success: false; error: string }
> {
  const userClient = await createClient()

  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const adminClient = createServiceRoleClient()

  // Fetch user's plan_id from profiles
  const { data: profile } = await adminClient
    .from("profiles")
    .select("plan_id, stripe_customer_id")
    .eq("id", user.id)
    .single()
  const currentPlanId = profile?.plan_id ?? null
  const stripeCustomerId = profile?.stripe_customer_id ?? null

  // Fetch active plans ordered by sort_order
  const { data: plansData, error: plansError } = await adminClient
    .from("plans")
    .select("id, name, slug, price, currency, billing, is_free, stripe_payment_link")
    .eq("active", true)
    .order("sort_order", { ascending: true })

  if (plansError) {
    console.error("[getUpgradePageData] Error fetching plans:", plansError)
    return { success: false, error: "Failed to load plans" }
  }

  const plans: UpgradePlan[] = (plansData ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    currency: p.currency,
    billing: p.billing,
    is_free: p.is_free ?? false,
    stripe_payment_link: p.stripe_payment_link ?? null,
  }))

  const planIds = plans.map((p) => p.id)

  // Fetch plan permissions for all active plans
  let permData: Array<{ plan_id: string; permission_key: string; enabled: boolean }> = []
  if (planIds.length > 0) {
    const { data } = await adminClient
      .from("plan_permissions")
      .select("plan_id, permission_key, enabled")
      .in("plan_id", planIds)
    permData = data ?? []
  }

  const permissionMatrix: Record<string, Record<string, boolean>> = {}
  for (const row of permData) {
    if (!permissionMatrix[row.permission_key]) {
      permissionMatrix[row.permission_key] = {}
    }
    permissionMatrix[row.permission_key][row.plan_id] = row.enabled ?? false
  }

  // Fetch active tools
  const { data: toolsData, error: toolsError } = await adminClient
    .from("tools")
    .select("id, name")
    .eq("is_active", true)

  if (toolsError) {
    console.error("[getUpgradePageData] Error fetching tools:", toolsError)
    return { success: false, error: "Failed to load tools" }
  }

  const tools: UpgradeTool[] = (toolsData ?? []).map((t) => ({
    id: t.id,
    name: t.name,
  }))

  const toolIds = tools.map((t) => t.id)

  // Fetch tool access (skip if no plans or tools)
  let toolAccessData: Array<{ tool_id: string; plan_id: string }> = []
  if (planIds.length > 0 && toolIds.length > 0) {
    const { data } = await adminClient
      .from("tool_plan_access")
      .select("tool_id, plan_id")
      .in("plan_id", planIds)
      .in("tool_id", toolIds)
    toolAccessData = data ?? []
  }

  const toolMatrix: Record<string, Record<string, boolean>> = {}
  for (const t of tools) {
    toolMatrix[t.id] = {}
    for (const p of plans) {
      toolMatrix[t.id][p.id] = false
    }
  }
  for (const row of toolAccessData) {
    if (toolMatrix[row.tool_id]) {
      toolMatrix[row.tool_id][row.plan_id] = true
    }
  }

  // Fetch upgrade settings and billing link from site settings
  const { data: siteSettings, error: settingsError } = await adminClient
    .from("site_settings")
    .select("billing_link, upgrade_visible_plan_ids, show_founders_section")
    .eq("id", 1)
    .single()

  // Defensive fallback: on settings error, show all plans, hide founders
  const upgradePlanIds = settingsError ? null : (siteSettings?.upgrade_visible_plan_ids ?? null)
  const showFoundersSection = settingsError ? null : (siteSettings?.show_founders_section ?? null)

  return {
    success: true,
    data: {
      currentPlanId,
      stripeCustomerId,
      plans,
      permissionMatrix,
      tools,
      toolMatrix,
      billingLink: siteSettings?.billing_link ?? null,
      upgradePlanIds,
      showFoundersSection,
    },
  }
}
