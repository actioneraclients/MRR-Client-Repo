import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LessonBuilderWorkspace from "./LessonBuilderWorkspace"

export default async function LessonBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("id", lessonId)
    .single()

  if (!lesson) {
    redirect(`/members/courses/builder/${courseId}`)
  }

  const blocks = lesson?.content_blocks ?? []

  return (
    <div className="p-6 h-full">
      <div id="lesson-builder-workspace" className="h-full min-h-screen">
        <LessonBuilderWorkspace
          lessonId={lessonId}
          courseId={courseId}
          lesson={lesson}
          blocks={blocks}
        />
      </div>
    </div>
  )
}
