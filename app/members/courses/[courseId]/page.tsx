import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getNextLesson } from "@/components/courses/actions"
import { CourseOverviewContent } from "./_components/CourseOverviewContent"
import { getCourseData } from "./actions"

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const courseData = await getCourseData(courseId)
  const nextLesson = await getNextLesson(courseId)

  if (!courseData) {
    return <div>Course not found</div>
  }

  const {
    course,
    sections,
    lessons,
    progressMap,
    enrollment,
    progressPercent,
    completedLessons,
    totalLessons,
    learningStats,
  } = courseData

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mb-6">
          <Link
            href="/members/courses"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Library
          </Link>
        </div>
      </div>
      <CourseOverviewContent
        course={course}
        sections={sections}
        lessons={lessons}
        progressMap={progressMap}
        enrollment={enrollment}
        nextLesson={nextLesson}
        progressPercent={progressPercent}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        learningStats={learningStats}
      />
    </>
  )
}
