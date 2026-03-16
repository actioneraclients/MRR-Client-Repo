"use client"

import { Upload } from "lucide-react"
import BlockHeader from "./BlockHeader"

export default function DownloadBlock({
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
  const fileUrl = (block?.file_url as string) ?? (block?.downloadUrl as string) ?? ""
  const fileName = (block?.file_name as string) ?? (block?.fileName as string) ?? ""
  const displayName =
  (block?.display_name as string) ??
  fileName ??
  "Download file"
  const description = (block?.description as string) ?? ""

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !blockId || !updateBlock || !uploadFile) return
    const uploadedPath = await uploadFile(file, "course-files")
    if (uploadedPath) {
      updateBlock(blockId, {
        file_url: uploadedPath,
        file_name: file.name
      })
    }
    e.target.value = ""
  }

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-file-arrow-down"
        color="bg-emerald-500"
        label="Download"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-4">
      <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
        <Upload className="w-4 h-4" />
        Upload File
        <input
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      <input
        type="text"
        placeholder="Display name"
        value={displayName}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { display_name: e.target.value })
        }
        className="w-full border border-gray-200 rounded-md p-2 text-sm mt-2"
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { description: e.target.value })
        }
        className="w-full border border-gray-200 rounded-md p-2 text-sm mt-2 resize-none"
        rows={2}
      />

      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-3 text-blue-600 text-sm underline"
        >
          {displayName || fileName || "Download file"}
        </a>
      )}
      </div>
    </div>
  )
}
