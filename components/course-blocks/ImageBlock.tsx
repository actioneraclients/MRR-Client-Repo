"use client"

import { Upload } from "lucide-react"
import BlockHeader from "./BlockHeader"

export default function ImageBlock({
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
  const imageUrl = (block?.imageUrl as string) ?? ""
  const caption = (block?.caption as string) ?? ""

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !blockId || !updateBlock || !uploadFile) return
    const url = await uploadFile(file, "course-images")
    if (url) {
      updateBlock(blockId, { imageUrl: url })
    }
    e.target.value = ""
  }

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-image"
        color="bg-pink-500"
        label="Image"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-4">
      <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
        <Upload className="w-4 h-4" />
        Upload Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      <input
        type="text"
        placeholder="Caption (optional)"
        value={caption}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { caption: e.target.value })
        }
        className="w-full border border-gray-200 rounded-md p-2 mt-2 text-sm"
      />

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="mt-3 rounded-md max-h-80 object-cover w-full"
        />
      )}
      </div>
    </div>
  )
}
