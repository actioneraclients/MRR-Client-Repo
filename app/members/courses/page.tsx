import { createClient } from "@/lib/supabase/server"
import {
  getFeaturedCourses,
  getEnrolledCourseIds,
  getCourseTaxonomyMap,
} from "./actions"
import CoursesListingUI from "./courses-listing-ui"

export default async function CoursesLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrolledCourseIds = user ? await getEnrolledCourseIds(user.id) : []

  let userPlanId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, plan_id")
      .eq("id", user.id)
      .single()

    userPlanId = profile?.plan_id ?? null
  }

  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      access_type,
      price,
      payment_url,
      plan_ids,
      status,
      featured,
      is_sponsored,
      created_at,
      created_by,
      course_sections(id),
      course_lessons(id),
      profiles!courses_created_by_fkey(full_name, avatar_url)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  const coursesWithAccess = (courses ?? [])
    .map((course) => {

      let includedInPlan = false

      if (course.plan_ids && userPlanId) {
        try {
          const plans = typeof course.plan_ids === "string"
            ? JSON.parse(course.plan_ids)
            : course.plan_ids
          includedInPlan = Array.isArray(plans) && plans.includes(userPlanId)
        } catch {
          includedInPlan = false
        }
      }

      return {
        ...course,
        includedInPlan
      }
    })
    .sort((a, b) => {
      if (a.featured === b.featured) return 0
      return a.featured ? -1 : 1
    })

  const featuredCourses = await getFeaturedCourses()

  const taxonomyMap = await getCourseTaxonomyMap(coursesWithAccess.map((c) => c.id))

  const formattedCourses = coursesWithAccess.map((course) => {
    const profiles = course.profiles as { full_name: string | null; avatar_url: string | null } | null
    const modules = (course.course_sections as unknown[])?.length ?? 0
    const lessons = (course.course_lessons as unknown[])?.length ?? 0
    const tax = taxonomyMap[course.id] ?? { tags: [] }
    return {
      ...course,
      modules,
      lessons,
      instructor: profiles?.full_name ?? "Unknown Instructor",
      avatar_url: profiles?.avatar_url ?? null,
      ownsCourse: enrolledCourseIds.includes(course.id),
      accessType: course.access_type ?? "free",
      price: course.price ?? 0,
      category: tax.category,
      tags: tax.tags ?? [],
      includedInPlan: course.includedInPlan,
    }
  })

  const usedCategories = Array.from(
    new Map(
      formattedCourses
        .filter((course) => course.category)
        .map((course) => [course.category!.slug, course.category!])
    ).values()
  )

  const usedTags = Array.from(
    new Map(
      formattedCourses
        .flatMap((course) => course.tags ?? [])
        .map((tag) => [tag.slug, tag])
    ).values()
  )

  const formattedFeatured = featuredCourses.map((fc) => {
    const profiles = fc.profiles as { full_name: string | null; avatar_url: string | null } | null
    return {
      id: fc.id,
      title: fc.title,
      description: fc.description,
      thumbnail_url: fc.thumbnail_url,
      instructor: profiles?.full_name ?? "Unknown Instructor",
      avatar_url: profiles?.avatar_url ?? null,
      access_type: fc.access_type ?? "free",
      price: fc.price ?? 0,
    }
  })

  let canManageCourses = false
  if (userPlanId) {
    const { data: planPermissions } = await supabase
      .from("plan_permissions")
      .select("permission_key, enabled")
      .eq("plan_id", userPlanId)
      .in("permission_key", ["create_course", "create_paid_course"])

    canManageCourses =
      planPermissions?.some(
        (p) =>
          p.enabled &&
          (p.permission_key === "create_course" ||
            p.permission_key === "create_paid_course")
      ) ?? false
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("brand_accent_color, member_navigation")
    .limit(1)
    .maybeSingle()

  const brandAccentColor = siteSettings?.brand_accent_color ?? null

  let pageTitle = "Courses"
  let pageDescription = "View our selection of online courses below to take deeper learning journeys."
  const rawNav = siteSettings?.member_navigation
  if (rawNav != null) {
    let navItems: { id?: string; label?: string }[] | null = null
    if (Array.isArray(rawNav)) {
      navItems = rawNav as { id?: string; label?: string }[]
    } else if (typeof rawNav === "string") {
      try {
        const parsed = JSON.parse(rawNav)
        navItems = Array.isArray(parsed) ? (parsed as { id?: string; label?: string }[]) : null
      } catch {
        navItems = null
      }
    }
    if (navItems?.length) {
      const coursesNav = navItems.find((item) => item?.id === "courses" || item?.id === "course")
      if (coursesNav?.label != null && String(coursesNav.label).trim() !== "") {
        pageTitle = String(coursesNav.label).trim()
      }
    }
  }

  return (
    <CoursesListingUI
      courses={formattedCourses}
      featuredCourses={formattedFeatured}
      usedCategories={usedCategories}
      usedTags={usedTags}
      enrolledCourseIds={enrolledCourseIds}
      canManageCourses={canManageCourses}
      brandAccentColor={brandAccentColor}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    />
  )
}
