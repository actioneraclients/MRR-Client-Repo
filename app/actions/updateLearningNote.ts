"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateLearningNote({
  noteId,
  text,
}: {
  noteId: string
  text: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to update notes")
  }

  const { error } = await supabase
    .from("learning_notes")
    .update({
      content: text,
      highlight_text: text,
    })
    .eq("id", noteId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }
}
