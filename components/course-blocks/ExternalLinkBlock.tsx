"use client"

import BlockHeader from "./BlockHeader"

export default function ExternalLinkBlock({
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
  const title = (block?.title as string) ?? ""
  const description = (block?.description as string) ?? ""
  const url = (block?.url as string) ?? ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-up-right-from-square"
        color="bg-sky-500"
        label="External Link"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { title: e.target.value })
          }
          className="w-full border border-gray-200 rounded-md p-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { description: e.target.value })
          }
          className="w-full border border-gray-200 rounded-md p-2 text-sm resize-none"
          rows={3}
        />
        <input
          type="url"
          placeholder="URL"
          value={url}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { url: e.target.value })
          }
          className="w-full border border-gray-200 rounded-md p-2 text-sm"
        />
        {(title || description || url) && (
          <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-100">
            {title && (
              <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700"
              >
                <i className="fa-solid fa-up-right-from-square text-xs" />
                Open Link
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
