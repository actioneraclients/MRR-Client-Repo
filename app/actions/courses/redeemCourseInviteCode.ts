"use server"

import { createClient } from "@/lib/supabase/server"

export async function redeemCourseInviteCode(code: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, message: "You must be logged in." }
  }

  const inviteCode = code.trim()

  if (!inviteCode) {
    return { success: false, message: "Invite code is required." }
  }

  // Find course with this invite code
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("invite_code", inviteCode)
    .maybeSingle()

  if (!course) {
    return { success: false, message: "Invalid invite code." }
  }

  // Check existing enrollment
  const { data: existingEnrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle()

  if (existingEnrollment) {
    return {
      success: true,
      message: "You are already enrolled in this course.",
      courseId: course.id,
    }
  }

  // Insert enrollment
  const { error } = await supabase.from("course_enrollments").insert({
    user_id: user.id,
    course_id: course.id,
    access_type: "invite",
  })

  if (error) {
    return { success: false, message: "Unable to enroll in course." }
  }

  return {
    success: true,
    message: "Successfully enrolled in the course.",
    courseId: course.id,
  }
}
