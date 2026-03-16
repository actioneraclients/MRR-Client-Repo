"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export type TaxonomyOption = { id: string; name: string }

export async function getTaxonomyCategories(): Promise<TaxonomyOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "category")
    .order("name", { ascending: true })
  if (error) {
    console.error("[getTaxonomyCategories]", error)
    return []
  }
  return (data ?? []) as TaxonomyOption[]
}

export async function getTaxonomyTags(): Promise<TaxonomyOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name")
    .eq("type", "content_tag")
    .order("name", { ascending: true })
  if (error) {
    console.error("[getTaxonomyTags]", error)
    return []
  }
  return (data ?? []) as TaxonomyOption[]
}

export async function createCourse(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const courseName = (formData.get("course_name") as string)?.trim() || "Untitled Course"
  const description = (formData.get("description") as string)?.trim() || null
  const accessType = (formData.get("access_type") as string) || "free"
  const categoryId = (formData.get("category_id") as string) || null
  const tagIds = formData.getAll("tag_ids").filter((v): v is string => typeof v === "string" && v.length > 0)
  const groupName = (formData.get("group_name") as string)?.trim() || `${courseName} Discussion`
  const groupDescription = (formData.get("group_description") as string)?.trim() || null

  const thumbnailFile = formData.get("course_thumbnail") as File | null
  const groupListingImageFile = formData.get("group_listing_image") as File | null
  const groupAvatarFile = formData.get("group_avatar") as File | null
  const groupHeaderFile = formData.get("group_header") as File | null

  let thumbnailUrl: string | null = null
  let listingImageUrl: string | null = null
  let avatarUrl: string | null = null
  let headerImageUrl: string | null = null
  const timestamp = Math.floor(Date.now() / 1000)
  const userId = user.id

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

  // Upload course thumbnail → course-images, courses/{userId}/{timestamp}-thumbnail.jpg
  if (thumbnailFile && thumbnailFile.size > 0 && ALLOWED_IMAGE_TYPES.includes(thumbnailFile.type)) {
    const path = `courses/${userId}/${timestamp}-thumbnail.jpg`
    const { error: uploadErr } = await supabase.storage
      .from("course-images")
      .upload(path, thumbnailFile, { upsert: true, contentType: thumbnailFile.type })
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("course-images").getPublicUrl(path)
      thumbnailUrl = urlData.publicUrl
    }
  }

  // Upload group listing image → groups, groups/{userId}/{timestamp}-listing.jpg
  if (groupListingImageFile && groupListingImageFile.size > 0 && ALLOWED_IMAGE_TYPES.includes(groupListingImageFile.type)) {
    const path = `groups/${userId}/${timestamp}-listing.jpg`
    const { error: uploadErr } = await supabase.storage
      .from("groups")
      .upload(path, groupListingImageFile, { upsert: true, contentType: groupListingImageFile.type })
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("groups").getPublicUrl(path)
      listingImageUrl = urlData.publicUrl
    }
  }

  // Upload group avatar → groups, groups/{userId}/{timestamp}-avatar.jpg
  if (groupAvatarFile && groupAvatarFile.size > 0 && ALLOWED_IMAGE_TYPES.includes(groupAvatarFile.type)) {
    const path = `groups/${userId}/${timestamp}-avatar.jpg`
    const { error: uploadErr } = await supabase.storage
      .from("groups")
      .upload(path, groupAvatarFile, { upsert: true, contentType: groupAvatarFile.type })
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("groups").getPublicUrl(path)
      avatarUrl = urlData.publicUrl
    }
  }

  // Upload group header → groups, groups/{userId}/{timestamp}-header.jpg
  if (groupHeaderFile && groupHeaderFile.size > 0 && ALLOWED_IMAGE_TYPES.includes(groupHeaderFile.type)) {
    const path = `groups/${userId}/${timestamp}-header.jpg`
    const { error: uploadErr } = await supabase.storage
      .from("groups")
      .upload(path, groupHeaderFile, { upsert: true, contentType: groupHeaderFile.type })
    if (!uploadErr) {
      const { data: urlData } = supabase.storage.from("groups").getPublicUrl(path)
      headerImageUrl = urlData.publicUrl
    }
  }

  // 4. Create the course
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      title: courseName,
      description,
      thumbnail_url: thumbnailUrl,
      access_type: accessType,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single()

  if (courseError || !course) {
    console.error("[createCourse] Course insert failed:", courseError)
    return { error: courseError?.message || "Failed to create course" }
  }

  const courseId = course.id

  const { error: enrollError } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      user_id: user.id,
      access_type: "owner",
    })

  if (enrollError) {
    console.error("Creator enrollment failed:", enrollError)
  }

  const groupSlug = `course-${courseId}`

  // 5. Create the community group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: groupName,
      slug: groupSlug,
      description: groupDescription,
      visibility: "private",
      listing_image_url: listingImageUrl,
      avatar_url: avatarUrl,
      header_image_url: headerImageUrl,
      created_by: user.id,
      status: "active",
      allow_member_posts: true,
      require_post_approval: false,
      allow_member_events: false,
      allow_member_invites: true,
      deleted_at: null,
      invite_code: null,
    })
    .select("id")
    .single()

  if (groupError || !group) {
    console.error("[createCourse] Group insert failed:", groupError)
    return { error: groupError?.message || "Failed to create group" }
  }

  // 6. Link the group to the course
  await supabase
    .from("courses")
    .update({ group_id: group.id })
    .eq("id", courseId)

  // 4. Add group membership (creator as admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  })

  // 7. Insert taxonomy relations - Category & Tags
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const sanitizedCategoryId =
    categoryId && typeof categoryId === "string"
      ? (() => {
          const t = categoryId.trim()
          return t && UUID_REGEX.test(t) ? t : null
        })()
      : null
  const sanitizedTagIds = (tagIds as string[])
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean)
    .filter((id) => UUID_REGEX.test(id))

  if (sanitizedCategoryId) {
    const { error: categoryRelError } = await supabase
      .from("taxonomy_relations")
      .insert({
        taxonomy_id: sanitizedCategoryId,
        entity_type: "course",
        entity_id: courseId,
      })
    if (categoryRelError) {
      console.error("[createCourse] Category taxonomy relation insert failed:", categoryRelError)
    }
  }

  if (sanitizedTagIds.length > 0) {
    const { error: tagsRelError } = await supabase
      .from("taxonomy_relations")
      .insert(
        sanitizedTagIds.map((taxonomy_id) => ({
          taxonomy_id,
          entity_type: "course",
          entity_id: courseId,
        }))
      )
    if (tagsRelError) {
      console.error("[createCourse] Tag taxonomy relations insert failed:", tagsRelError)
    }
  }

  // 7. Create default Module 1
  await supabase.from("course_sections").insert({
    course_id: courseId,
    title: "Module 1",
    sort_order: 1,
  })

  revalidatePath("/members/courses/builder")
  redirect(`/members/courses/builder/${courseId}`)
}
