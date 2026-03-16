import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: Request) {
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
  }

  return NextResponse.redirect(new URL("/members/dashboard", request.url))
}
