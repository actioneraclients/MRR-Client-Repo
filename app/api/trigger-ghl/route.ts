import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ ok: false })

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

  if (!profile?.plan_id) return NextResponse.json({ ok: false })

  const createdAt = new Date(profile.created_at).getTime()
  const isNewUser = Date.now() - createdAt < 15 * 60 * 1000

  if (!isNewUser) return NextResponse.json({ ok: true })

  const { data: plan } = await serviceClient
    .from("plans")
    .select("ghl_webhook_url")
    .eq("id", profile.plan_id)
    .single()

  const webhookUrl = plan?.ghl_webhook_url

  if (!webhookUrl) return NextResponse.json({ ok: false })

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

  return NextResponse.json({ ok: true })
}
