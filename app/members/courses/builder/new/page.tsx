import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewCourseForm } from "./NewCourseForm"
import { getTaxonomyCategories, getTaxonomyTags } from "./actions"

export default async function NewCoursePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [profileRes, categories, tags] = await Promise.all([
    supabase.from("profiles").select("plan_id").eq("id", user.id).maybeSingle(),
    getTaxonomyCategories(),
    getTaxonomyTags(),
  ])

  const profile = profileRes.data

  let canCreatePaidCourses = false
  let remainingPaidCourses: number | null = null

  if (profile?.plan_id) {
    const [paidPermissionRes, paidCourseCountRes] = await Promise.all([
      supabase
        .from("plan_permissions")
        .select("enabled, limit_value")
        .eq("plan_id", profile.plan_id)
        .eq("permission_key", "create_paid_course")
        .maybeSingle(),
      supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("access_type", "paid"),
    ])

    const paidPermission = paidPermissionRes.data
    const paidCourseCount = paidCourseCountRes.count

    const paidLimit = paidPermission?.limit_value ?? null
    remainingPaidCourses =
      paidLimit !== null
        ? Math.max(paidLimit - (paidCourseCount ?? 0), 0)
        : null

    canCreatePaidCourses =
      paidPermission?.enabled === true &&
      (remainingPaidCourses === null || remainingPaidCourses > 0)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/members/courses/builder"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
          Return to Course Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Create New Course
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NewCourseForm
              categories={categories}
              tags={tags}
              canCreatePaidCourses={canCreatePaidCourses}
              remainingPaidCourses={remainingPaidCourses}
            />
          </div>

          <div className="lg:col-span-1">
            <aside className="sticky top-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Getting Started
              </h2>

              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                    <i className="fa-solid fa-book-open text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Create Course Basics
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      Add a course name, description, and thumbnail to help students discover your content. Choose a category and tags to organize your course in the library. A 16:9 thumbnail works best.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
                    <i className="fa-solid fa-tag text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Access Type
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      <strong>Free</strong> — Available to all members at no cost. <strong>Paid</strong> — Set pricing on the Course Overview page after creation. <strong>Plan</strong> — Attached to subscription plans; configured by site administrators.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
                    <i className="fa-solid fa-users text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Community Group
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      Each course automatically creates a private community group for discussions. Students can connect, ask questions, and share progress with other learners.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600">
                    <i className="fa-solid fa-clipboard-check text-sm"></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Course Approval
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      Courses must be submitted for review before appearing in the course library. After approval, any pricing changes require admin review.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
