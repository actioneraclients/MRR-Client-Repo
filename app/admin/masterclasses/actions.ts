"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Result = Promise<{ success: true } | { success: false; error: string }>

async function ensureAdmin(): Promise<{ authorized: true; userId: string } | { authorized: false; error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { authorized: false, error: "Not authenticated" }
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .maybeSingle()
  if (!profile || profile.is_creator !== true) {
    return { authorized: false, error: "Not authorized" }
  }
  return { authorized: true, userId: user.id }
}

export async function approveMasterclass(masterclassId: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("masterclasses")
    .update({
      status: "approved",
      approved_by: auth.userId,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", masterclassId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }
  if (!data) {
    return { success: false, error: "Not pending or not found" }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function toggleFeaturedMasterclass(
  masterclassId: string,
  nextFeatured: boolean
): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("masterclasses")
    .update({ is_featured: nextFeatured, updated_at: new Date().toISOString() })
    .eq("id", masterclassId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function setMasterclassLive(masterclassId: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("masterclasses")
    .update({ status: "live", updated_at: new Date().toISOString() })
    .eq("id", masterclassId)
    .in("status", ["approved", "pending"])
    .select("id")
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: "Not approved/pending or not found" }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function completeMasterclass(masterclassId: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("masterclasses")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", masterclassId)
    .in("status", ["live", "approved"])
    .select("id")
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: "Not live/approved or not found" }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function retireMasterclass(masterclassId: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("masterclasses")
    .update({ status: "retired", updated_at: new Date().toISOString() })
    .eq("id", masterclassId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function updateMasterclassStatus(
  masterclassId: string,
  status: string
): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("masterclasses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", masterclassId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function updateMasterclassAccess(
  masterclassId: string,
  planIds: string[]
): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error: deleteError } = await supabase
    .from("masterclass_access_plans")
    .delete()
    .eq("masterclass_id", masterclassId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  if (planIds.length > 0) {
    const rows = planIds.map((plan_id) => ({
      masterclass_id: masterclassId,
      plan_id,
    }))
    const { error: insertError } = await supabase
      .from("masterclass_access_plans")
      .insert(rows)

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function getActivePlans(): Promise<
  { success: true; plans: { id: string; name: string }[] } | { success: false; error: string }
> {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plans")
    .select("id, name")
    .eq("active", true)
    .order("name")

  if (error) return { success: false, error: error.message }
  return { success: true, plans: (data ?? []) as { id: string; name: string }[] }
}

export async function getMasterclassAccessPlanIds(
  masterclassId: string
): Promise<{ success: true; planIds: string[] } | { success: false; error: string }> {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("masterclass_access_plans")
    .select("plan_id")
    .eq("masterclass_id", masterclassId)

  if (error) return { success: false, error: error.message }
  const planIds = (data ?? []).map((r) => r.plan_id).filter(Boolean)
  return { success: true, planIds }
}

export async function deleteMasterclass(masterclassId: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("masterclasses").delete().eq("id", masterclassId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function sponsorMasterclass(id: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  await supabase
    .from("masterclasses")
    .update({ is_sponsored: false })
    .eq("is_sponsored", true)

  const { error } = await supabase
    .from("masterclasses")
    .update({ is_sponsored: true, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}

export async function unsponsorMasterclass(id: string): Result {
  const auth = await ensureAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from("masterclasses")
    .update({ is_sponsored: false, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/masterclasses")
  revalidatePath("/members/masterclasses")
  return { success: true }
}
