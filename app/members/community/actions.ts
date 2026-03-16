"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { FeedPost, FeedReply } from "@/lib/types/community"

export async function getFeedPostsPage(
  params?: { limit?: number; cursor?: { created_at: string; id: string } | null }
): Promise<{ posts: FeedPost[]; nextCursor: { created_at: string; id: string } | null }> {
  const supabase = await createClient()
  const limit = params?.limit ?? 20

  let query = supabase
    .from("comments")
    .select(
      `
      id,
      author_id,
      body,
      image_url,
      document_url,
      document_name,
      link_url,
      video_url,
      video_title,
      context_type,
      context_label,
      parent_id,
      status,
      created_at,
      profiles!comments_author_id_fkey (
        display_name,
        avatar_url
      )
    `,
    )
    .eq("context_type", "member_feed")
    .is("parent_id", null)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit)

  if (params?.cursor) {
    const c = params.cursor
    const ts = c.created_at.replace(/"/g, '\\"')
    const id = c.id.replace(/"/g, '\\"')
    query = query.or(
      `created_at.lt."${ts}",and(created_at.eq."${ts}",id.lt."${id}")`,
    )
  }

  const { data: posts, error } = await query

  if (error) {
    console.error("Error fetching feed posts:", error)
    return { posts: [], nextCursor: null }
  }

  const mapped = (posts || []).map((post: any) => {
    const dn = post.profiles?.display_name || "Unknown User"
    return {
      ...post,
      author: post.profiles
        ? { name: dn, display_name: dn, avatar_url: post.profiles.avatar_url }
        : undefined,
      profiles: undefined,
    }
  })

  const nextCursor =
    mapped.length === limit && mapped[mapped.length - 1]
      ? {
          created_at: mapped[mapped.length - 1].created_at,
          id: mapped[mapped.length - 1].id,
        }
      : null

  return { posts: mapped, nextCursor }
}

export async function getFeedRepliesForPosts(
  postIds: string[],
): Promise<Record<string, FeedReply[]>> {
  if (postIds.length === 0) return {}

  const supabase = await createClient()

  const { data: replies, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      author_id,
      body,
      parent_id,
      status,
      created_at,
      profiles!comments_author_id_fkey (
        display_name,
        avatar_url
      )
    `,
    )
    .in("parent_id", postIds)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching feed replies:", error)
    return {}
  }

  const mapped = (replies || []).map((reply: any) => {
    const dn = reply.profiles?.display_name || "Unknown User"
    return {
      ...reply,
      author: reply.profiles
        ? { name: dn, display_name: dn, avatar_url: reply.profiles.avatar_url }
        : undefined,
      profiles: undefined,
    }
  })

  const byParent: Record<string, FeedReply[]> = {}
  for (const r of mapped) {
    if (!byParent[r.parent_id]) byParent[r.parent_id] = []
    byParent[r.parent_id].push(r)
  }
  return byParent
}

export async function getFeedReplies(postId: string): Promise<FeedReply[]> {
  const supabase = await createClient()

  const { data: replies, error } = await supabase
    .from("comments")
    .select(`
      id,
      author_id,
      body,
      parent_id,
      status,
      created_at,
      profiles!comments_author_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq("parent_id", postId)
    .in("status", ["active", "approved"])
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching replies:", error)
    return []
  }

  return (replies || []).map((reply: any) => ({
    ...reply,
    author: reply.profiles
      ? {
          display_name: reply.profiles.display_name || "Unknown User",
          avatar_url: reply.profiles.avatar_url,
        }
      : undefined,
    profiles: undefined,
  }))
}

export async function uploadFeedImage(file: File): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("feed-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("feed-images").getPublicUrl(fileName)

  return publicUrl
}

export async function uploadFeedDocument(file: File): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("feed-documents").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("feed-documents").getPublicUrl(fileName)

  return publicUrl
}

export async function createFeedPost(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to create a post" }
  }

  const body = formData.get("body") as string
  const imageUrl = formData.get("imageUrl") as string | null
  const documentUrl = formData.get("documentUrl") as string | null
  const documentName = formData.get("documentName") as string | null
  const linkUrl = formData.get("linkUrl") as string | null
  const videoUrl = formData.get("videoUrl") as string | null
  const videoTitle = formData.get("videoTitle") as string | null

  if (!body?.trim()) {
    return { success: false, error: "Post content is required" }
  }

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    body: body.trim(),
    image_url: imageUrl || null,
    document_url: documentUrl || null,
    document_name: documentName || null,
    link_url: linkUrl || null,
    video_url: videoUrl || null,
    video_title: videoTitle || null,
    context_type: "member_feed",
    context_label: "Member Feed",
    status: "active",
  })

  if (error) {
    console.error("Error creating post:", error)
    return { success: false, error: "Failed to create post" }
  }

  revalidatePath("/members/community")
  return { success: true }
}

export async function createGroupFeedPost(
  groupId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to create a post" }
  }

  // Accept both field names defensively
  const body = (formData.get("body") as string) || (formData.get("content") as string) || ""

  const imageUrl = formData.get("imageUrl") as string | null
  const documentUrl = formData.get("documentUrl") as string | null
  const documentName = formData.get("documentName") as string | null
  const linkUrl = formData.get("linkUrl") as string | null

  if (!body.trim()) {
    return { success: false, error: "Post content is required" }
  }

  // Membership check
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return { success: false, error: "You are not a member of this group" }
  }

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    body: body.trim(),
    image_url: imageUrl || null,
    document_url: documentUrl || null,
    document_name: documentName || null,
    link_url: linkUrl || null,
    context_type: "group_feed",
    context_id: groupId,
    context_label: "Group",
    status: "active",
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/members/community/groups/${groupId}`)
  return { success: true }
}

export async function createFeedReply(parentId: string, body: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to reply" }
  }

  if (!body?.trim()) {
    return { success: false, error: "Reply content is required" }
  }

  const { error } = await supabase.from("comments").insert({
    author_id: user.id,
    parent_id: parentId,
    body: body.trim(),
    context_type: "member_feed",
    context_label: "Member Feed",
    status: "active",
  })

  if (error) {
    console.error("Error creating reply:", error)
    return { success: false, error: "Failed to create reply" }
  }

  revalidatePath("/members/community")
  return { success: true }
}

export async function reportFeedItem(
  itemId: string,
  reason: string,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to report content" }
  }

  // Only update if current status is 'active'
  const { error } = await supabase
    .from("comments")
    .update({
      status: "reported",
      reported_by: user.id,
      reported_at: new Date().toISOString(),
      report_reason: reason,
    })
    .eq("id", itemId)
    .eq("status", "active")

  if (error) {
    console.error("Error reporting item:", error)
    return { success: false, error: "Failed to report content" }
  }

  revalidatePath("/members/community")
  return { success: true }
}

export async function getCurrentUserProfile(): Promise<{
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  is_creator: boolean
} | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_creator")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return {
      id: user.id,
      email: user.email || "",
      display_name: user.email?.split("@")[0] || "User",
      avatar_url: null,
      is_creator: false,
    }
  }

  return {
    id: user.id,
    email: user.email || "",
    display_name: profile.display_name || user.email?.split("@")[0] || "User",
    avatar_url: profile.avatar_url || null,
    is_creator: profile.is_creator ?? false,
  }
}

export async function getCommunityUiSettings(): Promise<{
  brand_background_color: string | null
  brand_accent_color: string | null
  member_navigation: unknown
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("brand_background_color, brand_accent_color, member_navigation")
    .single()

  if (error) {
    console.error("Error fetching community UI settings:", error)
    return {
      brand_background_color: null,
      brand_accent_color: null,
      member_navigation: null,
    }
  }

  return {
    brand_background_color: data?.brand_background_color ?? null,
    brand_accent_color: data?.brand_accent_color ?? null,
    member_navigation: data?.member_navigation ?? null,
  }
}

export async function getGuidelines(): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_settings")
    .select("community_guidelines")
    .single()

  if (error) {
    console.error("Error fetching community guidelines:", error)
    return ""
  }

  return data?.community_guidelines || ""
}

export async function updateGuidelines(
  content: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify user is creator/admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator")
    .eq("id", user.id)
    .single()

  if (!profile?.is_creator) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("site_settings")
    .update({ community_guidelines: content })
    .eq("id", 1)

  if (error) {
    console.error("Error updating guidelines:", error)
    return { success: false, error: "Failed to update guidelines" }
  }

  revalidatePath("/members/community")

  return { success: true }
}

export async function updateFeedComment(
  commentId: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to edit a comment" }
  }

  if (!body?.trim()) {
    return { success: false, error: "Comment content is required" }
  }

  // Verify the comment exists and user owns it
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("author_id, context_type, context_id")
    .eq("id", commentId)
    .single()

  if (fetchError || !comment) {
    return { success: false, error: "Comment not found" }
  }

  if (comment.author_id !== user.id) {
    return { success: false, error: "You can only edit your own comments" }
  }

  // Update only the body field
  const { error: updateError } = await supabase.from("comments").update({ body: body.trim() }).eq("id", commentId)

  if (updateError) {
    console.error("Error updating comment:", updateError)
    return { success: false, error: "Failed to update comment" }
  }

  // Revalidate based on context type
  if (comment.context_type === "member_feed") {
    revalidatePath("/members/community")
  } else if (comment.context_type === "group_feed" && comment.context_id) {
    revalidatePath(`/members/community/groups/${comment.context_id}`)
  }

  return { success: true }
}

export async function deleteFeedComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "You must be logged in to delete a comment" }
  }

  // Verify the comment exists and user owns it
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("author_id, context_type, context_id")
    .eq("id", commentId)
    .single()

  if (fetchError || !comment) {
    return { success: false, error: "Comment not found" }
  }

  if (comment.author_id !== user.id) {
    return { success: false, error: "You can only delete your own comments" }
  }

  // Hard delete the comment
  const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId)

  if (deleteError) {
    console.error("Error deleting comment:", deleteError)
    return { success: false, error: "Failed to delete comment" }
  }

  // Revalidate based on context type
  if (comment.context_type === "member_feed") {
    revalidatePath("/members/community")
  } else if (comment.context_type === "group_feed" && comment.context_id) {
    revalidatePath(`/members/community/groups/${comment.context_id}`)
  }

  return { success: true }
}
