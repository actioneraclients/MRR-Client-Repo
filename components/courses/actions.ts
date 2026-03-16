"use server"

import { createClient } from "@/lib/supabase/server"
import { getLessonAccessState } from "@/lib/courses/getLessonAccessState"

export type NextLesson = {
  id: string
  title: string
  thumbnail_url: string | null
  section_id: string
  sort_order: number
}

export async function getNextLesson(courseId: string): Promise<NextLesson | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, title, thumbnail_url, section_id, sort_order, release_date, drip_days, requires_previous_completion")
    .eq("course_id", courseId)

  if (!lessons?.length) return null

  const sectionOrder = new Map(sections?.map((s) => [s.id, s.sort_order]) ?? [])
  const sortedLessons = [...lessons].sort((a, b) => {
    const sectionOrderA = sectionOrder.get(a.section_id) ?? 0
    const sectionOrderB = sectionOrder.get(b.section_id) ?? 0
    if (sectionOrderA !== sectionOrderB) return sectionOrderA - sectionOrderB
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const lessonIds = sortedLessons.map((l) => l.id)

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, completed_at")
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds)

  const progressMap = Object.fromEntries(
    (progress ?? []).map((p) => [p.lesson_id, p])
  )

  for (let i = 0; i < sortedLessons.length; i++) {
    const lesson = sortedLessons[i]

    const previousLesson =
      i > 0 ? sortedLessons[i - 1] : undefined

    const state = getLessonAccessState({
      lesson,
      previousLesson,
      progressMap,
      enrollment: {},
    })

    if (state === "AVAILABLE") {
      return lesson
    }
  }

  return sortedLessons[0] ?? null
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from("lesson_progress")
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    })

  if (error) {
    console.error(error)
    return { success: false }
  }

  return { success: true }
}
