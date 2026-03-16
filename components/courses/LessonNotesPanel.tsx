"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { deleteLearningNote } from "@/app/actions/deleteLearningNote"
import { saveLearningNote } from "@/app/actions/saveLearningNote"
import { updateLearningNote } from "@/app/actions/updateLearningNote"

export default function LessonNotesPanel({
  courseId,
  lessonId,
  notes = [],
}: {
  courseId: string
  lessonId: string
  notes?: { id: string; note_type: string; content?: string | null; highlight_text?: string | null }[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<"note" | "highlight">("note")
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const noteRows = notes.filter((n) => n.note_type === "note")

  async function handleSave() {
    const trimmed = text.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      if (editingNoteId) {
        await updateLearningNote({ noteId: editingNoteId, text: trimmed })
        setEditingNoteId(null)
      } else {
        await saveLearningNote({
          courseId,
          lessonId,
          type: mode,
          text: trimmed,
        })
      }
      setText("")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(note: { id: string; content?: string | null }) {
    setMode("note")
    setText(note.content ?? "")
    setEditingNoteId(note.id)
  }

  async function handleDelete(noteId: string) {
    try {
      await deleteLearningNote(noteId)
      if (editingNoteId === noteId) {
        setEditingNoteId(null)
        setText("")
      }
      router.refresh()
    } catch {
      // Error handled by action
    }
  }

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-indigo-400 rounded-xl p-5 shadow-sm mb-6 overflow-visible">
      <div className="flex gap-1 mb-3 overflow-visible">
        <div className="flex items-center gap-1 relative overflow-visible">
          <button
            type="button"
            onClick={() => setMode("note")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "note"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Notes
          </button>
          <span className="relative overflow-visible inline-flex items-center group">
            <i className="fa-solid fa-circle-info text-xs text-gray-400" aria-hidden></i>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs text-white bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
              Notes are your personal thoughts, ideas, or key takeaways from this lesson. Use notes to capture insights you want to remember later. Each note is saved separately so you can review them in your Learning Notes dashboard.
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1 relative overflow-visible">
          <button
            type="button"
            onClick={() => setMode("highlight")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "highlight"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Highlights
          </button>
          <span className="relative overflow-visible inline-flex items-center group">
            <i className="fa-solid fa-circle-info text-xs text-gray-400" aria-hidden></i>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 text-xs text-white bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
              Highlights are important quotes or ideas from the lesson content. If something stands out, copy the text from the lesson, paste it here, select Highlight, and save it to build your personal highlight library.
            </span>
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 mb-3 leading-relaxed">
        Tip: Save your insights as Notes or capture powerful quotes as Highlights.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "note"
            ? "Write your lesson notes..."
            : "Paste a highlight from the lesson..."
        }
        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
      />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !text.trim()}
        className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {saving
          ? "Saving..."
          : editingNoteId
            ? "Update Note"
            : mode === "note"
              ? "Save Note"
              : "Save Highlight"}
      </button>

      {noteRows.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Notes</h4>
          <div className="space-y-2">
            {noteRows.map((note) => (
              <div
                key={note.id}
                className="text-sm bg-gray-50 border border-gray-200 rounded-md p-3 flex justify-between items-start gap-2"
              >
                <p
                  className="flex-1 text-sm text-gray-700 min-w-0 line-clamp-3"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {note.content ?? ""}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(note)}
                    className="text-gray-500 hover:text-primary p-1"
                    aria-label="Edit note"
                  >
                    <i className="fa-solid fa-pen text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="text-gray-500 hover:text-red-600 p-1"
                    aria-label="Delete note"
                  >
                    <i className="fa-solid fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
