import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getBuilderCourses } from "./actions"
import { getUserCourseCreationPermissions } from "./can-user-create-course"
import { CreateCourseButton } from "./CreateCourseButton"
import { CourseBuilderCard } from "./CourseBuilderCard"
import { MobileBuilderGate } from "./MobileBuilderGate"

export default async function CourseBuilderDashboardPage() {
  const [courses, permissions, siteSettingsRes] = await Promise.all([
    getBuilderCourses(),
    getUserCourseCreationPermissions(),
    (async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from("site_settings")
        .select("brand_accent_color")
        .limit(1)
        .maybeSingle()
      return data?.brand_accent_color ?? null
    })(),
  ])

  const { canCreateCourses, remainingCourses } = permissions
  const brandAccentColor = siteSettingsRes

  return (
    <MobileBuilderGate>
    <div className="p-6 space-y-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-4">
          <Link
            href="/members/courses"
            className="text-sm text-primary hover:underline"
          >
            ← Back to Course Library
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Course Builder</h1>
          <CreateCourseButton
            canCreateCourses={canCreateCourses}
            remainingCourses={remainingCourses}
            brandAccentColor={brandAccentColor}
            label="Create Course"
          />
        </div>

        {/* Course Grid or Empty State */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-gray-700 font-medium mb-1">You haven&apos;t created a course yet.</p>
            <p className="text-sm text-gray-500 mb-6">Create your first course to start building lessons.</p>
            <div className="flex flex-col items-center">
              <CreateCourseButton
                canCreateCourses={canCreateCourses}
                remainingCourses={remainingCourses}
                brandAccentColor={brandAccentColor}
                label="Create Your First Course"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseBuilderCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
    </MobileBuilderGate>
  )
}
