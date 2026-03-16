"use server"

import { createClient } from "@/lib/supabase/server"

export async function getCourses() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      thumbnail_url,
      status,
      access_type,
      price,
      featured,
      created_at,
      created_by,
      course_sections(id),
      course_lessons(id),
      profiles!courses_created_by_fkey(full_name, avatar_url)
    `
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching courses:", error)
    return []
  }

  return data
}

export async function getFeaturedCourses() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      description,
      thumbnail_url,
      access_type,
      price,
      created_by,
      profiles!courses_created_by_fkey(full_name, avatar_url)
    `
    )
    .eq("featured", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching featured courses:", error)
    return []
  }

  return data
}

export async function saveJournalEntry({
  lessonId,
  blockId,
  response,
}: {
  lessonId: string
  blockId: string
  response: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  const { error } = await supabase
    .from("lesson_journal_entries")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        block_id: blockId,
        response,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,lesson_id,block_id",
      }
    )

  if (error) {
    console.error("Error saving journal entry:", error)
    throw error
  }

  return { success: true }
}

export async function getContentTags() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("taxonomies")
    .select("id, name, slug")
    .eq("type", "content_tag")
    .order("name", { ascending: true })
  if (error) {
    console.error("Error fetching content tags:", error)
    return []
  }
  return (data ?? []) as { id: string; name: string; slug: string }[]
}

export async function getCourseCategories() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("taxonomies")
    .select("id, name, slug")
    .eq("type", "category")
    .order("name", { ascending: true })

  return data || []
}

export async function getEnrolledCourseIds(userId: string): Promise<string[]> {
  if (!userId) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("course_enrollments")
    .select("course_id")
    .eq("user_id", userId)
  if (error) {
    console.error("Error fetching enrollments:", error)
    return []
  }
  return (data ?? []).map((r) => r.course_id)
}

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseId,
      user_id: user.id,
      access_type: "free",
    })

  if (error) {
    console.error("Enrollment failed:", error)
    throw new Error("Failed to enroll in course")
  }

  return { success: true }
}

export async function getCourseTaxonomyMap(
  courseIds: string[]
): Promise<
  Record<string, { category?: { slug: string; name: string }; tags: { slug: string; name: string }[] }>
> {
  if (courseIds.length === 0) return {}
  const supabase = await createClient()
  const { data: relations } = await supabase
    .from("taxonomy_relations")
    .select("entity_id, taxonomy_id")
    .eq("entity_type", "course")
    .in("entity_id", courseIds)
  if (!relations?.length) return Object.fromEntries(courseIds.map((id) => [id, { tags: [] }]))
  const taxonomyIds = [...new Set(relations.map((r) => r.taxonomy_id).filter(Boolean))]
  const { data: taxonomies } = await supabase
    .from("taxonomies")
    .select("id, type, slug, name")
    .in("id", taxonomyIds)
  const taxMap = new Map((taxonomies ?? []).map((t) => [t.id, t]))
  const result: Record<
    string,
    { category?: { slug: string; name: string }; tags: { slug: string; name: string }[] }
  > = {}
  for (const id of courseIds) result[id] = { tags: [] }
  for (const r of relations) {
    const tax = taxMap.get(r.taxonomy_id) as { type: string; slug: string; name: string } | undefined
    if (!tax) continue
    const entry = result[r.entity_id] ?? { tags: [] }
    if (tax.type === "category") entry.category = { slug: tax.slug, name: tax.name ?? tax.slug }
    else if (tax.type === "content_tag")
      entry.tags.push({ slug: tax.slug, name: tax.name ?? tax.slug })
  }
  return result
}
