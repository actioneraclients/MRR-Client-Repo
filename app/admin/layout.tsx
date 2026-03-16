import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "./_components/AdminShell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/members/dashboard")
  }

  const { data: profile } = await supabase.from("profiles").select("is_creator").eq("id", user.id).single()

  if (!profile?.is_creator) {
    redirect("/members/dashboard")
  }

  return <AdminShell>{children}</AdminShell>
}
