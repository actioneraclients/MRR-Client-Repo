import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

async function triggerGHLWebhookIfNewUser(user: any, serviceClient: any) {
  console.log("[GHL DEBUG] Trigger function started")

  let profile = null

  for (let i = 0; i < 5; i++) {
    const { data } = await serviceClient
      .from("profiles")
      .select("plan_id, created_at")
      .eq("id", user.id)
      .single()

    if (data) {
      profile = data
      break
    }

    await new Promise((res) => setTimeout(res, 500))
  }

  console.log("[GHL DEBUG] profile:", profile)

  if (!profile?.plan_id || !profile?.created_at) {
    console.log("[GHL] Profile not ready, skipping webhook")
    return
  }

  const createdAt = new Date(profile.created_at).getTime()
  const now = Date.now()
  const isNewUser = now - createdAt < 15 * 60 * 1000

  console.log("[GHL DEBUG] isNewUser:", isNewUser)

  if (!isNewUser) return

  const { data: plan } = await serviceClient
    .from("plans")
    .select("ghl_webhook_url")
    .eq("id", profile.plan_id)
    .single()

  const webhookUrl = plan?.ghl_webhook_url

  console.log("[GHL DEBUG] webhookUrl:", webhookUrl)

  if (!webhookUrl) return

  const metadata = user.user_metadata || {}

  const fullName = metadata.full_name || metadata.name || ""
  const nameParts = fullName.split(" ")

  const firstName =
    metadata.first_name ||
    metadata.given_name ||
    nameParts[0] ||
    ""

  const lastName =
    metadata.last_name ||
    metadata.family_name ||
    nameParts.slice(1).join(" ") ||
    ""

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      first_name: firstName,
      last_name: lastName,
    }),
  })

  console.log("[GHL] Webhook sent successfully")
}

export async function GET(request: Request) {
  console.log("[GHL DEBUG] CALLBACK ROUTE HIT")
  const { searchParams } = new URL(request.url)

  const code = searchParams.get("code")
  const pid = searchParams.get("pid")
  const ntp = searchParams.get("ntp")

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  // NTP FLOW (Temporary Plan → Stripe → Return to Login)
  if (ntp && pid) {
    // Assign temporary plan first
    await serviceClient
      .from("profiles")
      .update({ plan_id: ntp })
      .eq("id", user.id)

    await triggerGHLWebhookIfNewUser(user, serviceClient)

    // Fetch Stripe payment link
    const { data: plan } = await serviceClient
      .from("plans")
      .select("stripe_payment_link")
      .eq("id", pid)
      .single()

    if (plan?.stripe_payment_link) {
      return NextResponse.redirect(plan.stripe_payment_link)
    }
  }

  // Direct PID assignment (no Stripe required)
  if (pid) {
    await serviceClient
      .from("profiles")
      .update({ plan_id: pid })
      .eq("id", user.id)

    await triggerGHLWebhookIfNewUser(user, serviceClient)
  }

  return NextResponse.redirect(new URL("/members/dashboard", request.url))
}
