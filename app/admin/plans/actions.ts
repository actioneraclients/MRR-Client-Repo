"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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

export interface CreatePlanPayload {
  name: string
  slug: string
  description: string
  is_free: boolean
  price: number
  currency: string
  billing: string
  features: string[]
  most_popular: boolean
  active: boolean
  sort_order: number
  payment_url?: string | null
  using_stripe?: boolean
  stripe_price_id?: string | null
  stripe_payment_link?: string | null
  ghl_webhook_enabled?: boolean
  ghl_webhook_url?: string | null
}

export async function createPlan(payload: CreatePlanPayload): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized plan creation attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase.from("plans").insert([
    {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      is_free: payload.is_free,
      price: payload.price,
      currency: payload.currency,
      billing: payload.billing,
      features: payload.features,
      most_popular: payload.most_popular,
      active: payload.active,
      sort_order: payload.sort_order,
      payment_url: payload.payment_url ?? null,
      using_stripe: payload.using_stripe ?? false,
      stripe_price_id: payload.using_stripe ? (payload.stripe_price_id || null) : null,
      stripe_payment_link: payload.using_stripe ? (payload.stripe_payment_link || null) : null,
      ghl_webhook_enabled: payload.ghl_webhook_enabled ?? false,
      ghl_webhook_url: payload.ghl_webhook_enabled ? (payload.ghl_webhook_url ?? null) : null,
    },
  ])

  if (error) {
    console.error("[Admin Plans] Failed to create plan:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface UpdatePlanPayload {
  id: string
  name: string
  slug: string
  description: string
  is_free: boolean
  price: number
  currency: string
  billing: string
  features: string[]
  most_popular: boolean
  active: boolean
  sort_order: number
  payment_url?: string | null
  using_stripe?: boolean
  stripe_price_id?: string | null
  stripe_payment_link?: string | null
  ghl_webhook_enabled?: boolean
  ghl_webhook_url?: string | null
}

export async function updatePlan(payload: UpdatePlanPayload): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized plan update attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from("plans")
    .update({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      is_free: payload.is_free,
      price: payload.price,
      currency: payload.currency,
      billing: payload.billing,
      features: payload.features,
      most_popular: payload.most_popular,
      active: payload.active,
      sort_order: payload.sort_order,
      payment_url: payload.payment_url ?? null,
      using_stripe: payload.using_stripe ?? false,
      stripe_price_id: payload.using_stripe ? (payload.stripe_price_id || null) : null,
      stripe_payment_link: payload.using_stripe ? (payload.stripe_payment_link || null) : null,
      ghl_webhook_enabled: payload.ghl_webhook_enabled ?? false,
      ghl_webhook_url: payload.ghl_webhook_enabled ? (payload.ghl_webhook_url ?? null) : null,
    })
    .eq("id", payload.id)

  if (error) {
    console.error("[Admin Plans] Failed to update plan:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function mapPlanWebhook(planId: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized map webhook attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  try {
    const { data: plan, error: fetchError } = await supabase
      .from("plans")
      .select("ghl_webhook_enabled, ghl_webhook_url")
      .eq("id", planId)
      .single()

    if (fetchError || !plan) {
      return { success: false, error: fetchError?.message || "Plan not found" }
    }

    if (!plan.ghl_webhook_enabled) {
      return { success: false, error: "GHL automation is not enabled for this plan" }
    }

    const webhookUrl = plan.ghl_webhook_url?.trim()
    if (!webhookUrl) {
      return { success: false, error: "Webhook URL is not configured" }
    }

    const payload = {
      event: "plan_map_test",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      phone_number: "5551234567",
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${text || response.statusText}`,
      }
    }

    const { error: updateError } = await supabase
      .from("plans")
      .update({ ghl_webhook_last_mapped_at: new Date().toISOString() })
      .eq("id", planId)

    if (updateError) {
      console.error("[Admin Plans] Failed to update last mapped timestamp:", updateError.message)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook request failed"
    console.error("[Admin Plans] mapPlanWebhook error:", err)
    return { success: false, error: message }
  }
}

export async function togglePlanActive(planId: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized toggle active attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase.from("plans").update({ active }).eq("id", planId)

  if (error) {
    console.error("[Admin Plans] Failed to toggle plan active:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface DuplicatePlanResult {
  success: boolean
  error?: string
  plan?: {
    id: string
    name: string
    slug: string
    description: string
    price: number
    currency: string
    billing: string
    features: string[]
    is_free: boolean
    most_popular: boolean
    active: boolean
    sort_order: number
  }
}

export async function duplicatePlan(planId: string): Promise<DuplicatePlanResult> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized duplicate attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  // Fetch the source plan
  const { data: sourcePlan, error: fetchError } = await supabase
    .from("plans")
    .select("name, description, price, currency, billing, features, is_free, most_popular, sort_order, slug")
    .eq("id", planId)
    .single()

  if (fetchError || !sourcePlan) {
    console.error("[Admin Plans] Failed to fetch source plan:", fetchError?.message)
    return { success: false, error: fetchError?.message || "Plan not found" }
  }

  // Generate unique suffix for slug
  const uniqueSuffix = Math.random().toString(36).substring(2, 8)
  const newSlug = `${sourcePlan.slug}-copy-${uniqueSuffix}`
  const newName = `${sourcePlan.name} (Copy)`

  // Insert the duplicated plan
  const { data: newPlan, error: insertError } = await supabase
    .from("plans")
    .insert([
      {
        name: newName,
        slug: newSlug,
        description: sourcePlan.description,
        price: sourcePlan.price,
        currency: sourcePlan.currency,
        billing: sourcePlan.billing,
        features: sourcePlan.features,
        is_free: sourcePlan.is_free,
        most_popular: sourcePlan.most_popular,
        sort_order: sourcePlan.sort_order,
        active: false,
      },
    ])
    .select(
      "id, name, slug, description, price, currency, billing, features, is_free, most_popular, active, sort_order",
    )
    .single()

  if (insertError || !newPlan) {
    console.error("[Admin Plans] Failed to duplicate plan:", insertError?.message)
    return { success: false, error: insertError?.message || "Failed to create duplicate" }
  }

  return { success: true, plan: newPlan }
}

export async function deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized delete attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", planId)

  if (countError) {
    console.error("[Admin Plans] Failed to check profile references:", countError.message)
    return { success: false, error: "Failed to verify plan usage" }
  }

  if (count && count > 0) {
    return { success: false, error: "Plan is assigned to members and cannot be deleted" }
  }

  // Safe to delete - no profiles reference this plan
  const { error: deleteError } = await supabase.from("plans").delete().eq("id", planId)

  if (deleteError) {
    console.error("[Admin Plans] Failed to delete plan:", deleteError.message)
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}

export interface PlanPermission {
  permission_key: string
  enabled: boolean
  limit_value: number | null
}

export async function getPlanPermissions(
  planId: string,
): Promise<{ success: boolean; permissions?: PlanPermission[]; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized get permissions attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("plan_permissions")
    .select("permission_key, enabled, limit_value")
    .eq("plan_id", planId)

  if (error) {
    console.error("[Admin Plans] Failed to fetch plan permissions:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true, permissions: data || [] }
}

export async function togglePlanPermission(
  planId: string,
  permissionKey: string,
  enabled: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Plans] Unauthorized toggle permission attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase.from("plan_permissions").upsert(
    {
      plan_id: planId,
      permission_key: permissionKey,
      enabled,
    },
    {
      onConflict: "plan_id,permission_key",
      ignoreDuplicates: false,
    },
  )

  if (error) {
    console.error("[Admin Plans] Failed to toggle plan permission:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updatePlanPermissionLimit(
  planId: string,
  permissionKey: string,
  limitValue: number | null,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from("plan_permissions")
    .upsert(
      {
        plan_id: planId,
        permission_key: permissionKey,
        limit_value: limitValue,
      },
      { onConflict: "plan_id,permission_key" }
    )

  if (error) {
    console.error("[Admin Plans] Failed to update permission limit:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getUpgradePageSettings(): Promise<{
  success: boolean
  data?: {
    upgrade_page_plan_ids: string[] | null
    upgrade_page_show_founders: boolean | null
  }
  error?: string
}> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("upgrade_visible_plan_ids, show_founders_section")
    .eq("id", 1)
    .single()

  if (error) return { success: false, error: error.message }

  return {
    success: true,
    data: {
      upgrade_page_plan_ids: data?.upgrade_visible_plan_ids ?? [],
      upgrade_page_show_founders: data?.show_founders_section ?? false,
    },
  }
}

export async function updateUpgradePageSettings(
  planIds: string[],
  showFounders: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) return { success: false, error: authError || "Unauthorized" }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from("site_settings")
    .update({
      upgrade_visible_plan_ids: planIds,
      show_founders_section: showFounders,
    })
    .eq("id", 1)

  if (error) return { success: false, error: error.message }

  return { success: true }
}
