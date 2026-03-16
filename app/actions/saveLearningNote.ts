"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveLearningNote({
  courseId,
  lessonId,
  type,
  text,
}: {
  courseId: string
  lessonId: string
  type: "note" | "highlight"
  text: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to save notes")
  }

  const { error } = await supabase.from("learning_notes").insert({
    user_id: user.id,
    course_id: courseId,
    lesson_id: lessonId,
    note_type: type,
    content: type === "note" ? text : null,
    highlight_text: type === "highlight" ? text : null,
  })

  if (error) {
    throw new Error(error.message)
  }
}
