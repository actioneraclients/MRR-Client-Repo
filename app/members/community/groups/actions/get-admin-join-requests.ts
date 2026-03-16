"use server"

import { createClient } from "@/lib/supabase/server"

export type JoinRequestRow = {
  id: string
  group_id: string
  group_name: string
  user_id: string
  status: string
  created_at: string
  full_name: string | null
  avatar_url: string | null
}

export async function getAdminJoinRequests(): Promise<JoinRequestRow[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  /**
   * IMPORTANT:
   * We intentionally use a raw SQL function (RPC) here because:
   * - Supabase reverse-embeds are unreliable
   * - group_members does NOT FK to group_join_requests
   * - We already verified this exact join works in SQL
   */

  const { data, error } = await supabase.rpc("get_admin_group_join_requests")

  if (error || !data) {
    console.error("[getAdminJoinRequests] RPC error:", error)
    return []
  }

  return data.map((row: any) => ({
    id: row.id,
    group_id: row.group_id,
    group_name: row.group_name,
    user_id: row.requester_id,
    status: row.status,
    created_at: row.created_at,
    full_name: row.full_name ?? null,
    avatar_url: row.avatar_url ?? null,
  }))
}
