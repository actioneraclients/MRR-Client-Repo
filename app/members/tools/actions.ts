"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

// Service role client for bypassing RLS when needed
function createServiceRoleClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export interface MemberTool {
  id: string
  name: string
  slug: string
  short_description: string | null
  full_description: string | null
  image_url: string | null
  launch_url: string | null
  isAvailable: boolean
}

export async function getMemberTools(): Promise<MemberTool[]> {
  try {
    const userClient = await createClient()

    const {
      data: { user },
    } = await userClient.auth.getUser()

    // If no user, return empty list
    if (!user) return []

    const adminClient = createServiceRoleClient()

    // Fetch all active tools ordered by created_at ascending
    const { data: tools, error: toolsError } = await adminClient
      .from("tools")
      .select("id, name, slug, short_description, full_description, image_url, launch_url, plan_only")
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (toolsError) {
      console.error("[getMemberTools] Error fetching tools:", toolsError)
      return []
    }

    if (!tools || tools.length === 0) {
      return []
    }

    // Get user's plan_id from profile
    const { data: profile } = await adminClient.from("profiles").select("plan_id").eq("id", user.id).single()

    // Default to empty set if no plan
    let accessibleToolIds = new Set<string>()

    if (profile?.plan_id) {
      // Fetch tool access entries for user's plan from tool_plan_access table
      const { data: toolAccess } = await adminClient
        .from("tool_plan_access")
        .select("tool_id")
        .eq("plan_id", profile.plan_id)

      // Build lookup set of accessible tool IDs
      if (toolAccess && toolAccess.length > 0) {
        accessibleToolIds = new Set(toolAccess.map((row) => row.tool_id))
      }
    }

    // Filter tools by plan_only visibility: plan_only=true means only show if user has access
    const filteredTools = tools.filter((tool) => {
      const hasAccess = accessibleToolIds.has(tool.id)

      // If tool is restricted visibility
      if (tool.plan_only) {
        return hasAccess
      }

      // Otherwise show to everyone
      return true
    })

    // Map tools to UI-ready format with isAvailable computed per-tool
    return filteredTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      short_description: tool.short_description,
      full_description: tool.full_description,
      image_url: tool.image_url,
      launch_url: tool.launch_url,
      isAvailable: accessibleToolIds.has(tool.id),
    }))
  } catch (error) {
    console.error("[getMemberTools] Unexpected error:", error)
    return []
  }
}
