"use server"

import { createClient } from "@/lib/supabase/server"

export async function getCourseData(courseId: string) {
  const supabase = await createClient()

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructions,
      instruction_video,
      thumbnail_url,
      group_id
    `)
    .eq("id", courseId)
    .single()

  if (courseError) {
    console.error("Course fetch error:", courseError)
    return null
  }

  const { data: sections, error: sectionError } = await supabase
    .from("course_sections")
    .select(`
      id,
      title,
      sort_order
    `)
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  if (sectionError) {
    console.error("Sections fetch error:", sectionError)
    return null
  }

  const { data: lessons, error: lessonError } = await supabase
    .from("course_lessons")
    .select(`
      id,
      section_id,
      title,
      sort_order,
      release_date,
      drip_days,
      requires_previous_completion
    `)
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  if (lessonError) {
    console.error("Lessons fetch error:", lessonError)
    return null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let progressMap: Record<string, { completed: boolean; completed_at: string | null }> = {}
  let enrollment: { started_at: string | null } | null = null

  if (user) {
    const lessonIds = lessons?.map((l) => l.id) ?? []
    if (lessonIds.length > 0) {
      const { data: progressRows } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed, completed_at")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)

      progressMap =
        progressRows?.reduce(
          (acc, row) => {
            acc[row.lesson_id] = {
              completed: row.completed ?? false,
              completed_at: row.completed_at ?? null,
            }
            return acc
          },
          {} as Record<string, { completed: boolean; completed_at: string | null }>
        ) ?? {}
    }

    const { data: enrollmentRow } = await supabase
      .from("course_enrollments")
      .select("started_at")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle()

    enrollment = enrollmentRow ? { started_at: enrollmentRow.started_at ?? null } : null
  }

  // ----------------------------------------------------
  // Calculate Course Progress
  // ----------------------------------------------------

  const totalLessons = lessons.length

  const completedLessons = lessons.filter(
    (lesson) => progressMap?.[lesson.id]?.completed === true
  ).length

  const progressPercent =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

  // ----------------------------------------------------
  // Learning Stats
  // ----------------------------------------------------

  let learningStats = {
    notes: 0,
    highlights: 0,
    savedResources: 0,
  }

  if (user) {
    const { data: notesData } = await supabase
      .from("learning_notes")
      .select("note_type", { count: "exact", head: false })
      .eq("user_id", user.id)
      .eq("course_id", courseId)

    if (notesData) {
      learningStats.notes = notesData.filter((n) => n.note_type === "note").length
      learningStats.highlights = notesData.filter(
        (n) => n.note_type === "highlight"
      ).length
    }

    const { count: savedCount } = await supabase
      .from("saved_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    learningStats.savedResources = savedCount ?? 0
  }

  return {
    course,
    sections,
    lessons,
    progressMap,
    enrollment,
    progressPercent,
    completedLessons,
    totalLessons,
    learningStats,
  }
}
