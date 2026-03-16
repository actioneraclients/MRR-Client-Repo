"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { enrollInCourse } from "@/app/members/courses/actions"
import { Button } from "@/components/ui/button"
import CourseInviteModal from "@/components/courses/CourseInviteModal"
import { BookOpen, Star, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react"
import { SpotlightSection } from "@/components/ui/SpotlightSection"
import { SponsoredCourseCard } from "@/components/courses/SponsoredCourseCard"

type TaxonomyItem = { slug: string; name: string }

type ProfileRow = { full_name: string | null; avatar_url: string | null } | null

type FeaturedCourseRow = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  access_type: string | null
  price: number | null
  created_by: string | null
  profiles?: ProfileRow
}

type CourseRow = FeaturedCourseRow & {
  modules: number
  lessons: number
  course_sections?: unknown[]
  course_lessons?: unknown[]
}

type FeaturedCourse = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  instructor: string
  avatar_url: string | null
}

type Course = CourseRow & {
  instructor: string
  avatar_url: string | null
  ownsCourse: boolean
  category?: TaxonomyItem
  tags?: TaxonomyItem[]
  includedInPlan?: boolean
  featured?: boolean
  is_sponsored?: boolean
  payment_url?: string | null
}

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

function FeaturedHeroCarousel({
  items,
  onSelect,
}: {
  items: FeaturedCourse[]
  onSelect: (c: FeaturedCourse) => void
}) {
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  const handleNext = () => {
    setFeaturedIndex((prev) => (prev + 1) % items.length)
  }

  const handlePrev = () => {
    setFeaturedIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  useEffect(() => {
    if (!autoRotate) return
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % items.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [items.length, autoRotate])

  if (items.length === 0) return null

  const current = items[featuredIndex]

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden h-[380px] md:h-[420px]"
      onMouseEnter={() => setAutoRotate(false)}
      onMouseLeave={() => setAutoRotate(true)}
    >
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => onSelect(current)}
      >
        {current.thumbnail_url ? (
          <img
            src={current.thumbnail_url}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
              ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
            }}
          />
        ) : null}
        <div
          className={`absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${current.thumbnail_url ? "hidden" : ""}`}
        >
          <i className="fa-solid fa-book-open text-white text-4xl opacity-80" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-8 left-8 flex flex-col gap-2">
          <span className="text-xs uppercase bg-purple-600 text-white px-2 py-1 rounded font-medium">
            Featured
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
            {current.title}
          </h2>
          <p className="text-white/90 text-sm md:text-base">{current.instructor}</p>
          <Button
            className="w-fit shrink-0 bg-white text-gray-900 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(current)
            }}
          >
            View Details
          </Button>
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white p-2 shadow transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          handlePrev()
        }}
      >
        <ChevronLeft className="w-5 h-5 text-gray-900" />
      </button>
      <button
        type="button"
        aria-label="Next"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white p-2 shadow transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
      >
        <ChevronRight className="w-5 h-5 text-gray-900" />
      </button>
    </div>
  )
}

function CoursesToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTag,
  onTagChange,
  usedCategories,
  usedTags,
  onInviteCodeClick,
  allCoursesCount = 0,
  includedCoursesCount = 0,
  enrolledCoursesCount = 0,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategory: string
  onCategoryChange: (c: string) => void
  selectedTag: string
  onTagChange: (tag: string) => void
  usedCategories: TaxonomyItem[]
  usedTags: TaxonomyItem[]
  onInviteCodeClick?: () => void
  allCoursesCount?: number
  includedCoursesCount?: number
  enrolledCoursesCount?: number
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
      <div className="flex gap-2">
        {[
          { id: "all", label: `All (${allCoursesCount})`, icon: BookOpen },
          { id: "included", label: `Included (${includedCoursesCount})`, icon: Star },
          { id: "enrolled", label: `Enrolled (${enrolledCoursesCount})`, icon: GraduationCap },
        ].map((tab) => {
          const Icon = tab.icon
          return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cx(
              "flex items-center gap-2",
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
          )
        })}
      </div>

      <input
        type="text"
        placeholder="Search courses..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 w-64 border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="all">All Categories</option>
        {usedCategories.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={selectedTag}
        onChange={(e) => onTagChange(e.target.value)}
        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="all">All Tags</option>
        {usedTags.map((tag) => (
          <option key={tag.slug} value={tag.slug}>
            {tag.name}
          </option>
        ))}
      </select>

      {onInviteCodeClick && (
        <button
          type="button"
          onClick={onInviteCodeClick}
          className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shrink-0 w-full sm:w-auto sm:ml-auto"
        >
          Invite Code
        </button>
      )}
    </div>
  )
}

function CourseCard({
  course,
  onViewDetails,
  isEnrolled = false,
}: {
  course: Course
  onViewDetails: (c: Course) => void
  isEnrolled?: boolean
}) {
  const router = useRouter()
  const planAccess = course.includedInPlan === true
  const hasAccess =
    (course.access_type === "free" || (course as { accessType?: string }).accessType === "free") ||
    planAccess

  return (
    <div
      onClick={() => {
        if (isEnrolled) {
          router.push(`/members/courses/${course.id}`)
        } else {
          onViewDetails(course)
        }
      }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:scale-[1.01] transition-all overflow-hidden flex flex-col h-full cursor-pointer"
    >
      <div className="relative w-full aspect-video flex-shrink-0 overflow-hidden rounded-t-xl bg-gray-100">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
              ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
            }}
          />
        ) : null}
        <div
          className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${course.thumbnail_url ? "hidden" : ""}`}
        >
          <i className="fa-solid fa-book-open text-white text-4xl opacity-80" />
        </div>
        {course.featured && (
          <Badge className="absolute top-3 left-3 bg-orange-100 text-orange-800 border-orange-200">
            Featured
          </Badge>
        )}
        {course.includedInPlan && (
          <Badge className="absolute top-3 right-3 bg-blue-100 text-blue-800 border-blue-200">
            Included
          </Badge>
        )}
        {!course.includedInPlan && (course.access_type === "free" || (course as { accessType?: string }).accessType === "free") && (
          <Badge className="absolute top-3 right-3 bg-green-100 text-green-800 border-green-200">
            Free
          </Badge>
        )}
        {!course.includedInPlan && (course.access_type === "paid" || (course as { accessType?: string }).accessType === "paid") && (
          <Badge className="absolute top-3 right-3 bg-purple-100 text-purple-800 border-purple-200">
            Paid
          </Badge>
        )}
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col flex-grow gap-4">
          <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2">{course.title}</h3>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            {course.avatar_url ? (
              <img src={course.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            )}
            <span>{course.instructor}</span>
          </div>

          {course.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{course.description}</p>
          )}

          <span className="text-xs text-gray-500">
            {course.modules} modules · {course.lessons} lessons
          </span>
        </div>

        <div className="mt-auto flex justify-end pt-3">
          {isEnrolled ? (
            <Link
              href={`/members/courses/${course.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100"
            >
              Access Course
            </Link>
          ) : hasAccess ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(course)
              }}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100"
            >
              Start Course
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const url = course.payment_url
                if (url) {
                  window.location.href = url
                } else {
                  console.warn("Buy Course: payment_url missing for course", course.id)
                }
              }}
              disabled={!course.payment_url}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Course
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CourseDetailsModal({
  course,
  open,
  onClose,
  isEnrolled,
}: {
  course: Course | null
  open: boolean
  onClose: () => void
  isEnrolled: boolean
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!course) return null

  const planAccess = course.includedInPlan === true
  const hasAccess =
    (course.access_type === "free" || (course as { accessType?: string }).accessType === "free") ||
    planAccess

  const getActionButton = () => {
    if (course.ownsCourse) return "Start Course"
    if (hasAccess) return "Start Course"
    return "Buy Course"
  }

  const accessType = (course as { accessType?: string }).accessType ?? course.access_type ?? "free"
  const price = (course as { price?: number }).price ?? 0

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="w-full h-[260px] bg-gray-100 overflow-hidden flex items-center justify-center rounded-t-lg">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <i className="fa-solid fa-book-open text-white text-4xl opacity-80" />
            </div>
          )}
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{course.title}</DialogTitle>
            {course.includedInPlan && (
              <Badge className="mt-2 w-fit bg-blue-100 text-blue-800 border-blue-200">
                Included in your plan
              </Badge>
            )}
          </DialogHeader>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {course.avatar_url ? (
              <img src={course.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            )}
            <span>{course.instructor}</span>
          </div>
          {course.description && (
            <p className="text-gray-700 text-base leading-relaxed">{course.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{course.modules} modules</span>
            <span>{course.lessons} lessons</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Access:</span>
            <span className="capitalize">{accessType}</span>
            {accessType === "paid" && (
              <span className="font-semibold text-gray-900">${price}</span>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            {isEnrolled ? (
              <div className="text-sm text-gray-600">
                You are already enrolled in this course. Go to the{" "}
                <span className="font-medium">Enrolled</span> tab to continue.
              </div>
            ) : hasAccess ? (
              <Button
                onClick={() => {
                  setConfirmOpen(true)
                }}
                className="w-full sm:w-auto"
              >
                Start Course
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const url = course.payment_url
                  if (url) {
                    window.location.href = url
                  } else {
                    console.warn("Buy Course: payment_url missing for course", course.id)
                  }
                }}
                disabled={!course.payment_url}
                className="w-full sm:w-auto"
              >
                Buy Course
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start Course</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          You are about to enroll in &quot;{course.title}&quot;.
          Click Proceed to begin the course.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>

          <Button
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true)

                await enrollInCourse(course.id)

                window.location.href = `/members/courses/${course.id}`
              } catch (e) {
                console.error(e)
              } finally {
                setLoading(false)
              }
            }}
          >
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

type Props = {
  courses: Course[]
  featuredCourses: FeaturedCourse[]
  usedCategories: TaxonomyItem[]
  usedTags: TaxonomyItem[]
  enrolledCourseIds: string[]
  canManageCourses?: boolean
  brandAccentColor?: string | null
  pageTitle?: string
  pageDescription?: string | null
}

export default function CoursesListingUI({
  courses,
  featuredCourses,
  usedCategories,
  usedTags,
  enrolledCourseIds,
  canManageCourses = false,
  brandAccentColor = null,
  pageTitle = "Courses",
  pageDescription = "View our selection of online courses below to take deeper learning journeys.",
}: Props) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTag, setSelectedTag] = useState("all")
  const [detailsCourse, setDetailsCourse] = useState<Course | FeaturedCourse | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const allCourses = courses
  const includedCourses = courses.filter((course) => {
    if (course.access_type === "free" || (course as { accessType?: string }).accessType === "free") return true
    if ((course as { includedInPlan?: boolean }).includedInPlan) return true
    return false
  })
  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id))

  const filteredCourses = (activeTab === "all" ? allCourses : activeTab === "included" ? includedCourses : enrolledCourses).filter((course) => {
    const matchesSearch =
      !searchTerm ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesCategory =
      selectedCategory === "all" || course.category?.slug === selectedCategory
    const matchesTag =
      selectedTag === "all" ||
      (course.tags?.some((t) => t.slug === selectedTag) ?? false)
    return matchesSearch && matchesCategory && matchesTag
  })

  const handleViewDetails = (c: Course | FeaturedCourse) => {
    const fullCourse = courses.find((co) => co.id === c.id)
    if (fullCourse) {
      setDetailsCourse(fullCourse)
    } else {
      const fc = c as FeaturedCourse & { access_type?: string; price?: number }
      setDetailsCourse({
        ...fc,
        description: fc.description,
        avatar_url: fc.avatar_url,
        instructor: fc.instructor,
        modules: 0,
        lessons: 0,
        ownsCourse: false,
        access_type: fc.access_type ?? "free",
        price: fc.price ?? 0,
      } as Course)
    }
    setIsDetailsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          {pageDescription && <p className="text-gray-600 max-w-xl">{pageDescription}</p>}
        </div>

        {/* Manage Courses button - top right above hero */}
        {canManageCourses && (
          <div className="flex justify-end mb-4">
            <Link
              href="/members/courses/builder"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              Manage Courses
            </Link>
          </div>
        )}

        {/* Featured Hero - outside white container, like Masterclasses */}
        {featuredCourses.length > 0 && (
          <div className="mb-8">
            <FeaturedHeroCarousel items={featuredCourses} onSelect={handleViewDetails} />
          </div>
        )}

        {/* Sticky Filter/Search Toolbar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6">
          <CoursesToolbar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            usedCategories={usedCategories}
            usedTags={usedTags}
            onInviteCodeClick={() => setInviteModalOpen(true)}
            allCoursesCount={allCourses.length}
            includedCoursesCount={includedCourses.length}
            enrolledCoursesCount={enrolledCourses.length}
          />
        </div>

        {/* Browse Courses section header */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Browse Courses</h2>
          <p className="text-base text-gray-600">
            Discover courses created by experts in the community.
          </p>
        </section>

        {/* Tab-specific messages */}
        {activeTab === "included" && (
          <p className="text-sm text-gray-600 mb-4">
            Courses below are either free or part of your membership plan.
          </p>
        )}

        {activeTab === "enrolled" && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div />
            <Link
              href="/members/courses/learning-notes"
              className={`text-white px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 w-full sm:w-auto text-center ${!brandAccentColor ? "bg-primary" : ""}`}
              style={brandAccentColor ? { backgroundColor: brandAccentColor } : undefined}
            >
              My Learning Notes
            </Link>
          </div>
        )}

        {/* Course Grid */}
        <section>
          {filteredCourses.length > 0 ? (
            <SpotlightSection
              items={filteredCourses}
              CardComponent={(props) => (
                <CourseCard
                  course={props.item}
                  onViewDetails={handleViewDetails}
                  isEnrolled={enrolledCourseIds.includes(props.item.id)}
                />
              )}
              featuredField="featured"
              sponsoredField="is_sponsored"
              onSponsorClick={handleViewDetails}
              brandAccentColor={brandAccentColor ?? "#2563eb"}
              SponsoredCardComponent={(props) => (
                <SponsoredCourseCard
                  {...props}
                  isEnrolled={enrolledCourseIds.includes(props.item.id)}
                />
              )}
            />
          ) : activeTab === "enrolled" ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <p className="text-gray-700 font-medium">
                You are not currently enrolled in any courses.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <p className="text-gray-700 font-medium">
                You don&apos;t have access to any courses yet.
              </p>
            </div>
          )}
        </section>
      </div>

      <CourseDetailsModal
        course={detailsCourse as Course}
        open={isDetailsModalOpen}
        isEnrolled={detailsCourse ? enrolledCourseIds.includes(detailsCourse.id) : false}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setDetailsCourse(null)
        }}
      />

      <CourseInviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  )
}
