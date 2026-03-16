"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Start or get an existing conversation with another user
 */
export async function startConversation(otherUserId: string): Promise<{ conversationId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`,
    )
    .maybeSingle()

  if (existing) return { conversationId: existing.id }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      created_by: user.id,
      participant_one: user.id,
      participant_two: otherUserId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) throw error
  return { conversationId: data.id }
}

export async function getConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // 1️⃣ Fetch conversations ONLY (no embeds)
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      id,
      participant_one,
      participant_two,
      last_message_at,
      participant_one_last_read_at,
      participant_two_last_read_at
    `)
    .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("getConversations error:", error)
    throw error
  }

  if (!conversations || conversations.length === 0) return []

  // 2️⃣ Determine other participant IDs
  const otherUserIds = conversations.map((c) =>
    c.participant_one === user.id ? c.participant_two : c.participant_one
  )

  // 3️⃣ Fetch profiles separately (stable + RLS-safe)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", otherUserIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  // 4️⃣ Fetch latest messages
  const conversationIds = conversations.map((c) => c.id)

  const { data: messages } = await supabase
    .from("messages")
    .select(`
      conversation_id,
      body,
      created_at,
      sender_id,
      profiles:profiles!messages_sender_id_fkey (
        full_name,
        display_name,
        username,
        avatar_url
      )
    `)
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })

  const latestMessageMap = new Map<string, string>()
  const latestSenderAvatarMap = new Map<string, string | null>()

  for (const msg of messages ?? []) {
    if (!latestMessageMap.has(msg.conversation_id)) {
      latestMessageMap.set(msg.conversation_id, msg.body)
      latestSenderAvatarMap.set(
        msg.conversation_id,
        msg.profiles?.avatar_url ?? null
      )
    }
  }

  // 5️⃣ Flatten for UI
  return conversations.map((c) => {
    const isParticipantOne = c.participant_one === user.id
    const otherUserId = isParticipantOne
      ? c.participant_two
      : c.participant_one

    const profile = profileMap.get(otherUserId)

    const resolvedName =
      profile?.full_name ||
      profile?.display_name ||
      profile?.username ||
      `User ${otherUserId?.slice(0, 6)}`

    const resolvedAvatar =
      profile?.avatar_url ||
      latestSenderAvatarMap.get(c.id) ||
      null

    const myLastReadAt = isParticipantOne
      ? c.participant_one_last_read_at
      : c.participant_two_last_read_at

    const isUnread =
      c.last_message_at &&
      (!myLastReadAt ||
        new Date(c.last_message_at) > new Date(myLastReadAt))

    return {
      id: c.id,
      participant_one: c.participant_one,
      participant_two: c.participant_two,
      last_message_at: c.last_message_at,
      participant_one_last_read_at: c.participant_one_last_read_at,
      participant_two_last_read_at: c.participant_two_last_read_at,
      other_user_id: otherUserId,
      other_user_name: resolvedName,
      other_user_username: profile?.username ?? null,
      other_user_avatar_url: resolvedAvatar,
      latest_message_body: latestMessageMap.get(c.id) ?? null,
      is_unread: !!isUnread,
    }
  })
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: messages } = await supabase
    .from("messages")
    .select(`
      id,
      body,
      sender_id,
      created_at,
      profiles:profiles!messages_sender_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (!messages) return []

  return messages.map((m: any) => ({
    id: m.id,
    body: m.body,
    sender_id: m.sender_id,
    sender_name: m.profiles?.full_name ?? null,
    sender_avatar_url: m.profiles?.avatar_url ?? null,
    created_at: m.created_at,
  }))
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(conversationId: string, body: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  })

  const { data: convo } = await supabase
    .from("conversations")
    .select("participant_one, participant_two")
    .eq("id", conversationId)
    .single()

  const now = new Date().toISOString()
  const update =
    convo?.participant_one === user.id ? { participant_one_last_read_at: now } : { participant_two_last_read_at: now }

  await supabase
    .from("conversations")
    .update({ ...update, last_message_at: now, updated_at: now })
    .eq("id", conversationId)
}

/**
 * Mark a conversation as read for current user
 */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { data: convo } = await supabase
    .from("conversations")
    .select("participant_one, participant_two")
    .eq("id", conversationId)
    .single()

  const now = new Date().toISOString()
  const update =
    convo?.participant_one === user.id ? { participant_one_last_read_at: now } : { participant_two_last_read_at: now }

  await supabase.from("conversations").update(update).eq("id", conversationId)
}

/**
 * Get all group messages for current user
 */
export async function getGroupMessages() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      body,
      created_at,
      group_id,
      sender_id,
      groups ( name ),
      group_message_reads ( user_id, hidden_at )
    `)
    .not("group_id", "is", null)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data || [])
    .filter((msg: any) => {
      const readRecord = msg.group_message_reads?.find((r: any) => r.user_id === user.id)
      if (readRecord?.hidden_at != null) return false
      return true
    })
    .map((msg: any) => ({
      ...msg,
      is_read:
        msg.group_message_reads?.some(
          (r: any) => r.user_id === user.id
        ) ?? false,
    }))
}

/**
 * Mark group message as read
 */
export async function markGroupMessageRead(messageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  await supabase.from("group_message_reads").upsert({
    message_id: messageId,
    user_id: user.id,
  })
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  await supabase.from("conversations").delete().eq("id", conversationId)
}

/**
 * Hide a group message for the current user (soft delete via group_message_reads)
 */
export async function deleteGroupMessage(messageId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("group_message_reads")
    .upsert(
      {
        message_id: messageId,
        user_id: user.id,
        hidden_at: new Date().toISOString(),
      },
      {
        onConflict: "message_id,user_id",
      }
    )

  if (error) {
    console.error("Delete group message error:", error)
    throw error
  }
}
