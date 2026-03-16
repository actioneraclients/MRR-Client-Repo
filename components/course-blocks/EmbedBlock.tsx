"use client"

import BlockHeader from "./BlockHeader"

export default function EmbedBlock({
  block,
  updateBlock,
  dragListeners,
  dragAttributes,
}: {
  block: Record<string, unknown>
  updateBlock?: (blockId: string, updates: Record<string, unknown>) => void
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}) {
  const blockId = block?.id as string
  const embedCode =
    (block?.embed as string) ??
    (block?.content as string) ??
    (block?.embedUrl as string) ??
    ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-code"
        color="bg-cyan-500"
        label="Embed"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-5">
        <div className="text-sm font-medium text-gray-700 mb-2">Embed</div>
        <textarea
          placeholder="Paste embed iframe HTML"
          value={embedCode}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { embed: e.target.value })
          }
          className="w-full border border-gray-200 rounded-md p-2 text-sm font-mono text-xs min-h-[80px]"
          rows={3}
        />
        {embedCode && (
          <div className="mt-3 w-full overflow-hidden rounded-lg border bg-black/5">
            <div
              className="w-full aspect-video"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
