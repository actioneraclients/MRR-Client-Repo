"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function reserveMasterclass(masterclassId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const id = masterclassId?.trim()
    if (!id) return { success: false, error: "Masterclass ID is required" }

    const { error: insertError } = await supabase
      .from("masterclass_attendees")
      .insert({ masterclass_id: id, user_id: user.id })

    if (insertError) {
      if (insertError.code === "23505") return { success: true }
      console.error("[reserveMasterclass]", insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath("/members/masterclasses")
    return { success: true }
  } catch (err) {
    console.error("[reserveMasterclass] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}

export async function updateMasterclass(input: {
  id: string
  title: string
  description?: string | null
  topics?: string[] | null
  who_its_for?: string | null
  video_url?: string | null
  image_path?: string | null
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Not authenticated" }
    }

    const id = input.id?.trim()
    const title = input.title?.trim()
    if (!id || !title) {
      return { success: false, error: "ID and title are required" }
    }

    const { data: existing } = await supabase
      .from("masterclasses")
      .select("creator_id")
      .eq("id", id)
      .single()

    if (!existing) {
      return { success: false, error: "Masterclass not found" }
    }

    if (existing.creator_id !== user.id) {
      return { success: false, error: "You can only edit your own masterclasses" }
    }

    const topicsArr = input.topics && Array.isArray(input.topics) ? input.topics.filter((t) => typeof t === "string") : []
    const topicsValue = topicsArr.length > 0 ? topicsArr : null

    const { error: updateError } = await supabase
      .from("masterclasses")
      .update({
        title: title || null,
        description: input.description?.trim() || null,
        topics: topicsValue,
        who_its_for: input.who_its_for?.trim() || null,
        video_url: input.video_url?.trim() || null,
        image_path: input.image_path?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("creator_id", user.id)

    if (updateError) {
      console.error("[updateMasterclass]", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath("/members/masterclasses")
    return { success: true }
  } catch (err) {
    console.error("[updateMasterclass] Unexpected error:", err)
    return { success: false, error: "Something went wrong" }
  }
}
