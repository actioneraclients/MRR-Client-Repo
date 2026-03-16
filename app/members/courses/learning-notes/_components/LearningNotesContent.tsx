"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Video, FileText, Image, File, Headphones, BookOpen, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import LessonBlockRenderer from "@/components/courses/LessonBlockRenderer"
import { toast } from "sonner"
import { updateJournalEntry } from "../actions"

const TABS = ["journal", "notes", "highlights", "resources"] as const

type LearningNote = {
  id: string
  note_type: string | null
  highlight_text: string | null
  content: string | null
  created_at: string | null
  lesson_id: string | null
  course_lessons?: {
    id: string
    title: string
    section_id: string
    content_blocks?: unknown
    course_sections?: {
      id: string
      title: string
      course_id: string
    }
  }
}

type JournalEntry = {
  id: string
  lesson_id: string
  response: string | null
  created_at: string | null
  course_lessons?: {
    id: string
    title: string
    section_id: string
    course_sections?: {
      id: string
      title: string
      course_id: string
    }
  }
}

export function LearningNotesContent({
  courses,
  notes,
  journalEntries,
  embedded = false,
  brandPrimaryColor = null,
}: {
  courses: { id: string; title: string; thumbnail_url: string | null }[]
  notes: LearningNote[]
  journalEntries: JournalEntry[]
  embedded?: boolean
  brandPrimaryColor?: string | null
}) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("journal")
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set())
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [previewBlock, setPreviewBlock] = useState<{
    block: Record<string, unknown>
    courseId: string
    lessonId: string
  } | null>(null)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editResponse, setEditResponse] = useState("")
  const router = useRouter()

  // ---------- Derived Data ----------

  // Filter by course
  const filteredJournalEntries =
    selectedCourseId === null
      ? []
      : journalEntries.filter(
          (entry) =>
            entry.course_lessons?.course_sections?.course_id === selectedCourseId
        )

  const filteredNotes =
    selectedCourseId === null
      ? []
      : notes.filter(
          (note) =>
            note.course_lessons?.course_sections?.course_id === selectedCourseId
        )

  const savedResources =
    selectedCourseId === null
      ? []
      : notes.filter(
          (n) =>
            n.note_type === "resource" &&
            n.course_lessons?.course_sections?.course_id === selectedCourseId
        )

  const savedResourcesByModule: Record<
    string,
    {
      moduleTitle: string
      lessons: Record<
        string,
        {
          lessonTitle: string
          resources: Array<{ note: LearningNote; block: Record<string, unknown> }>
        }
      >
    }
  > = {}

  savedResources.forEach((resource) => {
    const moduleId = resource.course_lessons?.course_sections?.id
    const moduleTitle = resource.course_lessons?.course_sections?.title ?? ""
    const lessonId = resource.course_lessons?.id
    const lessonTitle = resource.course_lessons?.title ?? ""

    if (!moduleId || !lessonId) return

    let blocks: Record<string, unknown>[] = []
    const rawBlocks = resource.course_lessons?.content_blocks

    if (Array.isArray(rawBlocks)) {
      blocks = rawBlocks
    } else if (typeof rawBlocks === "string") {
      try {
        blocks = JSON.parse(rawBlocks)
      } catch {
        blocks = []
      }
    }

    if (!Array.isArray(blocks)) {
      blocks = []
    }

    console.log("Saved resource lookup", {
      noteId: resource.id,
      blockId: resource.content,
      blocks,
    })

    let blockId: string | null = null

    if (resource.content) {
      try {
        const parsed = JSON.parse(resource.content)
        blockId = parsed?.block_id ?? null
      } catch {
        blockId = resource.content
      }
    }

    const block = blocks.find(
      (b: Record<string, unknown>) =>
        String(b.id) === String(blockId)
    )

    if (!block) return

    if (!savedResourcesByModule[moduleId]) {
      savedResourcesByModule[moduleId] = {
        moduleTitle,
        lessons: {},
      }
    }
    if (!savedResourcesByModule[moduleId].lessons[lessonId]) {
      savedResourcesByModule[moduleId].lessons[lessonId] = {
        lessonTitle,
        resources: [],
      }
    }
    savedResourcesByModule[moduleId].lessons[lessonId].resources.push({
      note: resource,
      block,
    })
  })

  // Notes
  const noteEntries =
    filteredNotes?.filter((n) => n.note_type === "note") ?? []

  // Highlights
  const highlightEntries =
    filteredNotes?.filter((n) => n.note_type === "highlight") ?? []

  const counts = {
    journal: filteredJournalEntries.length,
    notes: noteEntries.length,
    highlights: highlightEntries.length,
    resources: savedResources.length,
  }

  // ---------- Journal Grouping ----------

  const journalByModule: Record<
    string,
    {
      moduleTitle: string
      lessons: Record<string, JournalEntry[]>
    }
  > = {}

  filteredJournalEntries.forEach((entry) => {
    const module = entry.course_lessons?.course_sections
    const lesson = entry.course_lessons

    if (!module || !lesson) return

    const moduleId = module.id
    const lessonId = lesson.id

    if (!journalByModule[moduleId]) {
      journalByModule[moduleId] = {
        moduleTitle: module.title,
        lessons: {},
      }
    }

    if (!journalByModule[moduleId].lessons[lessonId]) {
      journalByModule[moduleId].lessons[lessonId] = []
    }

    journalByModule[moduleId].lessons[lessonId].push(entry)
  })

  // ---------- Notes Grouping ----------

  const notesByModule: Record<
    string,
    {
      moduleTitle: string
      lessons: Record<string, LearningNote[]>
    }
  > = {}

  filteredNotes
    .filter((n) => n.note_type === "note")
    .forEach((note) => {
    const module = note.course_lessons?.course_sections
    const lesson = note.course_lessons

    if (!module || !lesson) return

    const moduleId = module.id
    const lessonId = lesson.id

    if (!notesByModule[moduleId]) {
      notesByModule[moduleId] = {
        moduleTitle: module.title,
        lessons: {},
      }
    }

    if (!notesByModule[moduleId].lessons[lessonId]) {
      notesByModule[moduleId].lessons[lessonId] = []
    }

    notesByModule[moduleId].lessons[lessonId].push(note)
  })

  // ---------- Highlights Grouping ----------

  const highlightsByModule: Record<
    string,
    {
      moduleTitle: string
      lessons: Record<string, LearningNote[]>
    }
  > = {}

  filteredNotes
    .filter((n) => n.note_type === "highlight")
    .forEach((note) => {
    const module = note.course_lessons?.course_sections
    const lesson = note.course_lessons

    if (!module || !lesson) return

    const moduleId = module.id
    const lessonId = lesson.id

    if (!highlightsByModule[moduleId]) {
      highlightsByModule[moduleId] = {
        moduleTitle: module.title,
        lessons: {},
      }
    }

    if (!highlightsByModule[moduleId].lessons[lessonId]) {
      highlightsByModule[moduleId].lessons[lessonId] = []
    }

    highlightsByModule[moduleId].lessons[lessonId].push(note)
  })

  // ---------- Course Aggregation ----------

  const courseCounts: Record<string, number> = {}

  // count notes (course_id from nested course_sections)
  notes?.forEach((note) => {
    const courseId = note.course_lessons?.course_sections?.course_id
    if (!courseId) return
    courseCounts[courseId] = (courseCounts[courseId] ?? 0) + 1
  })

  // count journal entries (via nested course_sections)
  journalEntries?.forEach((journal) => {
    const courseId = journal.course_lessons?.course_sections?.course_id
    if (!courseId) return
    courseCounts[courseId] = (courseCounts[courseId] ?? 0) + 1
  })

  // enrolled courses from prop (for course selector)

  const isAccordionOpen = (id: string) => openAccordions.has(id)
  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div
        id="learning-notes-container"
        className={
          embedded
            ? "px-6 py-4"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
        }
      >
        {!embedded && (
          <>
            <Link
              href="/members/courses"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-3"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i>
              Back to Course Library
            </Link>
            <div id="page-header" className="mb-8 lg:mb-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              My Learning Notes
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Your personal journal, highlights, notes, and saved content from courses you&apos;ve taken.
            </p>
          </div>
          </>
        )}

        <div id="course-cards-section" className="mb-8 lg:mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className={`border rounded-lg p-3 sm:p-2 bg-white hover:shadow-sm transition ${
                  selectedCourseId === course.id
                    ? "border-blue-500 ring-1 ring-blue-200"
                    : ""
                }`}
              >
                <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover aspect-video rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-center font-medium text-sm mt-2 line-clamp-2">
                  {course.title}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`mt-2 text-sm px-3 py-2 sm:py-1 rounded-md w-full transition-opacity hover:opacity-90 ${
                    brandPrimaryColor ? "text-white" : "border"
                  }`}
                  style={
                    brandPrimaryColor
                      ? { backgroundColor: brandPrimaryColor }
                      : undefined
                  }
                >
                  Select Course
                </button>
              </div>
            ))}
          </div>
        </div>

        <div id="content-tabs" className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 overflow-x-auto pb-1" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab === "journal" && `Journal (${counts.journal})`}
                  {tab === "notes" && `Notes (${counts.notes})`}
                  {tab === "highlights" && `Highlights (${counts.highlights})`}
                  {tab === "resources" && `Saved Content (${counts.resources})`}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div id="content-area">
          <div
            id="journal-content"
            className={`tab-content ${activeTab !== "journal" ? "hidden" : ""}`}
          >
            <div className="space-y-6">
              {Object.entries(journalByModule).map(([moduleId, module]) => {
                const accordionId = `module-${moduleId}-journal`

                const lessonEntries = Object.entries(module.lessons)

                return (
                  <div
                    key={moduleId}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleAccordion(accordionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {module.moduleTitle}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {lessonEntries.reduce(
                              (sum, [, entries]) => sum + entries.length,
                              0
                            )} entries
                          </p>
                        </div>

                        <i
                          className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${
                            isAccordionOpen(accordionId) ? "rotate-180" : ""
                          }`}
                        ></i>
                      </div>
                    </div>

                    <div
                      className={`${
                        isAccordionOpen(accordionId) ? "" : "hidden"
                      } border-t border-gray-100`}
                    >
                      <div className="p-4 sm:p-6 space-y-6">
                        {lessonEntries.map(([lessonId, entries]) => (
                          <div
                            key={lessonId}
                            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                          >
                            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">
                              Lesson: {entries[0]?.course_lessons?.title}
                            </h4>

                            {entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="bg-indigo-50 rounded-lg p-4 sm:p-5 border border-indigo-100 mb-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <i className="fa-solid fa-book-open text-primary text-sm"></i>
                                    <span className="text-xs font-medium text-gray-600">
                                      Journal Reflection
                                    </span>
                                  </div>

                                  {entry.created_at && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(entry.created_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                <p className="text-gray-900 leading-relaxed text-sm sm:text-base break-words mb-4">
                                  {entry.response}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEntry(entry)
                                    setEditResponse(entry.response ?? "")
                                    setIsEditModalOpen(true)
                                  }}
                                  className="text-primary hover:text-indigo-700 text-sm font-medium flex items-center space-x-1"
                                >
                                  <i className="fa-solid fa-pen text-xs"></i>
                                  <span>Edit reflection</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            id="notes-content"
            className={`tab-content ${activeTab !== "notes" ? "hidden" : ""}`}
          >
            <div className="space-y-6">
              {Object.entries(notesByModule).map(([moduleId, module]) => {
                const accordionId = `module-${moduleId}-notes`
                const lessonEntries = Object.entries(module.lessons)

                return (
                  <div
                    key={moduleId}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleAccordion(accordionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {module.moduleTitle}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {lessonEntries.reduce(
                              (sum, [, entries]) => sum + entries.length,
                              0
                            )} notes
                          </p>
                        </div>

                        <i
                          className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${
                            isAccordionOpen(accordionId) ? "rotate-180" : ""
                          }`}
                        ></i>
                      </div>
                    </div>

                    <div
                      className={`${
                        isAccordionOpen(accordionId) ? "" : "hidden"
                      } border-t border-gray-100`}
                    >
                      <div className="p-4 sm:p-6 space-y-6">
                        {lessonEntries.map(([lessonId, entries]) => (
                          <div
                            key={lessonId}
                            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                          >
                            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">
                              Lesson: {entries[0]?.course_lessons?.title}
                            </h4>

                            <div className="space-y-2">
                              {entries.map((entry) => (
                                <div key={entry.id} className="flex items-start gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                  <p className="text-gray-900 text-sm sm:text-base">
                                    {entry.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            id="highlights-content"
            className={`tab-content ${activeTab !== "highlights" ? "hidden" : ""}`}
          >
            <div className="space-y-6">
              {Object.entries(highlightsByModule).map(([moduleId, module]) => {
                const accordionId = `module-${moduleId}-highlights`
                const lessonEntries = Object.entries(module.lessons)

                return (
                  <div
                    key={moduleId}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleAccordion(accordionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {module.moduleTitle}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {lessonEntries.reduce(
                              (sum, [, entries]) => sum + entries.length,
                              0
                            )} highlights
                          </p>
                        </div>

                        <i
                          className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${
                            isAccordionOpen(accordionId) ? "rotate-180" : ""
                          }`}
                        ></i>
                      </div>
                    </div>

                    <div
                      className={`${
                        isAccordionOpen(accordionId) ? "" : "hidden"
                      } border-t border-gray-100`}
                    >
                      <div className="p-4 sm:p-6 space-y-6">
                        {lessonEntries.map(([lessonId, entries]) => (
                          <div
                            key={lessonId}
                            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                          >
                            <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">
                              Lesson: {entries[0]?.course_lessons?.title}
                            </h4>

                            <div className="space-y-4">
                              {entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border-l-4 border-primary bg-indigo-50 px-4 py-3 rounded-r break-words"
                                >
                                  <p className="text-gray-900 text-sm sm:text-base italic">
                                    {entry.highlight_text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            id="resources-content"
            className={`tab-content ${activeTab !== "resources" ? "hidden" : ""}`}
          >
            <div id="saved-content" className="space-y-6">
              {Object.keys(savedResourcesByModule).length === 0 && (
                <div className="text-gray-500 text-sm">
                  No saved content yet.
                </div>
              )}

              {Object.entries(savedResourcesByModule).map(([moduleId, module]) => {
                const accordionId = `module-${moduleId}-resources`
                const blockTypeConfig: Record<
                  string,
                  { icon: React.ElementType; label: string }
                > = {
                  video: { icon: Video, label: "Video" },
                  text: { icon: FileText, label: "Text" },
                  image: { icon: Image, label: "Image" },
                  pdf: { icon: File, label: "PDF" },
                  download: { icon: Download, label: "Download" },
                  audio: { icon: Headphones, label: "Audio" },
                  headline: { icon: BookOpen, label: "Headline" },
                  divider: { icon: BookOpen, label: "Divider" },
                }

                return (
                  <div
                    key={moduleId}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleAccordion(accordionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {module.moduleTitle}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {Object.values(module.lessons).reduce(
                              (sum, l) => sum + l.resources.length,
                              0
                            )} saved items
                          </p>
                        </div>
                        <i
                          className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${
                            isAccordionOpen(accordionId) ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    <div
                      className={`${
                        isAccordionOpen(accordionId) ? "" : "hidden"
                      } border-t border-gray-100`}
                    >
                      <div className="p-4 sm:p-6 space-y-6">
                        {Object.entries(module.lessons).map(
                          ([lessonId, lesson]) => (
                            <div
                              key={lessonId}
                              className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                            >
                              <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">
                                {lesson.lessonTitle}
                              </h4>
                              <div className="space-y-4">
                                {lesson.resources.map(({ note, block }) => {
                                  const blockType =
                                    (block?.type as string) || "content"
                                  const config =
                                    blockTypeConfig[blockType] ?? {
                                      icon: BookOpen,
                                      label: "Content",
                                    }
                                  const Icon = config.icon
                                  const courseId = note.course_lessons
                                    ?.course_sections?.course_id
                                  const noteLessonId = note.lesson_id

                                  return (
                                    <div
                                      key={note.id}
                                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                                    >
                                        <div className="flex items-start gap-3 flex-wrap">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                          <Icon className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-gray-900 font-medium mb-1">
                                            {config.label}
                                          </div>
                                          <div className="text-sm text-gray-500 mb-2">
                                            {note.course_lessons?.course_sections?.title} →{" "}
                                            {note.course_lessons?.title}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              courseId &&
                                              noteLessonId &&
                                              setPreviewBlock({
                                                block,
                                                courseId,
                                                lessonId: noteLessonId,
                                              })
                                            }
                                            className="text-sm text-indigo-600 hover:underline"
                                          >
                                            View Content
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false)
            setEditingEntry(null)
          }
        }}
      >
        <DialogContent className="w-[92vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reflection</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <textarea
              value={editResponse}
              onChange={(e) => setEditResponse(e.target.value)}
              className="w-full min-h-[200px] sm:min-h-[220px] p-3 border rounded-md"
              placeholder="Your reflection..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingEntry(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingEntry) return
                  try {
                    await updateJournalEntry({
                      entryId: editingEntry.id,
                      response: editResponse,
                    })
                    setIsEditModalOpen(false)
                    setEditingEntry(null)
                    router.refresh()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to save")
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewBlock}
        onOpenChange={(open) => !open && setPreviewBlock(null)}
      >
        <DialogContent className="w-[92vw] max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewBlock?.block?.type
                ? String(previewBlock.block.type).charAt(0).toUpperCase() +
                  String(previewBlock.block.type).slice(1).toLowerCase()
                : "Content"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewBlock && (
              <div className="w-full max-w-3xl mx-auto">
                <LessonBlockRenderer
                  blocks={[previewBlock.block]}
                  courseId={previewBlock.courseId}
                  lessonId={previewBlock.lessonId}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
