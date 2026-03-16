"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { insertBlockAtTop } from "./actions"

const BLOCK_TYPES = ["text", "video", "image", "audio", "download", "embed", "callout", "divider", "headline", "section", "journal"] as const

export default function BlockPicker({
  lessonId,
  courseId,
  variant = "default",
  onInsertBlock,
}: {
  lessonId: string
  courseId: string
  variant?: "default" | "empty"
  onInsertBlock?: (type: string) => Promise<void>
}) {
  const [blockPickerOpen, setBlockPickerOpen] = useState(false)
  const router = useRouter()

  const buttonClass =
    variant === "empty"
      ? "group flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 transition-all"
      : "group flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg text-xs font-medium text-gray-500 hover:text-blue-600 transition-all w-full justify-center"

  const handleInsert = async (type: string) => {
    if (onInsertBlock) {
      await onInsertBlock(type)
    } else {
      await insertBlockAtTop(lessonId, courseId, type)
      router.refresh()
    }
    setBlockPickerOpen(false)
  }

  return (
    <>
      <button type="button" onClick={() => setBlockPickerOpen(true)} className={buttonClass}>
        <i className="fa-solid fa-plus text-xs"></i>
        <span>Add Block</span>
      </button>

      {blockPickerOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[420px] p-6">
            <h2 className="text-lg font-semibold mb-4">Choose Block Type</h2>

            <div className="grid grid-cols-2 gap-3">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInsert(type)}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setBlockPickerOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
