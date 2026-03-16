"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMemberStats() {
  const supabase = await createClient()

  // Get total count
  const { count: total, error: totalError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  if (totalError) {
    throw new Error(totalError.message)
  }

  // Get active count
  const { count: active, error: activeError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  if (activeError) {
    throw new Error(activeError.message)
  }

  // Get suspended count
  const { count: suspended, error: suspendedError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false)

  if (suspendedError) {
    throw new Error(suspendedError.message)
  }

  return {
    total: total ?? 0,
    active: active ?? 0,
    suspended: suspended ?? 0,
  }
}

export async function createSiteUpdate({ title, body }: { title?: string; body: string }) {
  const supabase = await createClient()

  const { error } = await supabase.from("site_updates").insert({
    title,
    body,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function getSiteUpdates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_updates")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateSiteUpdate({
  id,
  title,
  body,
}: {
  id: string
  title?: string
  body: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("site_updates").update({ title, body }).eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function deleteSiteUpdate(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("site_updates").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboard")
  return { success: true }
}

export async function getRecentMembers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at, plans ( name )")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  // Flatten the result into UI-ready objects
  return (data || []).map((profile) => ({
    id: profile.id ?? "",
    full_name: profile.full_name ?? "Unknown User",
    email: profile.email ?? "No email",
    avatar_url: profile.avatar_url ?? null,
    created_at: profile.created_at ?? "",
    plan_name:
      profile.plans && typeof profile.plans === "object" && "name" in profile.plans
        ? ((profile.plans.name as string) ?? "Unknown")
        : "Unknown",
  }))
}

export async function getMembersByPlan() {
  const supabase = await createClient()

  // Query from plans table where active = true, embed profiles via FK
  const { data, error } = await supabase.from("plans").select("id, name, profiles ( id )").eq("active", true)

  if (error) {
    throw new Error(error.message)
  }

  // Return UI-ready array with counts
  return (data || []).map((plan) => ({
    planId: plan.id ?? "",
    planName: plan.name ?? "Unknown Plan",
    memberCount: plan.profiles && Array.isArray(plan.profiles) ? plan.profiles.length : 0,
  }))
}
