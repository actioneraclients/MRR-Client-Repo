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

export async function updateMemberPlan(
  profileId: string,
  planId: string,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Members] Unauthorized plan update attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  // 1️⃣ Update the member's plan
  const { error } = await supabase.from("profiles").update({ plan_id: planId }).eq("id", profileId)

  if (error) {
    console.error("[Admin Members] Failed to update plan:", error.message)
    return { success: false, error: error.message }
  }

  const { data: permission } = await supabase
    .from("plan_permissions")
    .select("enabled")
    .eq("plan_id", planId)
    .eq("permission_key", "directory_listing")
    .maybeSingle()

  const allowsDirectoryListing = permission?.enabled === true

  // 3️⃣ Enforce directory removal when NOT allowed
  if (!allowsDirectoryListing) {
    // Set is_public to false
    const { error: profileError } = await supabase.from("profiles").update({ is_public: false }).eq("id", profileId)

    if (profileError) {
      console.error("[Admin Members] Failed to set is_public to false:", profileError.message)
    }

    // Remove from directory_members
    const { error: deleteError } = await supabase.from("directory_members").delete().eq("user_id", profileId)

    if (deleteError) {
      console.error("[Admin Members] Failed to remove from directory:", deleteError.message)
    }
  }
  // 4️⃣ If allowsDirectoryListing === true: Do NOTHING else - user must opt back in manually

  return { success: true }
}

export async function updateMemberStatus(
  profileId: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    console.error("[Admin Members] Unauthorized status update attempt")
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  if (isActive === false) {
    // Admin suspend: set is_active and is_public to false
    const { error } = await supabase.from("profiles").update({ is_active: false, is_public: false }).eq("id", profileId)

    if (error) {
      console.error("[Admin Members] Failed to suspend member:", error.message)
      return { success: false, error: error.message }
    }

    // Remove from directory_members
    const { error: deleteError } = await supabase.from("directory_members").delete().eq("user_id", profileId)

    if (deleteError) {
      console.error("[Admin Members] Failed to remove from directory:", deleteError.message)
    }
  } else {
    // Admin unsuspend: only restore is_active, do NOT modify is_public or directory_members
    const { error } = await supabase.from("profiles").update({ is_active: true }).eq("id", profileId)

    if (error) {
      console.error("[Admin Members] Failed to unsuspend member:", error.message)
      return { success: false, error: error.message }
    }
  }

  return { success: true }
}

export async function updateMemberAdminAccess(
  profileId: string,
  makeAdmin: boolean,
): Promise<{ success: boolean; error?: string }> {
  const { authorized, error: authError } = await verifyAdminAccess()

  if (!authorized) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase.from("profiles").update({ is_creator: makeAdmin }).eq("id", profileId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
