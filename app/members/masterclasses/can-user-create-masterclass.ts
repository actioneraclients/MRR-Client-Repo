"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

export async function getUserMasterclassPermissions() {
  const userClient = await createClient()

  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) {
    return {
      canCreateMasterclass: false,
      remainingMasterclasses: 0,
    }
  }

  const admin = createServiceRoleClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_id")
    .eq("id", user.id)
    .single()

  if (!profile?.plan_id) {
    return {
      canCreateMasterclass: false,
      remainingMasterclasses: 0,
    }
  }

  const { data: permission } = await admin
    .from("plan_permissions")
    .select("enabled, limit_value")
    .eq("plan_id", profile.plan_id)
    .eq("permission_key", "create_masterclass")
    .maybeSingle()

  if (!permission?.enabled) {
    return {
      canCreateMasterclass: false,
      remainingMasterclasses: 0,
    }
  }

  if (permission.limit_value === null) {
    return {
      canCreateMasterclass: true,
      remainingMasterclasses: 9999,
    }
  }

  const { count } = await admin
    .from("masterclasses")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id)

  const remaining = Math.max(permission.limit_value - (count ?? 0), 0)

  return {
    canCreateMasterclass: true,
    remainingMasterclasses: remaining,
  }
}
