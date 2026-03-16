"use client"

import { Upload } from "lucide-react"
import BlockHeader from "./BlockHeader"

export default function AudioBlock({
  block,
  updateBlock,
  uploadFile,
  onDuplicateBlock,
  onDeleteBlock,
  dragListeners,
  dragAttributes,
}: {
  block: Record<string, unknown>
  updateBlock?: (blockId: string, updates: Record<string, unknown>) => void
  uploadFile?: (file: File, bucket: string) => Promise<string | null>
  onDuplicateBlock?: (blockId: string) => void
  onDeleteBlock?: (blockId: string) => void
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}) {
  const blockId = block?.id as string
  const audioUrl = (block?.audio_url as string) ?? (block?.audioUrl as string) ?? ""
  const description = (block?.description as string) ?? ""

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !blockId || !updateBlock || !uploadFile) return
    const uploadedPath = await uploadFile(file, "course-files")
    if (uploadedPath) {
      updateBlock(blockId, { audio_url: uploadedPath })
    }
    e.target.value = ""
  }

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-headphones"
        color="bg-indigo-500"
        label="Audio"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-4">
      <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
        <Upload className="w-4 h-4" />
        Upload Audio
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      <textarea
        placeholder="Audio description (optional)"
        value={description}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { description: e.target.value })
        }
        className="w-full border border-gray-200 rounded-md p-2 text-sm mt-2 resize-none"
        rows={2}
      />

      {audioUrl && (
        <audio controls className="mt-3 w-full">
          <source src={audioUrl} />
        </audio>
      )}
      </div>
    </div>
  )
}
