"use client"

import type { CourseBlock } from "@/lib/courseBlocks"

interface LessonOutlineProps {
  blocks: CourseBlock[]
}

function getBlockLabel(block: CourseBlock): string {
  switch (block.type) {
    case "headline":
      return block.content
    case "section":
      return block.content
    case "journal":
      return "Journal Question"
    default:
      return block.type
  }
}

export default function LessonOutline({ blocks }: LessonOutlineProps) {
  const navBlocks = blocks.filter((b) =>
    ["headline", "section", "journal"].includes(b.type)
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">Lesson Outline</h3>

      <ul className="space-y-2 text-sm">
        {navBlocks.map((block) => (
          <li key={block.id}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(block.id)
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className="text-left w-full hover:text-primary transition"
            >
              {getBlockLabel(block)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
