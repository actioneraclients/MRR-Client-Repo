import { LearningNotesContent } from "./_components/LearningNotesContent"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function LearningNotesPage({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select(`
      course_id,
      courses (
        id,
        title,
        thumbnail_url
      )
    `)
    .eq("user_id", user.id)

  const courses = (
    enrollments ?? []
  )
    .filter((e) => e.courses?.id && e.courses?.title)
    .map((e) => ({
      id: e.courses!.id,
      title: e.courses!.title,
      thumbnail_url: e.courses?.thumbnail_url ?? null,
    }))

  const { data: notes } = await supabase
    .from("learning_notes")
    .select(`
      id,
      note_type,
      highlight_text,
      content,
      created_at,
      lesson_id
    `)
    .eq("user_id", user.id)

  const { data: journalEntries } = await supabase
    .from("lesson_journal_entries")
    .select(`
      id,
      lesson_id,
      response,
      created_at
    `)
    .eq("user_id", user.id)

  const lessonIds = [
    ...(notes?.map((n) => n.lesson_id) ?? []),
    ...(journalEntries?.map((j) => j.lesson_id) ?? []),
  ].filter(Boolean)

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select(`
      id,
      title,
      section_id,
      content_blocks,
      course_sections (
        id,
        title,
        course_id
      )
    `)
    .in("id", lessonIds)

  const lessonMap =
    lessons?.reduce((acc: Record<string, unknown>, lesson) => {
      acc[lesson.id] = lesson
      return acc
    }, {} as Record<string, unknown>) ?? {}

  const enrichedNotes =
    notes?.map((note) => ({
      ...note,
      course_lessons: lessonMap[note.lesson_id] ?? null,
    })) ?? []

  const enrichedJournalEntries =
    journalEntries?.map((entry) => ({
      ...entry,
      course_lessons: lessonMap[entry.lesson_id] ?? null,
    })) ?? []

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("brand_primary_color")
    .limit(1)
    .maybeSingle()

  const brandPrimaryColor = siteSettings?.brand_primary_color ?? null

  return (
    <LearningNotesContent
      embedded={embedded}
      courses={courses}
      notes={enrichedNotes}
      journalEntries={enrichedJournalEntries}
      brandPrimaryColor={brandPrimaryColor}
    />
  )
}
