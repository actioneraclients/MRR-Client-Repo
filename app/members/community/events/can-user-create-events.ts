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

export async function canUserCreateEvents(): Promise<boolean> {
  const userClient = await createClient()

  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) return false

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient.from("profiles").select("plan_id").eq("id", user.id).single()

  if (!profile?.plan_id) return false

  const { data: permission } = await adminClient
    .from("plan_permissions")
    .select("id")
    .eq("plan_id", profile.plan_id)
    .eq("permission_key", "create_events")
    .eq("enabled", true)
    .maybeSingle()

  return Boolean(permission)
}
