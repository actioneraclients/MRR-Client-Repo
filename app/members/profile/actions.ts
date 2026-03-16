"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type MyProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  display_name: string | null
  email: string | null
  phone_number: string | null
  avatar_url: string | null
  job_title: string | null
  company: string | null
  bio: string | null
  city: string | null
  country: string | null
  social_links: any[]
  email_updates_enabled: boolean
  inbox_emails_enabled: boolean
  is_public: boolean
  plan_name: string | null
  billing_url: string | null
  can_list_in_directory: boolean
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      full_name,
      display_name,
      email,
      phone_number,
      avatar_url,
      job_title,
      company,
      bio,
      city,
      country,
      social_links,
      email_updates_enabled,
      inbox_emails_enabled,
      is_public,
      plan_id,
      plans!profiles_plan_id_fkey (
        name
      )
    `)
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[Profile] Failed to fetch profile:", error.message)
    return null
  }

  let billing_url: string | null = null
  const { data: siteSettings, error: siteError } = await supabase
    .from("site_settings")
    .select("billing_link")
    .limit(1)
    .maybeSingle()

  if (!siteError && siteSettings) {
    billing_url = siteSettings.billing_link ?? null
  }

  let can_list_in_directory = false
  if (data?.plan_id) {
    const { data: permission } = await supabase
      .from("plan_permissions")
      .select("enabled")
      .eq("plan_id", data.plan_id)
      .eq("permission_key", "directory_listing")
      .maybeSingle()

    can_list_in_directory = permission?.enabled === true
  }

  if (!data) {
    return {
      id: user.id,
      first_name: null,
      last_name: null,
      full_name: null,
      display_name: null,
      email: user.email ?? null,
      phone_number: null,
      avatar_url: null,
      job_title: null,
      company: null,
      bio: null,
      city: null,
      country: null,
      social_links: [],
      email_updates_enabled: true,
      inbox_emails_enabled: false,
      is_public: true,
      plan_name: null,
      billing_url,
      can_list_in_directory: false,
    }
  }

  const plan_name = (data as any)?.plans?.name ?? null

  const { plans, plan_id, ...rest } = data as any

  return {
    ...rest,
    plan_name,
    billing_url,
    can_list_in_directory,
  }
}

export type UpdateMyProfileInput = {
  full_name?: string | null
  job_title?: string | null
  company?: string | null
  bio?: string | null
  city?: string | null
  country?: string | null
  phone_number?: string | null
  email_updates_enabled?: boolean | null
  inbox_emails_enabled?: boolean | null
  is_public?: boolean | null
  social_links?: { platform: string; url: string }[] | null
}

export async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  const fields: (keyof UpdateMyProfileInput)[] = [
    "full_name",
    "job_title",
    "company",
    "bio",
    "city",
    "country",
    "phone_number",
    "email_updates_enabled",
    "inbox_emails_enabled",
    "is_public",
    "social_links",
  ]

  for (const field of fields) {
    if (field in input) {
      updateData[field] = input[field]
    }
  }

  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

  if (error) {
    console.error("[Profile] updateMyProfile error:", error.message)
    return { success: false, error: error.message }
  }

  if ("is_public" in input) {
    await syncDirectoryMembership(supabase, user.id)
  }

  return { success: true, error: null }
}

async function syncDirectoryMembership(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  // Fetch current profile state (only id and is_public needed)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, is_public")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    console.error("[Profile] syncDirectoryMembership - failed to fetch profile:", profileError?.message)
    return
  }

  if (!profile.is_public) {
    // Remove from directory_members when is_public is false
    const { error: deleteError } = await supabase.from("directory_members").delete().eq("user_id", userId)

    if (deleteError) {
      console.error("[Profile] syncDirectoryMembership - failed to delete from directory_members:", deleteError.message)
    }
    return
  }

  // Insert into directory_members when is_public is true (upsert to avoid duplicates)
  const { error: insertError } = await supabase
    .from("directory_members")
    .upsert({ user_id: userId }, { onConflict: "user_id" })

  if (insertError) {
    console.error("[Profile] syncDirectoryMembership - failed to insert into directory_members:", insertError.message)
  }
}

function createServiceRoleClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function updateMyAvatar(
  formData: FormData,
): Promise<{ success: boolean; avatar_url?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "AUTH_ERROR: Not authenticated" }
    }

    const file = formData.get("avatar") as File | null

    if (!file) {
      return { success: false, error: "FORM_ERROR: No file found in FormData" }
    }

    console.log("[Avatar Upload] File received:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const serviceClient = createServiceRoleClient()

    const ext = file.name.split(".").pop() || "png"
    const timestamp = Date.now()
    const path = `profiles/${user.id}/${timestamp}.${ext}`

    const { error: uploadError } = await serviceClient.storage.from("profiles").upload(path, file, { upsert: true })

    if (uploadError) {
      return {
        success: false,
        error: `STORAGE_ERROR: ${uploadError.message}`,
      }
    }

    const avatar_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${path}`

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      return {
        success: false,
        error: `DB_ERROR: ${updateError.message}`,
      }
    }

    revalidatePath("/members/profile")

    return { success: true, avatar_url }
  } catch (err: any) {
    console.error("[Avatar Upload] Unexpected error:", err)
    return {
      success: false,
      error: `UNEXPECTED_ERROR: ${err?.message || "Unknown error"}`,
    }
  }
}
