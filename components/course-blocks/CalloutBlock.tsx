import BlockHeader from "./BlockHeader"

export default function CalloutBlock({
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
        icon="fa-lightbulb"
        color="bg-amber-500"
        label="Callout"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-5">
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <div className="flex gap-3">
            <i className="fa-solid fa-circle-info text-blue-600 text-sm mt-0.5 flex-shrink-0"></i>
            <div className="flex-1">
              <textarea
                className="w-full border-none outline-none focus:ring-0 p-0 resize-none bg-transparent text-sm text-gray-700"
                rows={3}
                placeholder="Add your callout text..."
                value={content || ""}
                onChange={(e) =>
                  blockId && updateBlock?.(blockId, { content: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
