"use server"

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

export async function getUpgradeLink(): Promise<string | null> {
  const adminClient = createServiceRoleClient()

  const { data } = await adminClient
    .from("site_settings")
    .select("upgrade_link")
    .eq("id", 1)
    .single()

  return data?.upgrade_link ?? null
}
