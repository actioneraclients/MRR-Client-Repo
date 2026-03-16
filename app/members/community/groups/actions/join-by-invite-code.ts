"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function joinGroupByInviteCode(inviteCode: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const normalizedCode = inviteCode.trim()

  if (!normalizedCode) {
    redirect("/members/community/groups?error=missing_code")
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", normalizedCode)
    .single()

  if (groupError || !group) {
    redirect("/members/community/groups?error=invalid_code")
  }

  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "member",
    status: "active",
  })

  if (insertError) {
    if (insertError.code === "23505") {
      redirect(`/members/community/groups/${group.id}`)
    }

    redirect("/members/community/groups?error=join_failed")
  }

  redirect(`/members/community/groups/${group.id}`)
}
