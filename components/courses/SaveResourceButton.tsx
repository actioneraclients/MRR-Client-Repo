"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { saveLessonResource } from "@/app/actions/saveLessonResource"
import type { CourseBlock } from "@/lib/courseBlocks"

type SaveResourceButtonProps = {
  courseId: string
  lessonId: string
  block: CourseBlock
}

function getResourceUrl(block: CourseBlock): string {
  switch (block.type) {
    case "video":
      return (block as { videoUrl?: string; url?: string }).videoUrl ?? (block as { url?: string }).url ?? ""
    case "audio":
      return (block as { audio_url?: string; audioUrl?: string }).audio_url ?? (block as { audioUrl?: string }).audioUrl ?? ""
    case "image":
      return (block as { imageUrl?: string }).imageUrl ?? ""
    case "download":
      return (block as { file_url?: string; downloadUrl?: string }).file_url ?? (block as { downloadUrl?: string }).downloadUrl ?? ""
    default:
      return ""
  }
}

function getBlockTitle(block: CourseBlock): string {
  switch (block.type) {
    case "video":
      return (block as { title?: string; description?: string }).title ?? (block as { description?: string }).description ?? "Video"
    case "audio":
      return (block as { title?: string; description?: string }).title ?? (block as { description?: string }).description ?? "Audio"
    case "image":
      return (block as { caption?: string; title?: string }).caption ?? (block as { title?: string }).title ?? "Image"
    case "download":
      return (block as { file_name?: string; fileName?: string; title?: string }).file_name ?? (block as { fileName?: string }).fileName ?? (block as { title?: string }).title ?? "Resource"
    default:
      return "Resource"
  }
}

export default function SaveResourceButton({ courseId, lessonId, block }: SaveResourceButtonProps) {
  const router = useRouter()
  const [savedBlock, setSavedBlock] = useState<string | null>(null)

  const url = getResourceUrl(block)
  const title = getBlockTitle(block)

  if (!url) return null

  async function handleSave() {
    try {
      await saveLessonResource({
        courseId,
        lessonId,
        blockJson: {
          block_id: block.id,
          block_type: block.type,
          title,
          data: { url },
        },
      })
      setSavedBlock(block.id)
      router.refresh()

      setTimeout(() => {
        setSavedBlock(null)
      }, 2000)
    } catch {
      // Error handled by action
    }
  }

  return (
    <div className="relative overflow-visible flex justify-end">
      <button
        type="button"
        onClick={handleSave}
        title="Save to your learning resources"
        className="relative overflow-visible inline-flex items-center group p-1"
        aria-label="Save to your learning resources"
      >
        {savedBlock === block.id ? (
          <span className="text-green-500 text-lg">✓</span>
        ) : (
          <span className="text-amber-500 text-lg hover:text-amber-600">⭐</span>
        )}
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-50 whitespace-nowrap">
          Save to your learning resources
        </span>
      </button>
    </div>
  )
}
