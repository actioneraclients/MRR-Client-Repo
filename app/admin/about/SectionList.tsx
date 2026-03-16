"use client"

import { useState } from "react"
import { SECTION_LABELS } from "./SectionTemplates"

export default function SectionList({
  sections,
  selectedIndex,
  setSelectedIndex,
  setSections,
}: {
  sections: any[]
  selectedIndex: number | null
  setSelectedIndex: (i: number | null) => void
  setSections: (s: any[]) => void
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  function toggleEnabled(index: number) {
    const section = sections[index]
    if (section?.type === "hero") return

    const updated = [...sections]
    updated[index] = { ...section, enabled: !section.enabled }
    setSections(updated)
  }

  function duplicateSection(index: number) {
    const section = sections[index]
    const copy = JSON.parse(JSON.stringify({ ...section, id: crypto.randomUUID() }))
    if (copy.type === "team" && Array.isArray(copy.content?.members)) {
      copy.content.members = copy.content.members.map((m: any) => ({
        ...m,
        id: m.id || crypto.randomUUID(),
      }))
    }
    const reordered = [...sections]
    reordered.splice(index + 1, 0, copy)
    setSections(reordered)
    setSelectedIndex(index + 1)
  }

  function deleteSection(index: number) {
    const section = sections[index]
    if (section?.type === "hero") return

    const reordered = sections.filter((_, i) => i !== index)
    setSections(reordered)
    setDeleteConfirm(null)
    setSelectedIndex(
      selectedIndex === null
        ? null
        : selectedIndex > index
          ? selectedIndex - 1
          : selectedIndex === index
            ? Math.min(index, reordered.length - 1)
            : selectedIndex
    )
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDropIndex(index)
  }

  function handleDragLeave() {
    setDropIndex(null)
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault()
    setDragIndex(null)
    setDropIndex(null)

    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (fromIndex === toIndex || isNaN(fromIndex)) return

    const reordered = [...sections]
    const [removed] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, removed)
    setSections(reordered)

    const newSelectedIndex =
      selectedIndex === fromIndex
        ? toIndex
        : selectedIndex !== null && selectedIndex < fromIndex && selectedIndex >= toIndex
          ? selectedIndex + 1
          : selectedIndex !== null && selectedIndex > fromIndex && selectedIndex <= toIndex
            ? selectedIndex - 1
            : selectedIndex === fromIndex
              ? toIndex
              : selectedIndex
    setSelectedIndex(newSelectedIndex)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDropIndex(null)
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-2">
      <h3 className="font-semibold text-sm mb-3">Sections</h3>

      {sections.map((section: any, i: number) => (
        <div
          key={section.id}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, i)}
          className={`flex items-center gap-2 p-2 rounded text-sm group ${
            selectedIndex === i ? "bg-blue-100" : "hover:bg-slate-100"
          } ${section.enabled === false ? "opacity-60" : ""} ${
            dropIndex === i ? "ring-2 ring-slate-300" : ""
          } ${dragIndex === i ? "opacity-60" : ""}`}
        >
          <span
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragEnd={handleDragEnd}
            className="shrink-0 text-slate-400 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-slate-200/50"
            title="Drag to reorder"
          >
            ☰
          </span>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setSelectedIndex(i)}
          >
            <span className={section.enabled !== false ? "" : "text-slate-400 line-through"}>
              {SECTION_LABELS[section.type] || section.type}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {section.type !== "hero" && (
              <label className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={section.enabled !== false}
                  onChange={() => toggleEnabled(i)}
                  className="rounded border-slate-300 text-xs"
                />
              </label>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                duplicateSection(i)
              }}
              className="px-2 py-0.5 text-xs text-slate-600 hover:text-blue-600"
              title="Duplicate"
            >
              Duplicate
            </button>

            {section.type !== "hero" && (
              <>
                {deleteConfirm === i ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSection(i)
                      }}
                      className="px-2 py-0.5 text-xs text-red-600 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(null)
                      }}
                      className="px-2 py-0.5 text-xs text-slate-600"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(i)
                    }}
                    className="px-2 py-0.5 text-xs text-slate-600 hover:text-red-600"
                    title="Delete"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
