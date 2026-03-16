"use client"

import BlockHeader from "./BlockHeader"

const getEmbedUrl = (url: string) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.split("v=")[1]?.split("&")[0] || url.split("/").pop()
    return `https://www.youtube.com/embed/${id}`
  }

  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop()
    return `https://player.vimeo.com/video/${id}`
  }

  return url
}

export default function VideoBlock({
  block,
  updateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  dragListeners,
  dragAttributes,
}: {
  block: Record<string, unknown>
  updateBlock?: (blockId: string, updates: Record<string, unknown>) => void
  onDuplicateBlock?: (blockId: string) => void
  onDeleteBlock?: (blockId: string) => void
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}) {
  const blockId = block?.id as string
  const videoUrl = (block?.videoUrl as string) ?? (block?.url as string) ?? ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-play"
        color="bg-blue-500"
        label="Video"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-4">
      <input
        type="text"
        placeholder="Paste YouTube, Vimeo, or Loom URL"
        value={videoUrl}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { videoUrl: e.target.value })
        }
        className="w-full border border-gray-200 rounded-md p-2 text-sm"
      />

      <textarea
        placeholder="Video description (optional)"
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm mt-2"
        value={(block?.description as string) ?? ""}
        onChange={(e) =>
          blockId && updateBlock?.(blockId, { description: e.target.value })
        }
      />

      {videoUrl && (
        <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-gray-200">
          {videoUrl.endsWith(".mp4") ? (
            <video controls className="w-full h-full">
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full"
              allowFullScreen
            />
          )}
        </div>
      )}
      </div>
    </div>
  )
}
