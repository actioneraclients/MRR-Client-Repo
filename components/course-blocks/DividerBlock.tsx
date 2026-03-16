import BlockHeader from "./BlockHeader"

export default function DividerBlock({
  dragListeners,
  dragAttributes,
}: {
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
} = {}) {
  return (
    <div className="overflow-hidden">
      <BlockHeader
        icon="fa-minus"
        color="bg-gray-500"
        label="Divider"
        dragListeners={dragListeners}
        dragAttributes={dragAttributes}
      />
      <div className="py-6 px-4">
        <hr className="border-gray-300" />
      </div>
    </div>
  )
}
