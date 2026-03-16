"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

// Service role client for bypassing Storage RLS
function createServiceRoleClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function uploadGroupHeaderImage(formData: FormData) {
  const groupId = formData.get("groupId") as string
  const file = formData.get("file") as File

  if (!groupId || !file) {
    throw new Error("Missing groupId or file")
  }

  // 1) Authenticate the user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // 2) Verify user is allowed to edit the group (owner check)
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, created_by")
    .eq("id", groupId)
    .single()

  if (groupError || !group) {
    throw new Error("Forbidden")
  }

  if (group.created_by !== user.id) {
    throw new Error("Forbidden")
  }

  // 3) Upload header image using service role client (bypasses Storage RLS)
  const serviceClient = createServiceRoleClient()
  const ext = file.name.split(".").pop() || "png"
  const path = `group-headers/${groupId}.${ext}`

  const { error: uploadError } = await serviceClient.storage.from("groups").upload(path, file, { upsert: true })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // 4) Generate public URL
  const { data: urlData } = serviceClient.storage.from("groups").getPublicUrl(path)

  const headerImageUrl = urlData.publicUrl

  // 5) Update groups table
  const { error: updateError } = await supabase
    .from("groups")
    .update({
      header_image_url: headerImageUrl,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", groupId)

  if (updateError) {
    throw new Error(`DB update failed: ${updateError.message}`)
  }

  redirect(`/members/community/groups/${groupId}`)
}
