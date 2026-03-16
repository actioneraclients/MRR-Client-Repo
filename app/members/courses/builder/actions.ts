"use server"

import { createClient } from "@/lib/supabase/server"

export type BuilderCourse = {
  id: string
  title: string
  status: string
  thumbnail_url: string | null
  modules: number
  lessons: number
}

export async function getBuilderCourses(): Promise<BuilderCourse[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: rows, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      status,
      thumbnail_url,
      course_sections(count),
      course_lessons(count)
    `,
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getBuilderCourses]", error)
    return []
  }

  return (rows ?? []).map((row) => {
    const sectionsData = row.course_sections as { count: number }[] | undefined
    const lessonsData = row.course_lessons as { count: number }[] | undefined
    const modulesCount = sectionsData?.[0]?.count ?? 0
    const lessonsCount = lessonsData?.[0]?.count ?? 0

    const rawStatus = (row.status as string)?.toLowerCase()
    const status =
      rawStatus === "published" ? "Published"
      : rawStatus === "retired" ? "Retired"
      : "Draft"

    return {
      id: row.id,
      title: row.title ?? "Untitled Course",
      status,
      thumbnail_url: row.thumbnail_url ?? null,
      modules: modulesCount,
      lessons: lessonsCount,
    }
  })
}
