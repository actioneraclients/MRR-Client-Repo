import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CourseTable from "@/components/admin/courses/CourseTable"

export const dynamic = "force-dynamic"

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_creator")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.is_creator !== true) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Not authorized</p>
      </div>
    )
  }

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      status,
      access_type,
      price,
      stripe_price_id,
      payment_url,
      featured,
      is_sponsored,
      created_by,
      created_at
    `)
    .order("is_sponsored", { ascending: false })
    .order("created_at", { ascending: false })

  const rows = courses ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Admin • Courses
        </h1>
      </div>

      <CourseTable courses={rows} />
    </div>
  )
}
