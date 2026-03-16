"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}

export type UserCourseCreationPermissions = {
  canCreateCourses: boolean
  remainingCourses: number | null
}

export async function getUserCourseCreationPermissions(): Promise<UserCourseCreationPermissions> {
  const userClient = await createClient()

  const {
    data: { user },
  } = await userClient.auth.getUser()

  if (!user) {
    return {
      canCreateCourses: false,
      remainingCourses: null,
    }
  }

  const admin = createServiceRoleClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.plan_id) {
    return {
      canCreateCourses: false,
      remainingCourses: null,
    }
  }

  const { data: coursePermission } = await admin
    .from("plan_permissions")
    .select("enabled, limit_value")
    .eq("plan_id", profile.plan_id)
    .eq("permission_key", "create_course")
    .maybeSingle()

  if (!coursePermission?.enabled) {
    return {
      canCreateCourses: false,
      remainingCourses: null,
    }
  }

  const limit = coursePermission.limit_value ?? null

  if (limit === null) {
    return {
      canCreateCourses: true,
      remainingCourses: null,
    }
  }

  const { count: createdCourses } = await admin
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)

  const remainingCourses = Math.max(limit - (createdCourses ?? 0), 0)

  return {
    canCreateCourses: true,
    remainingCourses,
  }
}
