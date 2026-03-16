"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export type LegalPageRow = {
  id: string
  page_type: "terms" | "privacy"
  title: string | null
  content: string | null
  updated_at: string | null
}

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

async function verifyAdminAccess(): Promise<{ authorized: boolean; error: string | null }> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { authorized: false, error: "Not authenticated" }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .single()
  if (!profile?.is_creator) return { authorized: false, error: "Not authorized" }
  return { authorized: true, error: null }
}

export async function getLegalPages(): Promise<LegalPageRow[]> {
  const { authorized } = await verifyAdminAccess()
  if (!authorized) return []

  const supabase = createServiceRoleClient()
  const { data } = await supabase.from("legal_pages").select("*")
  return (data ?? []) as LegalPageRow[]
}

export async function updateLegalPage(pageType: string, content: string) {
  const { authorized, error: authError } = await verifyAdminAccess()
  if (!authorized) {
    throw new Error(authError ?? "Unauthorized")
  }

  if (!pageType || (pageType !== "terms" && pageType !== "privacy")) {
    throw new Error("Invalid page type")
  }

  const supabase = createServiceRoleClient()

  await supabase
    .from("legal_pages")
    .update({
      content: content ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("page_type", pageType)

  revalidatePath("/admin/sales-pages")
  revalidatePath("/terms")
  revalidatePath("/privacy")
}
