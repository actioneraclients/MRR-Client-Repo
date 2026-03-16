"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveLessonResource({
  courseId,
  lessonId,
  blockJson,
}: {
  courseId: string
  lessonId: string
  blockJson: { block_id: string; block_type: string; title: string; data?: Record<string, unknown> }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to save resources")
  }

  const { error } = await supabase.from("learning_notes").insert({
    user_id: user.id,
    course_id: courseId,
    lesson_id: lessonId,
    note_type: "resource",
    content: JSON.stringify(blockJson),
    highlight_text: null,
  })

  if (error) {
    throw new Error(error.message)
  }
}
