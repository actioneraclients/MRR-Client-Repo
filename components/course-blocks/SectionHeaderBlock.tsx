"use client"

import BlockHeader from "./BlockHeader"

export default function SectionHeaderBlock({
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
        icon="fa-bars"
        color="bg-indigo-600"
        label="Section"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-5">
        <input
          type="text"
          placeholder="Section title..."
          className="w-full text-xl font-bold outline-none"
          value={content}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { content: e.target.value })
          }
        />
      </div>
    </div>
  )
}
