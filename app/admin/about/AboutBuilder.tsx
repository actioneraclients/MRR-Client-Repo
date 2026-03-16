"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SectionList from "./SectionList"
import SectionEditor from "./SectionEditor"
import { saveAboutSections, setAboutPublished } from "./actions"
import { normalizeSections } from "./utils"

function sectionsEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function AboutBuilder({
  initialSections,
  initialPublished = false,
}: {
  initialSections: any[]
  initialPublished?: boolean
}) {
  const router = useRouter()
  const [sections, setSections] = useState<any[]>(() => normalizeSections(initialSections))
  const [selectedIndex, setSelectedIndex] = useState<number | null>(sections.length > 0 ? 0 : null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [published, setPublished] = useState(initialPublished)
  const [publishLoading, setPublishLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const lastSavedRef = useRef<any[]>(normalizeSections(initialSections))

  const isDirty = !sectionsEqual(sections, lastSavedRef.current)

  async function handleSave() {
    setSaving(true)
    setToast(null)
    try {
      await saveAboutSections(sections)
      lastSavedRef.current = JSON.parse(JSON.stringify(sections))
      router.refresh()
      setToast("Saved")
      setTimeout(() => setToast(null), 1500)
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handlePublishToggle() {
    setPublishLoading(true)
    const next = !published
    await setAboutPublished(next)
    setPublished(next)
    setPublishLoading(false)
  }

  const selectedSection =
    selectedIndex !== null ? sections[selectedIndex] : null

  return (
    <div className="space-y-6">
      {/* Header: Publish, Save, Preview */}
      <div className="flex flex-wrap items-center gap-4 border-b pb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={handlePublishToggle}
            disabled={publishLoading}
            className="rounded border-slate-300"
          />
          <span className="text-sm font-medium">
            {publishLoading ? "Updating…" : "Published"}
          </span>
        </label>

        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        {toast && (
          <span className={`text-sm font-medium ${toast === "Saved" ? "text-green-600" : "text-red-600"}`}>
            {toast}
          </span>
        )}

        <Link
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50"
        >
          Open in New Tab
        </Link>

        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={`px-6 py-2 rounded-md text-sm font-medium ${
            preview ? "bg-slate-700 text-white" : "border border-slate-300 hover:bg-slate-50"
          }`}
        >
          {preview ? "Hide Preview" : "Preview"}
        </button>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: preview ? "320px 1fr 1fr" : "320px 1fr" }}>
        <SectionList
          sections={sections}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          setSections={setSections}
        />

        <SectionEditor
          section={selectedSection}
          selectedIndex={selectedIndex}
          updateSection={(updated) => {
            if (selectedIndex == null) return
            const newSections = [...sections]
            newSections[selectedIndex] = updated
            setSections(newSections)
          }}
        />

        {preview && (
          <div className="border rounded-lg overflow-hidden bg-slate-50">
            <div className="px-4 py-2 border-b bg-slate-100 text-sm font-medium text-slate-600">
              Live Preview
            </div>
            <iframe
              src="/about?preview=true"
              title="About page preview"
              className="w-full h-[900px] border-0"
            />
          </div>
        )}
      </div>
    </div>
  )
}
