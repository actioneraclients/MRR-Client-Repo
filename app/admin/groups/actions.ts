"use server"

import { createClient } from "@/lib/supabase/server"

export type AdminGroup = {
  group_id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  visibility: string
  created_at: string | null
  status: string
  created_by: string
  owner_name: string | null
  owner_avatar_url: string | null
  members_count: number
  categories: string | null
  invite_code: string | null
}

export async function getAdminGroups(): Promise<{
  data: AdminGroup[] | null
  error: string | null
}> {
  const supabase = await createClient()

  /** 1. Fetch groups */
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select(`
      id,
      name,
      slug,
      description,
      avatar_url,
      visibility,
      invite_code,
      created_at,
      status,
      created_by
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (groupsError) {
    console.error("[Admin Groups] Groups fetch failed:", groupsError)
    return { data: null, error: groupsError.message }
  }

  if (!groups || groups.length === 0) {
    return { data: [], error: null }
  }

  const groupIds = groups.map((g) => g.id)

  const ownerUserIds = new Set<string>()
  groups.forEach((g) => {
    if (g.created_by) {
      ownerUserIds.add(g.created_by)
    }
  })

  /** 2. Fetch owner profiles (NO FK EMBEDDING) */
  let profileMap = new Map<string, { id: string; full_name: string | null; avatar_url: string | null }>()

  if (ownerUserIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(ownerUserIds))

    if (profilesError) {
      console.error("[Admin Groups] Profiles fetch failed:", profilesError)
      // Don't fail - just continue without profile data
    } else {
      profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])
    }
  }

  /** 3. Fetch categories via taxonomy_relations -> taxonomies */
  const { data: relations } = await supabase
    .from("taxonomy_relations")
    .select("entity_id, taxonomy_id")
    .eq("entity_type", "group")
    .in("entity_id", groupIds)

  const taxonomyIds = new Set<string>()
  relations?.forEach((r) => {
    if (r.taxonomy_id) {
      taxonomyIds.add(r.taxonomy_id)
    }
  })

  let taxonomyMap = new Map<string, { name: string; type: string }>()

  if (taxonomyIds.size > 0) {
    const { data: taxonomies } = await supabase
      .from("taxonomies")
      .select("id, name, type")
      .in("id", Array.from(taxonomyIds))

    taxonomyMap = new Map(taxonomies?.map((t) => [t.id, t]) || [])
  }

  const categoryMap = new Map<string, string[]>()
  relations?.forEach((r) => {
    const taxonomy = taxonomyMap.get(r.taxonomy_id)
    if (taxonomy?.type === "group_category") {
      const list = categoryMap.get(r.entity_id) || []
      list.push(taxonomy.name)
      categoryMap.set(r.entity_id, list)
    }
  })

  /** 4. Fetch member counts */
  const { data: counts } = await supabase.from("group_members").select("group_id").in("group_id", groupIds)

  const countMap = new Map<string, number>()
  counts?.forEach((c) => {
    countMap.set(c.group_id, (countMap.get(c.group_id) || 0) + 1)
  })

  /** 5. Build UI-ready objects */
  const result: AdminGroup[] = groups.map((group) => {
    const owner = group.created_by ? profileMap.get(group.created_by) : null

    return {
      group_id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      avatar_url: group.avatar_url,
      visibility: group.visibility,
      invite_code: group.invite_code || null,
      created_at: group.created_at,
      status: group.status || "active",
      created_by: group.created_by || "",
      owner_name: owner?.full_name || null,
      owner_avatar_url: owner?.avatar_url || null,
      members_count: countMap.get(group.id) || 0,
      categories: categoryMap.get(group.id)?.join(", ") || null,
    }
  })

  return { data: result, error: null }
}

export async function pauseGroup(
  groupId: string,
  shouldPause: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("groups")
    .update({
      status: shouldPause ? "paused" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .is("deleted_at", null)

  if (error) {
    console.error("[Admin Groups] pauseGroup error:", error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function reassignGroupOwner(
  groupId: string,
  newOwnerId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // 1️⃣ Demote ALL existing admins → member
  const { error: demoteError } = await supabase
    .from("group_members")
    .update({ role: "member" })
    .eq("group_id", groupId)
    .eq("role", "admin")

  if (demoteError) {
    console.error("[Admin Groups] demote admins error:", demoteError)
    return { success: false, error: demoteError.message }
  }

  // 2️⃣ Promote new admin (update first)
  const { data: updatedRows, error: promoteError } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", newOwnerId)
    .select("id")

  if (promoteError) {
    console.error("[Admin Groups] promote admin error:", promoteError)
    return { success: false, error: promoteError.message }
  }

  // 3️⃣ If no rows updated → INSERT admin row
  if (!updatedRows || updatedRows.length === 0) {
    const { error: insertError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: newOwnerId,
      role: "admin",
      joined_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[Admin Groups] insert admin error:", insertError)
      return { success: false, error: insertError.message }
    }
  }

  // 4️⃣ Update group ownership
  const { error: ownerError } = await supabase
    .from("groups")
    .update({
      created_by: newOwnerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)

  if (ownerError) {
    console.error("[Admin Groups] update created_by error:", ownerError)
    return { success: false, error: ownerError.message }
  }

  return { success: true, error: null }
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("groups")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .is("deleted_at", null)

  if (error) {
    console.error("[Admin Groups] deleteGroup error:", error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function getGroupMembers(groupId: string): Promise<{
  data: { id: string; full_name: string | null; avatar_url: string | null }[] | null
  error: string | null
}> {
  const supabase = await createClient()

  // Step 1: Get user_ids from group_members
  const { data: memberRows, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)

  if (membersError) {
    console.error("[Admin Groups] getGroupMembers (fetch members) error:", membersError)
    return { data: null, error: membersError.message }
  }

  if (!memberRows || memberRows.length === 0) {
    return { data: [], error: null }
  }

  const userIds = memberRows.map((m) => m.user_id)

  // Step 2: Fetch profiles for those user_ids
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds)

  if (profilesError) {
    console.error("[Admin Groups] getGroupMembers (fetch profiles) error:", profilesError)
    return { data: null, error: profilesError.message }
  }

  return { data: profiles || [], error: null }
}

export type GroupCategory = {
  id: string
  name: string
}

export async function getGroupCategories(): Promise<{ data: GroupCategory[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "group_category")
    .order("name", { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}
