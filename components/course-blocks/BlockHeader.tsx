"use client"

type Props = {
  icon: string
  color: string
  label: string
  dragListeners?: Record<string, unknown>
  dragAttributes?: Record<string, unknown>
}

export default function BlockHeader({
  icon,
  color,
  label,
  dragListeners,
  dragAttributes,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
      <div className="flex items-center gap-3">
        <div
          {...(dragListeners ?? {})}
          {...(dragAttributes ?? {})}
          className="cursor-grab text-gray-400 hover:text-gray-700"
        >
          <i className="fa-solid fa-grip-vertical text-sm"></i>
        </div>

        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white ${color}`}>
          <i className={`fa-solid ${icon} text-sm`} />
        </div>

        <span className="text-sm font-medium text-gray-800">
          {label} Block
        </span>
      </div>
    </div>
  )
}
