import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const params = await searchParams
  const courseId = params.course_id ?? null

  let courseTitle: string | null = null
  if (courseId) {
    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .maybeSingle()
    courseTitle = course?.title ?? null
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("brand_accent_color")
    .limit(1)
    .maybeSingle()

  const brandAccentColor = siteSettings?.brand_accent_color ?? "#2563eb"

  return (
    <div className="max-w-xl mx-auto mt-20 p-8 border rounded-lg bg-white text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Course Unlocked!</h1>
      <p className="text-gray-600 mb-4">
        Your payment was successful and this course is now available in your account.
        You can access it anytime from the Enrolled tab in your Course Library.
      </p>
      {courseTitle && (
        <p className="text-gray-700 font-medium mb-6">
          You now have access to: {courseTitle}
        </p>
      )}
      <div className="flex flex-col items-center gap-4">
        {courseId && (
          <Link
            href={`/members/courses/${courseId}`}
            className="text-white px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: brandAccentColor }}
          >
            Start Course Now
          </Link>
        )}
        <Link
          href="/members/courses"
          className="px-6 py-3 rounded-md font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go to My Courses
        </Link>
        <Link
          href="/members/courses/learning-notes"
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          View My Learning Notes
        </Link>
      </div>
    </div>
  )
}
