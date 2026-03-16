"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LearningNotesContent } from "@/app/members/courses/learning-notes/_components/LearningNotesContent"
import { getLessonAccessState } from "@/lib/courses/getLessonAccessState"

type Course = { id: string; title: string; description: string | null; instructions: string | null; instruction_video: string | null; thumbnail_url?: string | null; group_id?: string | null }
type Section = { id: string; title: string; sort_order: number }
type Lesson = { id: string; section_id: string; title: string; sort_order: number; release_date?: string | null; drip_days?: number | null; requires_previous_completion?: boolean | null }
type NextLesson = { id: string; title: string; thumbnail_url: string | null } | null

type ProgressMap = Record<string, { completed: boolean; completed_at: string | null }>
type Enrollment = { started_at: string | null } | null

type CourseOverviewContentProps = {
  course: Course
  sections: Section[]
  lessons: Lesson[]
  progressMap: ProgressMap
  enrollment: Enrollment
  nextLesson: NextLesson

  progressPercent: number
  completedLessons: number
  totalLessons: number

  learningStats: {
    notes: number
    highlights: number
    savedResources: number
  }
}

function toggleModule(
  sectionId: string,
  openModules: Set<string>,
  setOpenModules: (fn: (prev: Set<string>) => Set<string>) => void,
) {
  setOpenModules((prev) => {
    const next = new Set(prev)
    if (next.has(sectionId)) next.delete(sectionId)
    else next.add(sectionId)
    return next
  })
}

export function CourseOverviewContent({
  course,
  sections,
  lessons,
  progressMap = {},
  enrollment = null,
  nextLesson = null,
  progressPercent,
  completedLessons,
  totalLessons,
  learningStats,
}: CourseOverviewContentProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [notesOpen, setNotesOpen] = useState(false)
  const isModuleOpen = (sectionId: string) => openModules.has(sectionId)

  const orderedLessons = sections
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((section) =>
      lessons
        .filter((l) => l.section_id === section.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    )

  const currentLessonId = (() => {
    for (let i = 0; i < orderedLessons.length; i++) {
      const lesson = orderedLessons[i]

      const previousLesson = i > 0 ? orderedLessons[i - 1] : undefined

      const state = getLessonAccessState({
        lesson,
        previousLesson,
        progressMap,
        enrollment: enrollment ?? {},
      })

      if (state === "AVAILABLE") {
        return lesson.id
      }
    }
    return undefined
  })()

  const getSectionStatus = (section: Section, index: number) => {
    const sectionLessons = lessons.filter((l) => l.section_id === section.id)
    const completedCount = sectionLessons.filter(
      (l) => progressMap[l.id]?.completed
    ).length
    const totalCount = sectionLessons.length
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    const allCompleted = progress === 100
    const allLocked = sectionLessons.every((l, i) => {
      const prev =
        i === 0
          ? index > 0
            ? lessons
                .filter((le) => le.section_id === sections[index - 1].id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .pop()
            : undefined
          : sectionLessons[i - 1]

      return (
        getLessonAccessState({
          lesson: l,
          previousLesson: prev ?? undefined,
          progressMap,
          enrollment: enrollment ?? {},
        }) === "LOCKED"
      )
    })
    const isLocked = allLocked
    const isCompleted = allCompleted
    return {
      completedCount,
      totalCount,
      progress,
      badge: isCompleted ? "COMPLETED" : isLocked ? "LOCKED" : "IN PROGRESS",
      isLocked,
      isCompleted,
    }
  }

  return (
    <>
      <div id="course-overview-container" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - Full Width */}
        <div id="course-header-section" className="mb-6 w-full">
          <div className="bg-white border rounded-xl p-4 sm:p-5 flex gap-5 items-center">
            {course?.thumbnail_url && (
              <div className="w-[160px] shrink-0 overflow-hidden rounded-lg">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            <div className="flex flex-col justify-center max-w-2xl">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {course.title}
              </h1>

              <p className="text-xs text-gray-500 mt-2">
                {sections.length} Modules • {lessons.length} Lessons
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[2fr_1fr] mt-6">
          {/* LEFT (2fr): Start Here, Continue Learning, Modules */}
          <div className="space-y-6">
        {/* Start Here Accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="start-here" className="bg-white border rounded-xl">
            <AccordionTrigger className="px-4 py-4 text-left hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm">
                  ▶
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Start Here
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    Course Orientation
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {course.instruction_video && (
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${course.instruction_video.split("v=")[1]}`}
                    title="Course Orientation"
                    allowFullScreen
                  />
                </div>
              )}
              {course.instructions && (
                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {course.instructions}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Continue Learning Card */}
        {nextLesson && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-white border flex items-center justify-center overflow-hidden shrink-0">
                {nextLesson.thumbnail_url ? (
                  <img
                    src={nextLesson.thumbnail_url}
                    alt={nextLesson.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Lesson</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Continue Learning
                </p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {nextLesson.title}
                </p>
              </div>
            </div>
            <Link
              href={`/members/courses/${course.id}/lesson/${nextLesson.id}`}
              className="text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap"
            >
              Continue →
            </Link>
          </div>
        )}

        <div id="course-curriculum-section">
          <div className="space-y-3">
            {sections.map((section, sectionIndex) => {
              const sectionLessons = lessons
                .filter((lesson) => lesson.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order)
              const status = getSectionStatus(section, sectionIndex)

              const moduleBorderClass = status.isCompleted
                ? "border border-green-200"
                : status.isLocked
                  ? "border border-gray-200"
                  : "border-2 border-primary"
              const moduleBgClass = status.isCompleted
                ? "bg-green-100"
                : status.isLocked
                  ? "bg-gray-100"
                  : "bg-indigo-100"
              const moduleIconClass = status.isCompleted
                ? "text-green-600"
                : status.isLocked
                  ? "text-gray-400"
                  : "text-primary"

              return (
                <div
                  key={section.id}
                  id={`module-${section.id}`}
                  className={`bg-white rounded-lg overflow-hidden ${moduleBorderClass} ${status.isLocked ? "opacity-60" : ""}`}
                >
                  <div
                    className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleModule(section.id, openModules, setOpenModules)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${moduleBgClass}`}
                        >
                          {status.isCompleted ? (
                            <i className="fa-solid fa-circle-check text-green-600 text-lg"></i>
                          ) : status.isLocked ? (
                            <i className="fa-solid fa-lock text-gray-400"></i>
                          ) : (
                            <i className={`fa-solid fa-play ${moduleIconClass}`}></i>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {section.title}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded flex-shrink-0 ${
                                status.isCompleted
                                  ? "bg-green-100 text-green-700"
                                  : status.isLocked
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {status.badge}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                status.isCompleted ? "bg-green-600" : status.isLocked ? "bg-gray-300" : "bg-primary"
                              }`}
                              style={{ width: `${status.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {status.completedCount} / {status.totalCount} lessons complete
                          </p>
                        </div>
                      </div>
                      <i
                        className={`fa-solid fa-chevron-${isModuleOpen(section.id) ? "up" : "down"} text-gray-400 ml-4 flex-shrink-0`}
                      ></i>
                    </div>
                  </div>
                  <div
                    className={`${isModuleOpen(section.id) ? "" : "hidden"} border-t border-gray-200 bg-gray-50`}
                  >
                    <div className="p-4 sm:p-6 space-y-2">
                      {sectionLessons.map((lesson) => {
                        const flatIndex = orderedLessons.findIndex((l) => l.id === lesson.id)

                        const previousLesson =
                          flatIndex > 0
                            ? orderedLessons[flatIndex - 1]
                            : undefined
                        const accessState = getLessonAccessState({
                          lesson,
                          previousLesson: previousLesson ?? undefined,
                          progressMap,
                          enrollment: enrollment ?? {},
                        })
                        const locked = accessState === "LOCKED"
                        const completed = accessState === "COMPLETED"
                        const isCurrent = lesson.id === currentLessonId
                        const lessonHref = `/members/courses/${course.id}/lesson/${lesson.id}`

                        if (isCurrent) {
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between space-x-3 p-3 bg-indigo-50 rounded-lg border-2 border-primary min-h-[44px]"
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center flex-shrink-0">
                                  <i className="fa-solid fa-play text-white text-xs"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-0.5">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                      {lesson.title}
                                    </h4>
                                    <span className="px-1.5 py-0.5 bg-primary text-white text-xs font-semibold rounded flex-shrink-0">
                                      CURRENT
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Link
                                href={lessonHref}
                                className="px-4 py-1.5 bg-primary hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-colors flex-shrink-0"
                              >
                                Continue
                              </Link>
                            </div>
                          )
                        }

                        if (locked) {
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 opacity-50 min-h-[44px]"
                            >
                              <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-lock text-gray-400 text-xs"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base sm:text-lg font-semibold text-gray-700">{lesson.title}</h4>
                              </div>
                            </div>
                          )
                        }

                        if (completed) {
                          return (
                            <Link
                              key={lesson.id}
                              href={lessonHref}
                              className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                            >
                              <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-check text-green-600 text-xs"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-base sm:text-lg font-semibold text-gray-900">{lesson.title}</h4>
                              </div>
                            </Link>
                          )
                        }

                        return (
                          <Link
                            key={lesson.id}
                            href={lessonHref}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors min-h-[44px]"
                          >
                            <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center flex-shrink-0">
                              <i className="fa-solid fa-play text-primary text-xs"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base sm:text-lg font-semibold text-gray-900">{lesson.title}</h4>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

          </div>

        <div className="lg:col-span-1 order-last lg:order-none">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6 sticky top-24 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Course Progress
              </h3>
              <div className="mt-2 space-y-2">
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-[#1e3a5f] h-2 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {progressPercent}% Complete
                </p>
                <p className="text-xs text-gray-400">
                  {completedLessons} / {totalLessons} lessons completed
                </p>
              </div>
            </div>

            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Your Learning
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center mt-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {learningStats.notes}
                  </div>
                  <div className="text-xs text-gray-500">Notes</div>
                </div>

                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {learningStats.highlights}
                  </div>
                  <div className="text-xs text-gray-500">Highlights</div>
                </div>

                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {learningStats.savedResources}
                  </div>
                  <div className="text-xs text-gray-500">Resources</div>
                </div>
              </div>
            </div>

            <Link
              href="/members/courses/learning-notes"
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white transition-colors"
              style={{ backgroundColor: "var(--brand-accent-color)" }}
            >
              View Learning Notes
            </Link>

            <button
              type="button"
              onClick={() => {
                if (course.group_id) {
                  window.open(`/members/community/groups/${course.group_id}`, "_blank")
                } else {
                  window.open("/members/community", "_blank")
                }
              }}
              className="w-full text-white text-sm py-2.5 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              Discuss This Course
            </button>
          </div>
        </div>
        </div>
      </div>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="w-[95vw] max-w-6xl h-[85vh] p-0">

          <DialogHeader className="px-6 pt-4">
            <DialogTitle>Learning Notes</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <LearningNotesContent embedded />
          </div>

        </DialogContent>
      </Dialog>
    </>
  )
}
