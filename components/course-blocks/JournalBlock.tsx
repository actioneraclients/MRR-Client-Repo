"use client"

import BlockHeader from "./BlockHeader"

export default function JournalBlock({
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
  const question = (block?.question as string) ?? ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-pen"
        color="bg-orange-500"
        label="Journal"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-6 space-y-4">
        <textarea
          placeholder="Enter your journal question..."
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
          rows={2}
          value={question}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { question: e.target.value })
          }
        />
        <div className="border border-gray-200 rounded-md p-3 text-sm text-gray-400">
          Student journal response field will appear here in the course player.
        </div>
      </div>
    </div>
  )
}
