"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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
    },
  )
}

async function verifyAdminAccess() {
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
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { authorized: false, userId: null, error: "Not authenticated" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .single()

  if (!profile?.is_creator) {
    return { authorized: false, userId: null, error: "Not authorized" }
  }

  return { authorized: true, userId: user.id, error: null }
}

type SendMessageInput = {
  recipientId: string
  subject?: string
  body: string
}

type SendMessageResult =
  | { success: true }
  | { success: false; error: string }

export async function sendAdminMessage(
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const { authorized, userId, error: authError } = await verifyAdminAccess()

  if (!authorized || !userId) {
    return { success: false, error: authError || "Unauthorized" }
  }

  const { recipientId, subject, body } = input
  const trimmedBody = body?.trim()

  if (!recipientId) {
    return { success: false, error: "Recipient ID is required" }
  }

  if (!trimmedBody) {
    return { success: false, error: "Message body cannot be empty" }
  }

  if (recipientId === userId) {
    return { success: false, error: "Cannot message yourself" }
  }

  const supabase = createServiceRoleClient()

  try {
    // 1️⃣ Find or create conversation
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_one.eq.${userId},participant_two.eq.${recipientId}),
         and(participant_one.eq.${recipientId},participant_two.eq.${userId})`,
      )
      .maybeSingle()

    let conversationId: string

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({
          created_by: userId,
          participant_one: userId,
          participant_two: recipientId,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error || !newConversation) {
        return { success: false, error: error?.message || "Failed to create conversation" }
      }

      conversationId = newConversation.id
    }

    // 2️⃣ Insert message
    const finalBody = subject
      ? `**${subject}**\n\n${trimmedBody}`
      : trimmedBody

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: finalBody,
    })

    if (messageError) {
      return { success: false, error: messageError.message }
    }

    // 3️⃣ Update conversation timestamps
    const now = new Date().toISOString()
    await supabase
      .from("conversations")
      .update({ last_message_at: now, updated_at: now })
      .eq("id", conversationId)

    // 4️⃣ Check inbox email preference
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("inbox_emails_enabled")
      .eq("id", recipientId)
      .single()

    // 5️⃣ Trigger Edge Function email
    if (recipientProfile?.inbox_emails_enabled === true) {
      await fetch(
        `${process.env.SUPABASE_FUNCTIONS_URL}/notify-inbox`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

            // ✅ REQUIRED: Supabase Edge Function gate
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,

            // ✅ REQUIRED: Your function guard
            "x-function-secret": process.env.FUNCTION_SECRET!,
          },
          body: JSON.stringify({
            recipient_user_id: recipientId,
            sender_name: "Site Admin",
          }),
        },
      )
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return { success: false, error: message }
  }
}
