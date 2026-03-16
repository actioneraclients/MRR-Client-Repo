"use server"

import { createClient } from "@/lib/supabase/server"

export type GroupForListing = {
  id: string
  name: string
  slug: string // Added slug field
  description: string | null
  listingImageUrl: string | null
  joinPolicy: "open" | "request"
  role: "member" | "moderator" | "owner" | "none"
  status: string | null
  deleted_at: string | null
  memberCount: number
  categoryIds: string[]
  createdByName: string | null
  createdByAvatarUrl: string | null
}

export async function getUserGroupsForListing(): Promise<GroupForListing[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1️⃣ Fetch public / request groups (no membership logic)
  const { data: publicGroups } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      slug,
      description,
      listing_image_url,
      visibility,
      status,
      deleted_at,
      created_by,
      profiles!groups_created_by_fkey (full_name, avatar_url)
    `)
    .in("visibility", ["public", "request"])
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  // 2️⃣ Fetch user memberships (relationship-table first) - only if user exists
  let memberGroups: Array<{
    role: string
    groups: {
      id: string
      name: string
      slug: string
      description: string | null
      listing_image_url: string | null
      visibility: string
      status: string | null
      deleted_at: string | null
      profiles?: { full_name: string | null; avatar_url: string | null } | null
    } | null
  }> = []

  if (user) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select(`
        role,
        groups (
          id,
          name,
          slug,
          description,
          listing_image_url,
          visibility,
          status,
          deleted_at,
          created_by,
          profiles!groups_created_by_fkey (full_name, avatar_url)
        )
      `)
      .eq("user_id", user.id)

    console.log("[v0] DEBUG memberships:", memberships)

    if (memberships) {
      memberGroups = memberships as typeof memberGroups
    }
  }

  // 3️⃣ Normalize into UI-ready objects
  const result: GroupForListing[] = []
  const seenIds = new Set<string>()

  // Add member groups first (with their role)
  for (const membership of memberGroups) {
    const g = membership.groups
    if (!g || seenIds.has(g.id)) continue
    seenIds.add(g.id)

    result.push({
      id: g.id,
      name: g.name,
      slug: g.slug, // Added slug
      description: g.description,
      listingImageUrl: g.listing_image_url,
      joinPolicy: g.visibility === "request" ? "request" : "open",
      role: membership.role as "member" | "moderator" | "owner",
      status: g.status,
      deleted_at: g.deleted_at,
      memberCount: 0,
      categoryIds: [],
      createdByName: g.profiles?.full_name ?? null,
      createdByAvatarUrl: g.profiles?.avatar_url ?? null,
    })
  }

  // Add public groups (with role: "none") - de-duplicate by id
  if (publicGroups) {
    for (const g of publicGroups) {
      if (seenIds.has(g.id)) continue
      seenIds.add(g.id)

      result.push({
        id: g.id,
        name: g.name,
        slug: g.slug, // Added slug
        description: g.description,
        listingImageUrl: g.listing_image_url,
        joinPolicy: g.visibility === "request" ? "request" : "open",
        role: "none",
        status: g.status,
        deleted_at: g.deleted_at,
        memberCount: 0,
        categoryIds: [],
        createdByName: (g as { profiles?: { full_name: string | null } | null }).profiles?.full_name ?? null,
        createdByAvatarUrl: (g as { profiles?: { avatar_url: string | null } | null }).profiles?.avatar_url ?? null,
      })
    }
  }

  const groupIds = result.map((g) => g.id)

  if (groupIds.length > 0) {
    const { data: taxonomyRows } = await supabase
      .from("taxonomy_relations")
      .select("entity_id, taxonomy_id")
      .eq("entity_type", "group")
      .in("entity_id", groupIds)

    const categoryMap = new Map<string, string[]>()

    if (taxonomyRows) {
      for (const row of taxonomyRows) {
        const list = categoryMap.get(row.entity_id) ?? []
        list.push(row.taxonomy_id)
        categoryMap.set(row.entity_id, list)
      }
    }

    for (const group of result) {
      group.categoryIds = categoryMap.get(group.id) ?? []
    }

    // Fetch member counts
    const { data: memberRows } = await supabase.from("group_members").select("group_id").in("group_id", groupIds)

    const memberCountMap = new Map<string, number>()
    if (memberRows) {
      for (const row of memberRows) {
        const current = memberCountMap.get(row.group_id) ?? 0
        memberCountMap.set(row.group_id, current + 1)
      }
    }

    // Update each group's memberCount
    for (const group of result) {
      group.memberCount = memberCountMap.get(group.id) ?? 0
    }
  }

  console.log("[v0] DEBUG final groups:", result)

  return result
}

export type CreateGroupInput = {
  name: string
  slug: string
  visibility: "public" | "request" | "private"
  description?: string
  allow_member_posts?: boolean
  require_post_approval?: boolean
  allow_member_events?: boolean
  allow_member_invites?: boolean
  categoryId?: string
  listing_image_url?: string
  header_image_url?: string
  avatar_url?: string
  invite_code?: string
}

export async function createGroup(
  input: CreateGroupInput,
): Promise<{ success: boolean; error?: string; groupId?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be logged in to create a group" }
    }

    // Check for unique slug
    const { data: existingGroup } = await supabase.from("groups").select("id").eq("slug", input.slug).single()

    if (existingGroup) {
      return { success: false, error: "A group with this slug already exists" }
    }

    const { data: newGroup, error: insertError } = await supabase
      .from("groups")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        visibility: input.visibility,
        created_by: user.id,
        allow_member_posts: input.allow_member_posts ?? true,
        require_post_approval: input.require_post_approval ?? false,
        allow_member_events: input.allow_member_events ?? false,
        allow_member_invites: input.allow_member_invites ?? true,
        listing_image_url: input.listing_image_url || null,
        header_image_url: input.header_image_url || null,
        avatar_url: input.avatar_url || null,
        status: "active", // Add status field
        deleted_at: null, // Add deleted_at field
        invite_code: input.invite_code ?? null,
      })
      .select("id")
      .single()

    if (insertError || !newGroup) {
      console.error("[createGroup] Group insert failed:", insertError)
      return { success: false, error: insertError?.message || "Failed to create group" }
    }

    const groupId = newGroup.id

    if (input.categoryId) {
      const { error: taxonomyError } = await supabase.from("taxonomy_relations").insert({
        taxonomy_id: input.categoryId,
        entity_type: "group",
        entity_id: groupId,
      })

      if (taxonomyError) {
        console.error("[createGroup] Category relation insert failed:", taxonomyError)
        // Do not block group creation - log error only
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("[createGroup] failed to fetch profile:", profileError)
      return {
        success: false,
        error: "Group created, but failed to assign admin profile",
      }
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "admin",
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
    })

    if (memberError) {
      console.error("[createGroup] failed to insert admin membership:", memberError)
      return {
        success: false,
        error: "Group created, but failed to assign you as admin",
      }
    }

    return { success: true, groupId }
  } catch (err) {
    console.error("[createGroup] Unexpected error:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown server error",
    }
  }
}
