"use client"

import BlockHeader from "./BlockHeader"

export default function HeadlineBlock({
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
  const content = (block?.content as string) ?? ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-heading"
        color="bg-fuchsia-500"
        label="Headline"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-6">
        <input
          type="text"
          placeholder="Headline text..."
          className="w-full text-3xl font-semibold text-center outline-none"
          value={content}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { content: e.target.value })
          }
        />
      </div>
    </div>
  )
}
