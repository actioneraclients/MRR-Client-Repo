"use client"

import LessonBlockRenderer from "@/components/courses/LessonBlockRenderer"
import { parseCourseBlocks } from "@/lib/courseBlocks"

type SavedResource = {
  id: string
  content: string | null // block_id
}

type SavedResourcesListProps = {
  resources: SavedResource[]
  lessonBlocks: unknown
  courseId: string
  lessonId: string
}

export default function SavedResourcesList({
  resources,
  lessonBlocks,
  courseId,
  lessonId,
}: SavedResourcesListProps) {
  const blocks = parseCourseBlocks(lessonBlocks)
  const matchedBlocks = blocks.filter((block) =>
    resources.some((r) => r.content && r.content === block.id)
  )

  if (matchedBlocks.length === 0) {
    return <p className="text-sm text-gray-500">No saved content yet.</p>
  }

  return (
    <div className="space-y-3">
      {matchedBlocks.map((block) => (
        <div
          key={block.id}
          className="border rounded-lg p-4 bg-gray-50"
        >
          <LessonBlockRenderer
            blocks={[block]}
            courseId={courseId}
            lessonId={lessonId}
          />
        </div>
      ))}
    </div>
  )
}
