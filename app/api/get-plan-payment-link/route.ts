import { NextResponse } from "next/server"
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const pid = searchParams.get("pid")

  if (!pid) {
    return NextResponse.json({ error: "Missing pid" }, { status: 400 })
  }

  const supabase = getServiceRoleClient()

  const { data: plan } = await supabase
    .from("plans")
    .select("stripe_payment_link, active")
    .eq("id", pid)
    .single()

  if (!plan?.stripe_payment_link || plan.active === false) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  return NextResponse.json({
    stripe_payment_link: plan.stripe_payment_link,
  })
}
