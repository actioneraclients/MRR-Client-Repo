"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function approveCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ status: "approved" })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function retireCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ status: "retired" })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function restoreCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ status: "approved" })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function toggleFeaturedCourse(courseId: string, featured: boolean) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ featured: !featured })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)

  revalidatePath("/admin/courses")
}

export async function sponsorCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ is_sponsored: false })
    .eq("is_sponsored", true)

  await supabase
    .from("courses")
    .update({ is_sponsored: true })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function unsponsorCourse(courseId: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ is_sponsored: false })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function updateCourseStatus(courseId: string, status: string) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({ status })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function updateCourseStripeDetails(
  courseId: string,
  price: number | null,
  stripe_price_id: string | null,
  payment_url: string | null
) {
  const supabase = await createClient()

  await supabase
    .from("courses")
    .update({
      price,
      stripe_price_id,
      payment_url,
    })
    .eq("id", courseId)

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function updateCourseAccessType(
  courseId: string,
  accessType: "free" | "paid" | "plan"
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("courses")
    .update({
      access_type: accessType
    })
    .eq("id", courseId)

  if (error) {
    console.error("Error updating course access type:", error)
  }

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function updateCoursePlans(
  courseId: string,
  planIds: string[]
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("courses")
    .update({
      plan_ids: planIds
    })
    .eq("id", courseId)

  if (error) {
    console.error("Error saving course plans:", error)
  }

  revalidatePath("/admin/courses")
  revalidatePath("/members/courses")
}

export async function getActivePlans(): Promise<
  { success: true; plans: { id: string; name: string }[] } | { success: false; error: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("plans")
    .select("id, name")
    .eq("active", true)
    .order("name")

  if (error) return { success: false, error: error.message }
  return { success: true, plans: (data ?? []) as { id: string; name: string }[] }
}

export async function getCourseAccessPlanIds(
  courseId: string
): Promise<{ success: true; planIds: string[] } | { success: false; error: string }> {

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select("plan_ids")
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    planIds: data?.plan_ids ?? []
  }
}
