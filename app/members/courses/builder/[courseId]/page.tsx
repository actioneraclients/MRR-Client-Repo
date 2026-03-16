import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CourseSettingsCard } from "./CourseSettingsCard"
import { LessonAccessOptionsCard } from "./LessonAccessOptionsCard"
import {
  createModule,
  createLesson,
  updateModuleTitle,
  deleteModule,
  deleteLesson,
  duplicateLesson,
} from "./actions"

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) {
    redirect("/members/courses/builder")
  }

  const { data: modules = [] } = await supabase
    .from("course_sections")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order")

  const { data: lessons = [] } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order")

  const { data: taxonomies } = await supabase
    .from("taxonomies")
    .select("id, name, type")
    .order("name")

  const categories = taxonomies?.filter((t) => t.type === "category") || []
  const tags = taxonomies?.filter((t) => t.type === "content_tag") || []

  const { data: relations } = await supabase
    .from("taxonomy_relations")
    .select(`
      taxonomy_id,
      taxonomies (
        id,
        name,
        type
      )
    `)
    .eq("entity_type", "course")
    .eq("entity_id", courseId)

  const selectedCategoryRow =
    relations?.find((r) => r.taxonomies?.type === "category") ?? null

  const selectedCategoryId = selectedCategoryRow?.taxonomy_id ?? null
  const selectedCategoryName = selectedCategoryRow?.taxonomies?.name ?? null

  const selectedTagIds =
    relations
      ?.filter((r) => r.taxonomies?.type === "content_tag")
      .map((r) => r.taxonomy_id) ?? []

  const selectedTagOptions =
    relations
      ?.filter((r) => r.taxonomies?.type === "content_tag")
      .map((r) => ({
        id: r.taxonomy_id,
        name: r.taxonomies?.name ?? "",
      })) ?? []

  let canCreatePaidCourses = false
  let remainingPaidCourses: number | null = null
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_id")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.plan_id) {
    const [paidPermissionRes, paidCourseCountRes] = await Promise.all([
      supabase
        .from("plan_permissions")
        .select("enabled, limit_value")
        .eq("plan_id", profile.plan_id)
        .eq("permission_key", "create_paid_course")
        .maybeSingle(),
      supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("created_by", user.id)
        .eq("access_type", "paid"),
    ])

    const paidPermission = paidPermissionRes.data
    const paidCourseCount = paidCourseCountRes.count
    const paidLimit = paidPermission?.limit_value ?? null
    remainingPaidCourses =
      paidLimit !== null
        ? Math.max(paidLimit - (paidCourseCount ?? 0), 0)
        : null
    canCreatePaidCourses =
      paidPermission?.enabled === true &&
      (remainingPaidCourses === null || remainingPaidCourses > 0)
  }

  const getLessonIcon = (lesson: { content_type?: string | null }) => {
    const type = lesson.content_type?.toLowerCase()
    if (type === "video") {
      return { bg: "bg-blue-50", icon: "fa-play", color: "text-blue-600" }
    }
    if (type === "text" || type === "article") {
      return { bg: "bg-purple-50", icon: "fa-align-left", color: "text-purple-600" }
    }
    if (type === "download" || type === "file") {
      return { bg: "bg-emerald-50", icon: "fa-file-arrow-down", color: "text-emerald-600" }
    }
    return { bg: "bg-blue-50", icon: "fa-play", color: "text-blue-600" }
  }

  return (
    <div className="p-6 space-y-6">
      <div id="course-builder-workspace" className="min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          <Link
            href="/members/courses/builder"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
            Back to Course Dashboard
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Column - Course Outline */}
            <div id="course-outline-panel" className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
                {/* Course Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Course</p>
                      <h2 className="text-lg font-bold text-gray-900 truncate">{course.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/members/courses/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
                      >
                        Preview Course
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                      </Link>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{modules.length} modules • {lessons.length} lessons</p>
                </div>

                {/* Modules List */}
                <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {modules.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                      <p className="text-sm text-gray-600 mb-2">No modules yet</p>
                      <p className="text-xs text-gray-500 mb-4">Add your first module to start building your course.</p>
                      <form action={createModule}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mx-auto"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                          Add your first module
                        </button>
                      </form>
                    </div>
                  ) : (
                  <>
                  {modules.map((module) => {
                    const moduleLessons = lessons.filter(
                      (lesson) => (lesson as { section_id?: string }).section_id === module.id
                    )
                    return (
                  <div key={module.id} id={`module-${module.id}`} className="section-card group bg-gray-50 rounded-lg border border-gray-200 overflow-hidden transition-all hover:border-gray-300 hover:shadow-sm">
                    <div className="p-4 flex items-center gap-3 bg-white border-b border-gray-100">
                      <button className="drag-handle text-gray-400 hover:text-gray-600 p-1 cursor-grab active:cursor-grabbing">
                        <i className="fa-solid fa-grip-vertical text-sm"></i>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-chevron-down text-xs text-gray-400 flex-shrink-0"></i>
                          <form action={updateModuleTitle} className="flex items-center gap-2 flex-1 min-w-0">
                            <input type="hidden" name="moduleId" value={module.id} />
                            <input type="hidden" name="courseId" value={course.id} />
                            <input
                            type="text"
                            name="title"
                            defaultValue={module.title}
                            className="font-semibold text-lg bg-transparent border-b border-transparent focus:border-muted outline-none flex-1 min-w-0"
                          />
                            <button type="submit" className="text-sm text-muted-foreground shrink-0">
                              Save
                            </button>
                          </form>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{moduleLessons.length} lessons</p>
                      </div>
                      <div className="section-actions opacity-0 group-hover:opacity-100 lg:opacity-100 flex items-center gap-1 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                        <form action={deleteModule}>
                          <input type="hidden" name="moduleId" value={module.id} />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button
                            type="submit"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Module"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {moduleLessons.map((lesson) => {
                        const iconStyle = getLessonIcon(lesson)
                        return (
                          <div key={lesson.id} className="lesson-row group bg-white rounded-md border border-gray-100 p-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                            <button className="drag-handle text-gray-300 group-hover:text-gray-400 p-0.5 cursor-grab active:cursor-grabbing">
                              <i className="fa-solid fa-grip-vertical text-xs"></i>
                            </button>
                            <Link href={`/members/courses/builder/${courseId}/lesson/${lesson.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-7 h-7 rounded ${iconStyle.bg} flex items-center justify-center flex-shrink-0`}>
                                <i className={`fa-solid ${iconStyle.icon} ${iconStyle.color} text-xs`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {(lesson as { status?: string }).status === "published" ? "Published" : "Draft"}
                                </p>
                              </div>
                            </Link>
                            <div className="lesson-actions opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                <i className="fa-solid fa-pen text-xs"></i>
                              </button>
                              <form action={duplicateLesson}>
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <input type="hidden" name="courseId" value={course.id} />
                                <button
                                  type="submit"
                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  title="Duplicate"
                                >
                                  <i className="fa-solid fa-copy text-xs"></i>
                                </button>
                              </form>
                              <form action={deleteLesson}>
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <input type="hidden" name="courseId" value={course.id} />
                                <button
                                  type="submit"
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                              </form>
                            </div>
                          </div>
                        )
                      })}

                      <form action={createLesson}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="sectionId" value={module.id} />
                        <button
                          type="submit"
                          className="mt-3 text-sm px-3 py-1.5 rounded-md bg-secondary hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                          <i className="fa-solid fa-plus text-xs"></i>
                          Add Lesson
                        </button>
                      </form>
                    </div>
                  </div>
                    )
                  })}

                  {/* Add Module Button */}
                  <form action={createModule}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <button
                      type="submit"
                      className="w-full py-3 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white bg-gray-50 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-plus"></i>
                      Add Module
                    </button>
                  </form>
                  </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Context Editor */}
            <div id="workspace-area" className="lg:col-span-7 xl:col-span-8">
              {/* Course Settings Panel (Default State) */}
              <div id="course-settings" className="space-y-6">
                <CourseSettingsCard
                  course={course}
                  courseId={courseId}
                  categories={categories}
                  tags={tags}
                  selectedCategoryId={selectedCategoryId}
                  selectedCategoryName={selectedCategoryName}
                  selectedTagIds={selectedTagIds}
                  selectedTagOptions={selectedTagOptions}
                  canCreatePaidCourses={canCreatePaidCourses}
                  remainingPaidCourses={remainingPaidCourses}
                />

                {/* Course Progress */}
                {(() => {
                  const hasSetup =
                    !!course.title?.trim() &&
                    !!course.description?.trim() &&
                    !!course.thumbnail_url
                  const hasModules = modules.length > 0
                  const hasLessons = lessons.length > 0
                  const readyForReview = hasSetup && hasModules && hasLessons
                  const items = [
                    { label: "Course Setup", done: hasSetup },
                    { label: "Modules Created", done: hasModules },
                    { label: "Lessons Added", done: hasLessons },
                    { label: "Ready for Review", done: readyForReview },
                  ]
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Course Progress
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <i
                              className={`fa-solid ${
                                item.done
                                  ? "fa-circle-check text-green-500"
                                  : "fa-circle text-gray-300"
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Lesson Access Options */}
                <LessonAccessOptionsCard course={course} courseId={courseId} />

                {/* Course Overview Stats */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Course Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-folder text-blue-600"></i>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
                          <p className="text-xs text-gray-500 font-medium">Modules</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-book-open text-purple-600"></i>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
                          <p className="text-xs text-gray-500 font-medium">Lessons</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Settings Panel (shown when module edit is clicked) */}
              <div id="section-settings" className="hidden space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Module Settings</h2>
                      <p className="text-sm text-gray-500 mt-1">Edit module details and configuration</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Module Title</label>
                      <input type="text" defaultValue="Module 1 — Foundations" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Module Description</label>
                      <textarea rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Describe what students will learn in this module...">Build a strong foundation for your subscription business journey.</textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Duration</label>
                      <input type="text" defaultValue="45 minutes" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. 30 minutes" />
                    </div>
                  </div>
                </div>

                {/* Module Overview */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Module Overview</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-book-open text-purple-600"></i>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">3</p>
                          <p className="text-xs text-gray-500 font-medium">Lessons</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-layer-group text-emerald-600"></i>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">9</p>
                          <p className="text-xs text-gray-500 font-medium">Total Blocks</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-clock text-orange-600"></i>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">45m</p>
                          <p className="text-xs text-gray-500 font-medium">Duration</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-6 mt-6 border-t border-gray-200">
                    <button className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                      Save Changes
                    </button>
                    <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <i className="fa-solid fa-plus text-xs"></i>
                      Add Lesson
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                      Delete Module
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Overview Panel (shown when lesson is clicked) */}
              <div id="lesson-overview" className="hidden space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <i className="fa-solid fa-arrow-left text-sm"></i>
                        </button>
                        <span className="text-xs text-gray-500 font-medium">Module 1 — Foundations</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Course</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-layer-group text-xs"></i>
                          3 blocks
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">Published</span>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Details */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Lesson Title</label>
                      <input type="text" defaultValue="Welcome to the Course" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Lesson Description</label>
                      <textarea rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Brief description of the lesson content...">An introduction to the course structure, goals, and what students will learn throughout the program.</textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                        <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option>Published</option>
                          <option>Draft</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Duration</label>
                        <input type="text" defaultValue="8 minutes" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. 15 minutes" />
                      </div>
                    </div>
                  </div>

                  {/* Lesson Actions */}
                  <div className="flex flex-wrap gap-3 pb-6 border-b border-gray-200">
                    <button className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                      <i className="fa-solid fa-pen text-xs"></i>
                      Edit Lesson
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <i className="fa-solid fa-eye text-xs"></i>
                      Preview Lesson
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-purple-200 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center gap-2">
                      <i className="fa-solid fa-copy text-xs"></i>
                      Duplicate Lesson
                    </button>
                    <button className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                      <i className="fa-solid fa-trash text-xs"></i>
                      Delete Lesson
                    </button>
                  </div>

                  <div className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Content Preview</h3>
                      <span className="text-xs text-gray-500">3 blocks</span>
                    </div>

                    <div className="space-y-3">
                      {/* Video Block Preview */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-play text-blue-600 text-sm"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">Video Block</h4>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">5:24</span>
                            </div>
                            <p className="text-xs text-gray-600">Introduction video explaining course structure and goals</p>
                          </div>
                        </div>
                      </div>

                      {/* Text Block Preview */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-align-left text-purple-600 text-sm"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">Text Block</h4>
                            <p className="text-xs text-gray-600">Welcome message and course expectations</p>
                          </div>
                        </div>
                      </div>

                      {/* Download Block Preview */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-file-arrow-down text-emerald-600 text-sm"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900">Download Block</h4>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">PDF</span>
                            </div>
                            <p className="text-xs text-gray-600">Course workbook and resource guide</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
