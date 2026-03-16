"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateJournalEntry({
  entryId,
  response,
}: {
  entryId: string
  response: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to update journal entries")
  }

  const { error } = await supabase
    .from("lesson_journal_entries")
    .update({
      response,
      updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message)
  }
}
