"use client"

import BlockHeader from "./BlockHeader"

export default function CTABlock({
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
  const buttonText = (block?.button_text as string) ?? ""
  const url = (block?.url as string) ?? ""

  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-bullhorn"
        color="bg-rose-500"
        label="Call To Action"
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
          type="text"
          placeholder="Button text"
          value={buttonText}
          onChange={(e) =>
            blockId && updateBlock?.(blockId, { button_text: e.target.value })
          }
          className="w-full border border-gray-200 rounded-md p-2 text-sm"
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
        {(title || description || buttonText || url) && (
          <div className="mt-4 p-4 bg-rose-50 rounded-lg border border-rose-100">
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
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                {buttonText || "Click here"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
