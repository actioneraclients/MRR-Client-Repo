"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateCourse(
  courseId: string,
  updates: {
    title?: string
    description?: string | null
    thumbnail_url?: string | null
    hero_image_url?: string | null
    instructor_name?: string | null
    instructor_avatar?: string | null
    access_type?: string | null
    price?: number | null
    status?: string
    drip_enabled?: boolean
    invite_code?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const payload: Record<string, unknown> = {}
  if (updates.title !== undefined) payload.title = updates.title.trim()
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null
  if (updates.thumbnail_url !== undefined) payload.thumbnail_url = updates.thumbnail_url || null
  if (updates.hero_image_url !== undefined) payload.hero_image_url = updates.hero_image_url || null
  if (updates.instructor_name !== undefined) payload.instructor_name = updates.instructor_name?.trim() || null
  if (updates.instructor_avatar !== undefined) payload.instructor_avatar = updates.instructor_avatar || null
  if (updates.access_type !== undefined) payload.access_type = updates.access_type || null
  if (updates.price !== undefined) payload.price = updates.price
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.drip_enabled !== undefined) payload.drip_enabled = updates.drip_enabled
  if (updates.invite_code !== undefined) payload.invite_code = updates.invite_code?.trim() || null

  if (Object.keys(payload).length === 0) {
    return { success: true }
  }

  const { error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", courseId)

  if (error) {
    console.error("[updateCourse]", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")

  return { success: true }
}

export async function submitCourseForReview(courseId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("courses")
    .update({ status: "pending" })
    .eq("id", courseId)
    .eq("created_by", user.id)

  if (error) {
    console.error("[submitCourseForReview]", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")

  return { success: true }
}

export async function updateCourseThumbnail(
  courseId: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("courses")
    .update({ thumbnail_url: url })
    .eq("id", courseId)

  if (error) {
    console.error("[updateCourseThumbnail]", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")

  return { success: true }
}

export async function createModule(formData: FormData) {
  const supabase = await createClient()

  const courseId = formData.get("courseId")
  if (!courseId || typeof courseId !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return

  const { data: modules } = await supabase
    .from("course_sections")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = (modules?.[0]?.sort_order ?? 0) + 1

  await supabase.from("course_sections").insert({
    course_id: courseId,
    title: "New Module",
    sort_order: nextOrder,
  })

  revalidatePath(`/members/courses/builder/${courseId}`)
}

export async function updateModuleTitle(formData: FormData) {
  const supabase = await createClient()

  const moduleId = formData.get("moduleId")
  const title = formData.get("title")
  const courseId = formData.get("courseId")

  if (!moduleId || typeof moduleId !== "string" || !title || typeof title !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return

  await supabase
    .from("course_sections")
    .update({ title: title.trim() })
    .eq("id", moduleId)

  if (courseId && typeof courseId === "string") {
    revalidatePath(`/members/courses/builder/${courseId}`)
  }
  revalidatePath("/members/courses/builder")
}

export async function createLesson(formData: FormData) {
  const supabase = await createClient()

  const courseId = formData.get("courseId")
  const sectionId = formData.get("sectionId")

  if (!courseId || typeof courseId !== "string" || !sectionId || typeof sectionId !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = (lessons?.[0]?.sort_order ?? 0) + 1

  await supabase.from("course_lessons").insert({
    course_id: courseId,
    section_id: sectionId,
    title: "New Lesson",
    sort_order: nextOrder,
  })

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
}

export async function deleteModule(formData: FormData) {
  const supabase = await createClient()

  const moduleId = formData.get("moduleId")
  const courseId = formData.get("courseId")

  if (!moduleId || typeof moduleId !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return

  await supabase
    .from("course_lessons")
    .delete()
    .eq("section_id", moduleId)

  await supabase
    .from("course_sections")
    .delete()
    .eq("id", moduleId)

  if (courseId && typeof courseId === "string") {
    revalidatePath(`/members/courses/builder/${courseId}`)
  }

  revalidatePath("/members/courses/builder")
}

export async function deleteLesson(formData: FormData) {
  const supabase = await createClient()

  const lessonId = formData.get("lessonId")
  const courseId = formData.get("courseId")

  if (!lessonId || typeof lessonId !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return

  await supabase
    .from("course_lessons")
    .delete()
    .eq("id", lessonId)

  if (courseId && typeof courseId === "string") {
    revalidatePath(`/members/courses/builder/${courseId}`)
  }

  revalidatePath("/members/courses/builder")
}

export async function duplicateLesson(formData: FormData) {
  const supabase = await createClient()

  const lessonId = formData.get("lessonId")
  const courseId = formData.get("courseId")

  if (!lessonId || typeof lessonId !== "string") return

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("id", lessonId)
    .single()

  if (!lesson) return

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("sort_order")
    .eq("section_id", lesson.section_id)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = (lessons?.[0]?.sort_order ?? 0) + 1

  await supabase.from("course_lessons").insert({
    course_id: lesson.course_id,
    section_id: lesson.section_id,
    title: `${lesson.title} (Copy)`,
    description: lesson.description,
    thumbnail_url: lesson.thumbnail_url,
    content_blocks: lesson.content_blocks,
    sort_order: nextOrder,
  })

  if (courseId && typeof courseId === "string") {
    revalidatePath(`/members/courses/builder/${courseId}`)
  }

  revalidatePath("/members/courses/builder")
}

// --- Taxonomy helpers (categories + tags) ---

export async function getTaxonomyCategories(): Promise<{ id: string; name: string }[]> {
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
  return (data ?? []) as { id: string; name: string }[]
}

export async function getTaxonomyTags(): Promise<{ id: string; name: string }[]> {
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
  return (data ?? []) as { id: string; name: string }[]
}

export async function updateCourseCategory(
  courseId: string,
  categoryId: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("taxonomy_relations")
    .select("id, taxonomy_id")
    .eq("entity_type", "course")
    .eq("entity_id", courseId)

  const taxonomyIds = (existing ?? []).map((r) => r.taxonomy_id)
  if (taxonomyIds.length > 0) {
    const { data: taxonomies } = await supabase
      .from("taxonomies")
      .select("id, type")
      .in("id", taxonomyIds)
    const categoryRelation = (existing ?? []).find((r) =>
      taxonomies?.some((t) => t.id === r.taxonomy_id && t.type === "category")
    )
    if (categoryRelation) {
      console.log("[updateCourseCategory] removing existing category relation", categoryRelation.id)
      await supabase.from("taxonomy_relations").delete().eq("id", categoryRelation.id)
    }
  }

  if (categoryId) {
    console.log("[updateCourseCategory] inserting category relation", { taxonomy_id: categoryId, entity_type: "course", entity_id: courseId })
    const { error } = await supabase.from("taxonomy_relations").insert({
      taxonomy_id: categoryId,
      entity_type: "course",
      entity_id: courseId,
    })
    if (error) {
      console.error("[updateCourseCategory] insert failed:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
  return { success: true }
}

export async function updateCourseTags(
  courseId: string,
  tagIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Not authenticated" }

  const { data: existing } = await supabase
    .from("taxonomy_relations")
    .select("id, taxonomy_id")
    .eq("entity_type", "course")
    .eq("entity_id", courseId)

  const taxonomyIds = (existing ?? []).map((r) => r.taxonomy_id)
  const tagRelationIds: string[] = []
  if (taxonomyIds.length > 0) {
    const { data: taxonomies } = await supabase
      .from("taxonomies")
      .select("id, type")
      .in("id", taxonomyIds)
    for (const r of existing ?? []) {
      const tax = taxonomies?.find((t) => t.id === r.taxonomy_id)
      if (tax?.type === "content_tag") tagRelationIds.push(r.id)
    }
  }

  if (tagRelationIds.length > 0) {
    console.log("[updateCourseTags] removing existing tag relations", tagRelationIds.length, "rows")
    await supabase.from("taxonomy_relations").delete().in("id", tagRelationIds)
  }

  if (tagIds.length > 0) {
    const rows = tagIds.map((taxonomy_id) => ({
      taxonomy_id,
      entity_type: "course" as const,
      entity_id: courseId,
    }))
    console.log("[updateCourseTags] inserting tag relations", rows.length, "rows")
    const { error } = await supabase.from("taxonomy_relations").insert(rows)
    if (error) {
      console.error("[updateCourseTags] insert failed:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
  return { success: true }
}

export async function saveCourseInstructions(
  courseId: string,
  instructions: string | null,
  videoUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Not authenticated" }

  const { error } = await supabase
    .from("courses")
    .update({
      instructions: instructions?.trim() || null,
      instruction_video: videoUrl?.trim() || null,
    })
    .eq("id", courseId)

  if (error) {
    console.error("[saveCourseInstructions]", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
  return { success: true }
}

export async function setCourseCategory(courseId: string, taxonomyId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("taxonomy_relations")
    .select(`
      id,
      taxonomies(type)
    `)
    .eq("entity_type", "course")
    .eq("entity_id", courseId)

  const categoryRows =
    existing?.filter(
      (r) => (r.taxonomies as { type?: string } | null)?.type === "category"
    ) || []

  for (const row of categoryRows) {
    await supabase.from("taxonomy_relations").delete().eq("id", row.id)
  }

  await supabase.from("taxonomy_relations").insert({
    taxonomy_id: taxonomyId,
    entity_type: "course",
    entity_id: courseId,
  })

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
}

export async function addCourseTag(courseId: string, taxonomyId: string) {
  const supabase = await createClient()

  await supabase.from("taxonomy_relations").insert({
    taxonomy_id: taxonomyId,
    entity_type: "course",
    entity_id: courseId,
  })

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
}

export async function removeCourseTag(courseId: string, taxonomyId: string) {
  const supabase = await createClient()

  await supabase
    .from("taxonomy_relations")
    .delete()
    .eq("entity_type", "course")
    .eq("entity_id", courseId)
    .eq("taxonomy_id", taxonomyId)

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")
}

export async function updateCourseTaxonomies(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  const courseId = formData.get("courseId") as string
  if (!courseId || typeof courseId !== "string" || courseId.trim().length === 0) {
    return { success: false, error: "Missing course ID" }
  }

  const categoryIdRaw = formData.get("categoryId")
  const tagIdsRaw = formData.get("tagIds")

  const categoryId =
    typeof categoryIdRaw === "string" && categoryIdRaw.trim().length > 0
      ? categoryIdRaw.trim()
      : null

  let tagIds: string[] = []
  if (typeof tagIdsRaw === "string" && tagIdsRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(tagIdsRaw)
      tagIds = Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        : []
    } catch (e) {
      console.error("[updateCourseTaxonomies] invalid tagIds payload", e)
      return { success: false, error: "Invalid tag selection payload" }
    }
  }

  console.log("[updateCourseTaxonomies] payload", { courseId, categoryId, tagIds })

  const categoryResult = await updateCourseCategory(courseId, categoryId)
  if (!categoryResult.success) {
    return categoryResult
  }

  const tagsResult = await updateCourseTags(courseId, tagIds)
  if (!tagsResult.success) {
    return tagsResult
  }

  revalidatePath(`/members/courses/builder/${courseId}`)
  revalidatePath("/members/courses/builder")

  return { success: true }
}
