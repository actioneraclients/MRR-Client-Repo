"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { saveJournalEntry } from "@/app/members/courses/actions"

type JournalBlockProps = {
  lessonId: string
  blockId: string
  question: string
}

export default function JournalBlock({ lessonId, blockId, question }: JournalBlockProps) {
  const supabase = createClient()

  const [response, setResponse] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadEntry()
  }, [lessonId, blockId])

  async function loadEntry() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("lesson_journal_entries")
      .select("response")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .eq("block_id", blockId)
      .single()

    if (data?.response) setResponse(data.response)
  }

  async function saveEntry() {
    setSaving(true)

    try {
      await saveJournalEntry({
        lessonId,
        blockId,
        response,
      })

      setSaved(true)
    } catch (err) {
      console.error("Journal Save Failed:", err)
    }

    setSaving(false)
  }

  return (
    <div id={blockId} className="border border-indigo-200 bg-indigo-50 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Journal Question</h3>

      <p className="text-gray-700">{question}</p>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your reflection..."
        className="w-full min-h-[220px] p-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />

      <button
        type="button"
        onClick={saveEntry}
        className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
      >
        {saving ? "Saving..." : "Save Journal Entry"}
      </button>
    </div>
  )
}
