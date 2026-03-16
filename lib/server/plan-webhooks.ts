"use server"

import { createServerClient } from "@supabase/ssr"

function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

interface PlanWebhookPayload {
  event: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string | null
  plan_id: string
  site_url?: string | null
}

export async function triggerPlanWebhook(
  planId: string,
  payload: PlanWebhookPayload
): Promise<void> {
  if (!planId) return

  try {
    const supabase = getServiceRoleClient()

    const { data: plan, error } = await supabase
      .from("plans")
      .select("ghl_webhook_enabled, ghl_webhook_url")
      .eq("id", planId)
      .single()

    if (error || !plan) {
      console.error("[plan-webhook] Plan lookup failed:", error?.message)
      return
    }

    if (!plan.ghl_webhook_enabled || !plan.ghl_webhook_url) {
      return
    }

    const response = await fetch(plan.ghl_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("[plan-webhook] Webhook request failed:", response.status)
    }
  } catch (err) {
    console.error(
      "[plan-webhook] Unexpected error:",
      err instanceof Error ? err.message : err
    )
  }
}
