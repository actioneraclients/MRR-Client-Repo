"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function joinPrivateGroup(groupId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=/members/community/group-join?id=${groupId}`)
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: user.id,
    role: "member",
    status: "active",
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  })

  if (error) {
    if (error.code === "23505") {
      redirect(`/members/community/groups/${groupId}`)
    }

    redirect(`/members/community/group-join?id=${groupId}&error=insert_failed`)
  }

  redirect(`/members/community/groups/${groupId}`)
}
