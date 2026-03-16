"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function retireCourse(courseId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("courses")
    .update({ status: "Retired" })
    .eq("id", courseId)
    .eq("created_by", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/members/courses/builder")

  return { success: true }
}
