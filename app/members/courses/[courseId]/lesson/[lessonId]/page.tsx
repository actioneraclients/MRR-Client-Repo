import Link from "next/link"
import { redirect } from "next/navigation"
import LessonBlockRenderer from "@/components/courses/LessonBlockRenderer"
import LessonNotesPanel from "@/components/courses/LessonNotesPanel"
import LessonOutline from "@/components/courses/LessonOutline"
import SavedResourcesList from "@/components/courses/SavedResourcesList"
import { parseCourseBlocks } from "@/lib/courseBlocks"
import { createClient } from "@/lib/supabase/server"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin = profile?.is_creator === true

  let isEnrolled = false

  if (!isAdmin) {
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", user.id)
      .maybeSingle()

    isEnrolled = !!enrollment
  }

  if (!isAdmin && !isEnrolled) {
    redirect("/members/courses")
  }

  const { data: lesson, error } = await supabase
    .from("course_lessons")
    .select("*, course_sections(title)")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .single()

  if (error || !lesson) {
    throw new Error("Lesson not found")
  }

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, sort_order, section_id")
    .eq("course_id", courseId)

  const sectionOrder = new Map(sections?.map((s) => [s.id, s.sort_order]) ?? [])
  const orderedLessons = [...(lessons ?? [])].sort((a, b) => {
    const orderA = sectionOrder.get(a.section_id) ?? 0
    const orderB = sectionOrder.get(b.section_id) ?? 0
    if (orderA !== orderB) return orderA - orderB
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const lessonIndex = orderedLessons.findIndex((l) => l.id === lessonId)

  const previousLesson =
    lessonIndex > 0 ? orderedLessons[lessonIndex - 1] : null

  const nextLesson =
    lessonIndex >= 0 && lessonIndex < orderedLessons.length - 1
      ? orderedLessons[lessonIndex + 1]
      : null

  const { count: totalLessons } = await supabase
    .from("course_lessons")
    .select("*", { count: "exact", head: true })
    .eq("course_id", courseId)

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("brand_accent_color")
    .limit(1)
    .maybeSingle()

  const brandAccentColor = siteSettings?.brand_accent_color ?? null

  async function completeLesson(formData: FormData) {
    "use server"

    const courseId = formData.get("courseId") as string
    const lessonId = formData.get("lessonId") as string

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect(`/members/courses/${courseId}`)
    }

    const { error } = await supabase
      .from("lesson_progress")
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      })

    if (error) {
      console.error("LESSON COMPLETE ERROR:", error)
    }

    const { data: lessons } = await supabase
      .from("course_lessons")
      .select("id, sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: true })

    const lessonIndex = lessons?.findIndex((l) => l.id === lessonId) ?? -1

    const nextLesson =
      lessonIndex >= 0 && lessonIndex < (lessons?.length ?? 0) - 1
        ? lessons?.[lessonIndex + 1]
        : null

    if (nextLesson) {
      redirect(`/members/courses/${courseId}/lesson/${nextLesson.id}`)
    }

    redirect(`/members/courses/${courseId}`)
  }

  let notes: { id: string; highlight_text?: string | null; content?: string | null }[] = []
  let highlights: { highlight_text?: string | null; content?: string | null }[] = []
  let savedResources: { id: string; content: string | null }[] = []

  if (user) {
    const { data: learningNotes } = await supabase
      .from("learning_notes")
      .select("id, note_type, content, highlight_text")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)

    if (learningNotes) {
      notes = learningNotes.filter((r) => r.note_type === "note")
      highlights = learningNotes.filter((r) => r.note_type === "highlight")
      savedResources = learningNotes
        .filter((r) => r.note_type === "resource")
        .map((r) => ({ id: r.id, content: r.content }))
    }
  }

  return (
    <>
      <div id="lesson-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 overflow-visible">
        <Link
          href={`/members/courses/${courseId}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center"
        >
          ← Back to Course Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6 bg-white border rounded-xl p-4 sm:p-6 mb-6">
          {lesson.thumbnail_url && (
            <img
              src={lesson.thumbnail_url}
              alt={lesson.title}
              className="w-28 h-28 rounded-lg object-cover shrink-0"
            />
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Course Lesson
            </p>

            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {lesson.title}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Lesson {(lesson.sort_order ?? 0) + 1} of {totalLessons ?? 0}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:gap-10 lg:grid-cols-3">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            <div id="lesson-content" className="space-y-10 prose max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
              <LessonBlockRenderer blocks={parseCourseBlocks(lesson?.content_blocks)} courseId={courseId} lessonId={lessonId} brandAccentColor={brandAccentColor} />
            </div>

            <div id="lesson-navigation" className="mt-16 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                {previousLesson ? (
                  <Link
                    href={`/members/courses/${courseId}/lesson/${previousLesson.id}`}
                    className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-300 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Previous Lesson</span>
                  </Link>
                ) : (
                  <div />
                )}

                <form action={completeLesson} className="w-full sm:w-auto">
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="lessonId" value={lessonId} />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <span>Mark Complete & Continue</span>
                    <i className="fa-solid fa-check"></i>
                  </button>
                </form>

                {nextLesson ? (
                  <Link
                    href={`/members/courses/${courseId}/lesson/${nextLesson.id}`}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <span>Next Lesson</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                ) : (
                  <div />
                )}

              </div>
            </div>
          </div>

          {/* Learning Panel */}
          <div className="lg:col-span-1 order-last lg:order-none sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
            <LessonOutline blocks={parseCourseBlocks(lesson?.content_blocks)} />
            <LessonNotesPanel courseId={courseId} lessonId={lessonId} notes={notes} />

            <div className="bg-white border border-gray-200 border-l-4 border-amber-400 rounded-xl p-5 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-sparkles text-purple-500 text-sm"></i>
                Highlights
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                {highlights.length > 0 ? (
                  highlights.map((h, i) => {
                    const text = h.highlight_text ?? h.content ?? ""
                    return text ? (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 mr-2 shrink-0">✨</span>
                        <p
                          className="text-sm italic text-gray-700 flex-1 min-w-0 line-clamp-3"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {text}
                        </p>
                      </div>
                    ) : null
                  })
                ) : (
                  <p className="text-gray-500 italic">No highlights saved yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 border-l-4 border-emerald-400 rounded-xl p-5 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-star text-amber-500 text-sm"></i>
                Saved Content
              </h3>
              <SavedResourcesList
                resources={savedResources}
                lessonBlocks={lesson?.content_blocks}
                courseId={courseId}
                lessonId={lessonId}
              />
            </div>

            <div className="bg-white border border-gray-200 border-l-4 border-purple-400 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <i className="fa-solid fa-comments text-purple-500 text-sm"></i>
                Course Community
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Discuss this lesson with others taking this course.
              </p>
              <Link
                href="#"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                Open Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
