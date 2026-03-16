"use server"

import { createClient } from "@/lib/supabase/server"

type GetGroupMembersInput = {
  groupId: string
  page?: number
  pageSize?: number
  search?: string
}

type SendDirectMessageInput = {
  recipientId: string
  body: string
}

function normalizeSocial(raw: unknown): {
  linkedin: string | null
  youtube: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  twitter: string | null
  x: string | null
  website: string | null
} {
  const defaults = {
    linkedin: null,
    youtube: null,
    instagram: null,
    facebook: null,
    tiktok: null,
    twitter: null,
    x: null,
    website: null,
  }

  if (!raw || typeof raw !== "object") return defaults

  // Handle array format: [{ platform: "linkedin", url: "..." }, ...]
  if (Array.isArray(raw)) {
    const result = { ...defaults }
    for (const item of raw) {
      if (item && typeof item === "object" && typeof item.platform === "string" && typeof item.url === "string") {
        const key = item.platform.toLowerCase() as keyof typeof defaults
        if (key in result) {
          result[key] = item.url
        }
      }
    }
    return result
  }

  // Handle object format: { linkedin: "...", twitter: "..." }
  const obj = raw as Record<string, unknown>
  return {
    linkedin: typeof obj.linkedin === "string" ? obj.linkedin : null,
    youtube: typeof obj.youtube === "string" ? obj.youtube : null,
    instagram: typeof obj.instagram === "string" ? obj.instagram : null,
    facebook: typeof obj.facebook === "string" ? obj.facebook : null,
    tiktok: typeof obj.tiktok === "string" ? obj.tiktok : null,
    twitter: typeof obj.twitter === "string" ? obj.twitter : null,
    x: typeof obj.x === "string" ? obj.x : null,
    website: typeof obj.website === "string" ? obj.website : null,
  }
}

export async function getGroupMembers(input: GetGroupMembersInput) {
  const supabase = await createClient()

  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20
  const search = (input.search ?? "").trim()

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  let query = supabase
    .from("group_members")
    .select(
      `
      user_id,
      role,
      joined_at,
        profiles!group_members_user_id_profiles_fkey!inner (
        id,
        full_name,
        avatar_url,
        company,
        job_title,
        bio,
        social_links
      )
    `,
      { count: "exact" },
    )
    .eq("group_id", input.groupId)

  if (search.length > 0) {
    query = query.ilike("profiles.full_name", `%${search}%`)
  }

  query = query.order("joined_at", { ascending: false }).range(from, to)

  const { data: rows, error, count } = await query

  if (error || !rows) {
    return {
      members: [],
      totalCount: count ?? 0,
      isAdmin: false,
      error: error?.message ?? null,
    }
  }

  const isAdmin =
    !!currentUserId &&
    rows.some((row) => row.user_id === currentUserId && row.role === "admin")

  const members = rows.map((row) => {
    const profile = row.profiles as {
      id: string
      full_name: string | null
      avatar_url: string | null
      company: string | null
      job_title: string | null
      bio: string | null
      social_links: unknown
    } | null

    return {
      id: row.user_id,
      memberSince: row.joined_at,
      name: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      businessName: profile?.company ?? null,
      expertise: profile?.job_title ?? null,
      bio: profile?.bio ?? null,
      social: normalizeSocial(profile?.social_links),
      role: row.role,
    }
  })

  return {
    members,
    totalCount: count ?? members.length,
    isAdmin,
    error: null,
  }
}

export async function sendDirectMessage(input: SendDirectMessageInput) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const senderId = user.id
  const { recipientId, body } = input

  // Cannot message yourself
  if (senderId === recipientId) {
    return { error: "Cannot message yourself" }
  }

  // Find existing conversation
  const { data: existingConversations, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one.eq.${senderId},participant_two.eq.${recipientId}),and(participant_one.eq.${recipientId},participant_two.eq.${senderId})`,
    )
    .order("updated_at", { ascending: false })
    .limit(1)

  if (findError) {
    return { error: findError.message }
  }

  const existingConversation = existingConversations?.[0] ?? null

  let conversationId: string

  if (existingConversation) {
    conversationId = existingConversation.id
  } else {
    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        created_by: senderId,
        participant_one: senderId,
        participant_two: recipientId,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (createError || !newConversation) {
      return { error: createError?.message ?? "Failed to create conversation" }
    }

    conversationId = newConversation.id
  }

  // Insert message
  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
  })

  if (messageError) {
    return { error: messageError.message }
  }

  // Update conversation timestamps
  const { error: updateError } = await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Get sender name (logged-in user)
  const { data: senderProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()

  // Check inbox email preference
  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("inbox_emails_enabled")
    .eq("id", recipientId)
    .maybeSingle()

  // Trigger Edge Function email (non-blocking)
  if (recipientProfile?.inbox_emails_enabled === true) {
    try {
      await fetch(`${process.env.SUPABASE_FUNCTIONS_URL}/notify-inbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "x-function-secret": process.env.FUNCTION_SECRET!,
        },
        body: JSON.stringify({
          recipient_user_id: recipientId,
          sender_name: senderProfile?.full_name ?? "Another member",
        }),
      })
    } catch {
      // Email notification is non-critical
    }
  }

  return { success: true }
}

export async function promoteGroupMember(input: {
  groupId: string
  memberId: string
}) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const currentUserId = user.id

  // Verify current user is admin of this group
  const { data: adminRow, error: adminError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", input.groupId)
    .eq("user_id", currentUserId)
    .maybeSingle()

  if (adminError || adminRow?.role !== "admin") {
    return { error: "Not authorized" }
  }

  // Prevent promoting self (already admin anyway)
  if (input.memberId === currentUserId) {
    return { error: "Cannot promote yourself" }
  }

  // Promote member
  const { error: updateError } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", input.groupId)
    .eq("user_id", input.memberId)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}

export async function removeGroupMember(input: {
  groupId: string
  memberId: string
}) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Not authenticated" }
  }

  const currentUserId = user.id

  // Fetch group owner
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", input.groupId)
    .single()

  if (groupError || !group) {
    return { error: "Group not found" }
  }

  // Prevent removing the group owner
  if (input.memberId === group.created_by) {
    return { error: "Cannot remove the group owner" }
  }

  // Prevent removing self
  if (input.memberId === currentUserId) {
    return { error: "You cannot remove yourself from the group" }
  }

  // Verify current user is admin of this group
  const { data: adminRow, error: adminError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", input.groupId)
    .eq("user_id", currentUserId)
    .maybeSingle()

  if (adminError || adminRow?.role !== "admin") {
    return { error: "Not authorized" }
  }

  // Remove member from group
  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", input.groupId)
    .eq("user_id", input.memberId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  return { success: true }
}
