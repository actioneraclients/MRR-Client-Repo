"use client"

import { useState, useEffect } from "react"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveCourseInstructions } from "@/app/members/courses/builder/[courseId]/actions"

type Props = {
  open: boolean
  onClose: () => void
  courseId: string
  initialInstructions: string | null
  initialVideoUrl: string | null
}

export function CourseInstructionsModal({
  open,
  onClose,
  courseId,
  initialInstructions,
  initialVideoUrl,
}: Props) {
  const router = useRouter()
  const [instructionsText, setInstructionsText] = useState(
    initialInstructions ?? ""
  )
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setInstructionsText(initialInstructions ?? "")
      setVideoUrl(initialVideoUrl ?? "")
    }
  }, [open, initialInstructions, initialVideoUrl])

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCourseInstructions(
        courseId,
        instructionsText || null,
        videoUrl || null
      )
      if (result.success) {
        router.refresh()
        onClose()
      } else {
        console.error(result.error)
      }
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Course Instructions
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Text Instructions
            </label>
            <textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              className="w-full min-h-[260px] border rounded-md p-3"
              placeholder="Add instructions shown to students before the course begins..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Video URL (optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Optional video URL (YouTube, Vimeo, etc)"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Saving..." : "Save Instructions"}
          </button>
        </div>
      </div>
    </div>
  )
}
