"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

export async function addBlock(formData: FormData) {
  const supabase = await createClient()

  const lessonId = formData.get("lessonId") as string
  const courseId = formData.get("courseId") as string
  const type = formData.get("type") as string

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("content_blocks")
    .eq("id", lessonId)
    .single()

  const blocks = lesson?.content_blocks ?? []

  const newBlock = {
    id: randomUUID(),
    type,
    content: ""
  }

  const updatedBlocks = [...blocks, newBlock]

  await supabase
    .from("course_lessons")
    .update({ content_blocks: updatedBlocks })
    .eq("id", lessonId)

  revalidatePath("/members/courses/builder")
  if (courseId) {
    revalidatePath(`/members/courses/builder/${courseId}/lesson/${lessonId}`)
  }
}

export async function insertBlockAtTop(
  lessonId: string,
  courseId: string,
  type: string
) {
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("content_blocks")
    .eq("id", lessonId)
    .single()

  const blocks = (lesson?.content_blocks ?? []) as Array<Record<string, unknown>>
  const newBlock = {
    id: randomUUID(),
    type,
    content: ""
  }
  const updatedBlocks = [newBlock, ...blocks]

  await supabase
    .from("course_lessons")
    .update({ content_blocks: updatedBlocks })
    .eq("id", lessonId)

  revalidatePath("/members/courses/builder")
  if (courseId) {
    revalidatePath(`/members/courses/builder/${courseId}/lesson/${lessonId}`)
  }

  return { newBlock }
}

export async function reorderBlocks(
  lessonId: string,
  courseId: string,
  blocks: Array<Record<string, unknown>>
) {
  const supabase = await createClient()

  await supabase
    .from("course_lessons")
    .update({ content_blocks: blocks })
    .eq("id", lessonId)

  revalidatePath("/members/courses/builder")
  if (courseId) {
    revalidatePath(`/members/courses/builder/${courseId}/lesson/${lessonId}`)
  }
}

export async function saveLesson(
  lessonId: string,
  courseId: string,
  blocks: Array<Record<string, unknown>>,
  lessonMeta?: {
    title?: string
    description?: string
    thumbnail_url?: string
    drip_days?: number
    release_date?: string
    requires_previous_completion?: boolean
  }
) {
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = { content_blocks: blocks }
  if (lessonMeta) {
    if (lessonMeta.title !== undefined) updatePayload.title = lessonMeta.title
    if (lessonMeta.description !== undefined) updatePayload.description = lessonMeta.description
    if (lessonMeta.thumbnail_url !== undefined) updatePayload.thumbnail_url = lessonMeta.thumbnail_url
    if (lessonMeta.drip_days !== undefined) updatePayload.drip_days = lessonMeta.drip_days
    if (lessonMeta.release_date !== undefined) updatePayload.release_date = lessonMeta.release_date
    if (lessonMeta.requires_previous_completion !== undefined) updatePayload.requires_previous_completion = lessonMeta.requires_previous_completion
  }

  await supabase
    .from("course_lessons")
    .update(updatePayload)
    .eq("id", lessonId)

  revalidatePath("/members/courses/builder")
  if (courseId) {
    revalidatePath(`/members/courses/builder/${courseId}/lesson/${lessonId}`)
  }
}

export async function deleteBlock(lessonId: string, courseId: string, blockId: string) {
  const supabase = await createClient()

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("content_blocks")
    .eq("id", lessonId)
    .single()

  const blocks = (lesson?.content_blocks ?? []) as Array<{ id?: string }>
  const updatedBlocks = blocks.filter((b) => b.id !== blockId)

  await supabase
    .from("course_lessons")
    .update({ content_blocks: updatedBlocks })
    .eq("id", lessonId)

  revalidatePath("/members/courses/builder")
  if (courseId) {
    revalidatePath(`/members/courses/builder/${courseId}/lesson/${lessonId}`)
  }
}
