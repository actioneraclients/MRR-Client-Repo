"use client"

import { format } from "date-fns"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ChevronLeft, ChevronRight, Pencil, Play, Plus, Video } from "lucide-react"
import { SponsoredMasterclassCard } from "@/components/masterclasses/SponsoredMasterclassCard"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { reserveMasterclass, updateMasterclass } from "./actions"
import { createMasterclass } from "./actions/create-masterclass"
import type { MasterclassForUI } from "./page"

type MasterclassBadge = "free" | "premium" | "featured"

const DURATION_OPTIONS = [30, 45, 60, 90, 120]

function getBadgeStyles(badge: MasterclassBadge | "live" | "replay"): string {
  const base = "rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
  switch (badge) {
    case "live":
      return `${base} bg-red-500 text-white`
    case "featured":
      return `${base} bg-purple-600 text-white`
    case "premium":
      return `${base} bg-amber-500 text-white`
    case "free":
      return `${base} bg-green-600 text-white`
    case "replay":
      return `${base} bg-blue-600 text-white`
    default:
      return `${base} bg-slate-200 text-slate-700`
  }
}

const formatDualTimezone = (dateString: string) => {
  const date = new Date(dateString)
  const pst = date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const est = date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${pst} PST / ${est} EST`
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getEmbedUrl(url: string): string | null {
  const u = url.trim()
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = u.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

function MasterclassCarousel({
  itemsCount,
  children,
}: {
  itemsCount: number
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el

    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()

    const timeout = setTimeout(() => {
      updateScrollState()
    }, 50)

    el.addEventListener("scroll", updateScrollState)

    return () => {
      clearTimeout(timeout)
      el.removeEventListener("scroll", updateScrollState)
    }
  }, [updateScrollState, itemsCount])

  const scrollAmount = 380

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    })
  }

  const showArrows = itemsCount > 3

  return (
    <div className="relative w-full overflow-hidden">
      {showArrows && (
        <button
          type="button"
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex bg-white shadow-md rounded-full p-2 disabled:opacity-30"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth w-full px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {showArrows && (
        <button
          type="button"
          onClick={scrollRight}
          disabled={!canScrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex bg-white shadow-md rounded-full p-2 disabled:opacity-30"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

type Props = {
  featuredMasterclasses: MasterclassForUI[]
  liveMasterclass: MasterclassForUI | null
  sponsoredMasterclass: MasterclassForUI | null
  thisWeekMasterclasses: MasterclassForUI[]
  upcomingMasterclasses: MasterclassForUI[]
  pastMasterclasses: MasterclassForUI[]
  canCreateMasterclass: boolean
  remainingMasterclasses: number
  attendeeCountMap?: Record<string, number>
  pageTitle?: string
  pageDescription?: string | null
}

function MasterclassCard({
  masterclass,
  badge,
  brandAccentColor,
  attendeeCount,
  onSelect,
  getBadgeStyles,
  getInitials,
}: {
  masterclass: MasterclassForUI
  badge: MasterclassBadge | "replay"
  brandAccentColor: string
  attendeeCount: number
  onSelect: (m: MasterclassForUI) => void
  getBadgeStyles: (b: MasterclassBadge | "live" | "replay") => string
  getInitials: (n: string) => string
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-shadow duration-200"
      onClick={() => onSelect(masterclass)}
    >
      <div className="w-full aspect-video flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          src={masterclass.image}
          alt={masterclass.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <span className={getBadgeStyles(badge)}>{badge}</span>
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug line-clamp-2">{masterclass.title}</h3>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={masterclass.hostAvatar} alt={masterclass.hostName} />
            <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
              {getInitials(masterclass.hostName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-600 text-xs sm:text-sm truncate">{masterclass.hostName}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {masterclass.scheduledAt ? (
            <>
              <span className="font-semibold text-gray-900">
                {format(new Date(masterclass.scheduledAt), "EEE, MMM d")}
              </span>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${brandAccentColor}15`,
                  color: brandAccentColor,
                }}
              >
                {formatDualTimezone(masterclass.scheduledAt)}
              </span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">
              {masterclass.date} · {masterclass.time}
            </span>
          )}
        </div>
        {masterclass.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-3 break-words">
            {masterclass.description}
          </p>
        )}
        <div className="mt-3 border-t pt-3 border-gray-100">
          <div className="flex items-center gap-1 text-sm text-gray-600 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m10-4.13a4 4 0 10-8 0m8 0a4 4 0 01-8 0"
              />
            </svg>
            {attendeeCount > 0
              ? `${attendeeCount} people planning`
              : "Be the first to reserve"}
          </div>
          <div className="pt-3 mt-auto">
          <Button
            className="w-full text-white hover:brightness-90"
            style={{ backgroundColor: brandAccentColor }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(masterclass)
            }}
          >
            View Details
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MasterclassesPageClient({
  featuredMasterclasses,
  liveMasterclass,
  sponsoredMasterclass,
  thisWeekMasterclasses,
  upcomingMasterclasses,
  pastMasterclasses,
  canCreateMasterclass,
  remainingMasterclasses,
  attendeeCountMap = {},
  pageTitle = "Masterclasses",
  pageDescription = "Live expert-led sessions designed to help you grow and connect.",
}: Props) {
  const [localCountOverrides, setLocalCountOverrides] = useState<Record<string, number>>({})
  const getAttendeeCount = (id: string) =>
    localCountOverrides[id] ?? attendeeCountMap[id] ?? 0
  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
  endOfWeek.setHours(23, 59, 59, 999)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedMasterclass, setSelectedMasterclass] = useState<MasterclassForUI | null>(null)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isPastOpen, setIsPastOpen] = useState(false)
  const [isRecordingOpen, setIsRecordingOpen] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDateEvents, setSelectedDateEvents] = useState<MasterclassForUI[] | null>(null)
  const calendarMasterclasses = [
    ...thisWeekMasterclasses,
    ...upcomingMasterclasses,
    ...pastMasterclasses,
  ].filter((m) => m.scheduledAt != null) as (MasterclassForUI & { scheduledAt: string })[]

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days: { date: Date; isCurrentMonth: boolean }[] = []
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    return days
  }

  const getEventsForDate = (date: Date) =>
    calendarMasterclasses.filter((m) => {
      const d = new Date(m.scheduledAt)
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      )
    })

  const formatEventTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

  const formatMonthYear = (date: Date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const goToPreviousMonth = () =>
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))

  const goToNextMonth = () =>
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const handleOpenMasterclass = (m: MasterclassForUI) => {
    setSelectedMasterclass(m)
    setCalendarModalOpen(false)
  }

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editTopics, setEditTopics] = useState("")
  const [editWhoItsFor, setEditWhoItsFor] = useState("")
  const [editVideoUrl, setEditVideoUrl] = useState("")
  const [editImagePath, setEditImagePath] = useState<string | null>(null)
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [scheduleTitle, setScheduleTitle] = useState("")
  const [scheduleDescription, setScheduleDescription] = useState("")
  const [scheduleTopics, setScheduleTopics] = useState("")
  const [scheduleWhoItsFor, setScheduleWhoItsFor] = useState("")
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [scheduleDuration, setScheduleDuration] = useState(60)
  const [scheduleVideoUrl, setScheduleVideoUrl] = useState("")
  const [scheduleImagePath, setScheduleImagePath] = useState<string | null>(null)
  const [scheduleImageUploading, setScheduleImageUploading] = useState(false)

  const [brandAccentColor, setBrandAccentColor] = useState("#2563eb")
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (supabase) {
      supabase
        .from("site_settings")
        .select("brand_accent_color")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.brand_accent_color) setBrandAccentColor(data.brand_accent_color)
        })
    }
  }, [])

  const goPrev = () =>
    setHeroIndex((i) => (i - 1 + featuredMasterclasses.length) % Math.max(1, featuredMasterclasses.length))
  const goNext = () =>
    setHeroIndex((i) => (i + 1) % Math.max(1, featuredMasterclasses.length))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
            {pageDescription && <p className="text-gray-600">{pageDescription}</p>}
          </div>
          {canCreateMasterclass && (
            <div className="flex flex-col items-end shrink-0">
              <Button
                onClick={() => setScheduleModalOpen(true)}
                disabled={remainingMasterclasses === 0}
                className="text-white hover:brightness-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: remainingMasterclasses > 0 ? brandAccentColor : undefined }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule a Masterclass
              </Button>
              {remainingMasterclasses > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  You have {remainingMasterclasses} masterclass
                  {remainingMasterclasses !== 1 ? "es" : ""} remaining.
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-1">
                  You have hit your limit.{" "}
                  <Link href="/members/support" className="underline">
                    Contact Support
                  </Link>{" "}
                  to inquire to purchase more.
                </p>
              )}
            </div>
          )}
        </div>
        {/* Featured Hero Carousel */}
        <div className="mb-8">
          {featuredMasterclasses.length > 0 && (
            <div className="relative w-full rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] min-h-[180px] sm:min-h-[200px]">
              {featuredMasterclasses.map((mc, idx) => (
                <div
                  key={mc.id}
                  className={`absolute inset-0 cursor-pointer transition-opacity duration-300 ${
                    idx === heroIndex ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
                  }`}
                  onClick={() => setSelectedMasterclass(mc)}
                >
                  <Image
                    src={mc.image}
                    alt={mc.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <span className={getBadgeStyles("featured")}>Featured</span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-2 drop-shadow-sm">
                        {mc.title}
                      </h2>
                      <p className="text-white/90 text-sm md:text-base mt-1">
                        {mc.hostName} · {mc.date} at {mc.time}
                      </p>
                    </div>
                    <Button
                      className="w-fit shrink-0 text-white hover:brightness-90 text-sm sm:text-base"
                      style={{ backgroundColor: brandAccentColor }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMasterclass(mc)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                aria-label="Previous"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center shadow-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center shadow-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between sm:justify-end gap-3 mb-6">
          <Button
            className="text-white hover:brightness-90"
            style={{ backgroundColor: brandAccentColor }}
            onClick={() => setCalendarModalOpen(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            View Masterclass Calendar
          </Button>
        </div>

        {/* LIVE NOW Section */}
        {liveMasterclass && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">Live Now</h2>
            <div
              className="bg-white rounded-xl shadow-md border-2 border-red-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedMasterclass(liveMasterclass)}
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-80 flex-shrink-0 aspect-video sm:aspect-[4/3] relative bg-gray-100">
                  <Image
                    src={liveMasterclass.image}
                    alt={liveMasterclass.title}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={getBadgeStyles("live")}>Live</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{liveMasterclass.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={liveMasterclass.hostAvatar} alt={liveMasterclass.hostName} />
                          <AvatarFallback className="text-sm bg-slate-200 text-slate-700">
                            {getInitials(liveMasterclass.hostName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-600 text-sm">{liveMasterclass.hostName}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500 text-sm">{liveMasterclass.time}</span>
                      </div>
                      <Link
                        href={`/members/masterclasses/live/${liveMasterclass.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔴 Live Now
                      </Link>
                    </div>
                  </div>
                  {liveMasterclass.description && (
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-4">
                      {liveMasterclass.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {sponsoredMasterclass && (
          <div className="mb-8">
            <SponsoredMasterclassCard
              masterclass={sponsoredMasterclass}
              brandAccentColor={brandAccentColor}
              attendeeCount={getAttendeeCount(sponsoredMasterclass.id)}
              onSelect={setSelectedMasterclass}
              getBadgeStyles={getBadgeStyles}
              getInitials={getInitials}
            />
          </div>
        )}

        {/* This Week Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
          <MasterclassCarousel itemsCount={thisWeekMasterclasses.length}>
            {thisWeekMasterclasses.map((mc) => (
              <div
                key={mc.id}
                className="flex-none w-[260px] sm:w-[300px] lg:w-[360px]"
              >
                <MasterclassCard
                  masterclass={mc}
                  badge={mc.badge}
                  brandAccentColor={brandAccentColor}
                  attendeeCount={getAttendeeCount(mc.id)}
                  onSelect={setSelectedMasterclass}
                  getBadgeStyles={getBadgeStyles}
                  getInitials={getInitials}
                />
              </div>
            ))}
          </MasterclassCarousel>
        </section>

        {upcomingMasterclasses.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Upcoming Masterclasses</h2>
            <div className="mt-8">
              <MasterclassCarousel itemsCount={upcomingMasterclasses.length}>
                {upcomingMasterclasses.map((mc) => (
                  <div
                    key={mc.id}
                    className="flex-none w-[260px] sm:w-[300px] lg:w-[360px]"
                  >
                    <MasterclassCard
                      masterclass={mc}
                      badge={mc.badge}
                      brandAccentColor={brandAccentColor}
                      attendeeCount={getAttendeeCount(mc.id)}
                      onSelect={setSelectedMasterclass}
                      getBadgeStyles={getBadgeStyles}
                      getInitials={getInitials}
                    />
                  </div>
                ))}
              </MasterclassCarousel>
            </div>
            {upcomingMasterclasses.length > 6 && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  className="px-6 py-3 rounded-md text-white hover:brightness-90"
                  style={{ backgroundColor: brandAccentColor }}
                >
                  See More Masterclasses
                </button>
              </div>
            )}
          </section>
        )}

        {pastMasterclasses.length > 0 && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => setIsPastOpen(true)}
              className="px-8 py-3 rounded-md text-white hover:brightness-90"
              style={{ backgroundColor: brandAccentColor }}
            >
              Access Past Masterclasses
            </button>
          </div>
        )}
      </div>

      {/* Masterclass Detail Modal */}
      <Dialog open={!!selectedMasterclass} onOpenChange={(open) => !open && setSelectedMasterclass(null)}>
        <DialogContent
          className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxWidth: "72rem" }}
        >
          {selectedMasterclass && (
            <div className="flex-1 overflow-y-auto">
              <div className="relative w-full max-h-[300px] overflow-hidden rounded-t-lg bg-gray-100">
                <div className="relative w-full h-[280px] md:h-[300px] flex items-center justify-center">
                  <Image
                    src={selectedMasterclass.image}
                    alt={selectedMasterclass.title}
                    fill
                    className="object-cover object-center"
                    sizes="72rem"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
                </div>
                {selectedMasterclass.isOwner && (
                  <button
                    type="button"
                    aria-label="Edit masterclass"
                    className="absolute top-4 right-14 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center shadow-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditTitle(selectedMasterclass.title)
                      setEditDescription(selectedMasterclass.description)
                      setEditTopics(selectedMasterclass.topics.join("\n"))
                      setEditWhoItsFor(selectedMasterclass.whoItsFor ?? "")
                      setEditVideoUrl(selectedMasterclass.videoUrl ?? "")
                      setEditImagePath(selectedMasterclass.imagePath)
                      setEditError(null)
                      setEditModalOpen(true)
                    }}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white drop-shadow-sm">
                    {selectedMasterclass.title}
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedMasterclass.hostAvatar} alt={selectedMasterclass.hostName} />
                        <AvatarFallback className="bg-slate-200 text-slate-700">
                          {getInitials(selectedMasterclass.hostName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{selectedMasterclass.hostName}</p>
                        {selectedMasterclass.scheduledAt ? (
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-semibold text-gray-900">
                              {format(new Date(selectedMasterclass.scheduledAt), "EEE, MMM d")}
                            </span>
                            {" · "}
                            {formatDualTimezone(selectedMasterclass.scheduledAt)}
                            {" · "}
                            {selectedMasterclass.duration}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            {selectedMasterclass.date} · {selectedMasterclass.time}
                            {selectedMasterclass.duration ? ` · ${selectedMasterclass.duration}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedMasterclass.status === "upcoming" && selectedMasterclass.canAccess && (
                      <div className="text-sm text-gray-500 mt-1">
                        {getAttendeeCount(selectedMasterclass.id) > 0
                          ? `${getAttendeeCount(selectedMasterclass.id)} people planning to attend`
                          : "Be the first to reserve"}
                      </div>
                    )}
                  </div>
                  {selectedMasterclass.status === "upcoming" && selectedMasterclass.canAccess && (
                    <div className="flex items-center gap-2">
                      {!selectedMasterclass.isReservedByUser ? (
                        <button
                          type="button"
                            onClick={async () => {
                            const res = await reserveMasterclass(selectedMasterclass.id)
                            if (res.success) {
                              const newCount = getAttendeeCount(selectedMasterclass.id) + 1
                              setLocalCountOverrides((prev) => ({
                                ...prev,
                                [selectedMasterclass.id]: newCount,
                              }))
                              setSelectedMasterclass((prev) =>
                                prev
                                  ? { ...prev, isReservedByUser: true, planningToAttend: newCount }
                                  : null
                              )
                              router.refresh()
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                          Reserve My Spot
                        </button>
                      ) : (
                        <>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                            Reserved ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedMasterclass.scheduledAt) return
                              const start = new Date(selectedMasterclass.scheduledAt)
                              const mins = selectedMasterclass.duration ? parseInt(selectedMasterclass.duration, 10) || 60 : 60
                              const end = new Date(start.getTime() + mins * 60 * 1000)
                              const fmt = (d: Date) =>
                                d.toISOString().replace(/-/g, "").replace(/:/g, "").replace(/\.\d{3}/g, "")
                              const params = new URLSearchParams({
                                action: "TEMPLATE",
                                text: selectedMasterclass.title,
                                dates: `${fmt(start)}/${fmt(end)}`,
                                details: selectedMasterclass.description || "",
                              })
                              window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank")
                            }}
                            className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition"
                          >
                            Add to Calendar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {selectedMasterclass.videoUrl &&
                  selectedMasterclass.status === "past" &&
                  selectedMasterclass.canAccess && (
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      onClick={() => setIsRecordingOpen(true)}
                      className="px-6 py-3 rounded-md text-white hover:brightness-90"
                      style={{ backgroundColor: brandAccentColor }}
                    >
                      Watch Recording
                    </button>
                  </div>
                )}

                {selectedMasterclass.videoUrl &&
                  getEmbedUrl(selectedMasterclass.videoUrl) &&
                  selectedMasterclass.status !== "past" && (
                    <div className="flex justify-center">
                      <div className="w-full max-w-xl aspect-video overflow-hidden rounded-lg shadow-md bg-gray-100">
                        <iframe
                          src={getEmbedUrl(selectedMasterclass.videoUrl)!}
                          title="Session Video"
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-base text-gray-700 leading-relaxed">{selectedMasterclass.description}</p>
                </div>

                {selectedMasterclass.topics.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Topics You&apos;ll Learn</h3>
                    <ul className="space-y-2">
                      {selectedMasterclass.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-3">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: brandAccentColor }}
                          />
                          <span className="text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedMasterclass.whoItsFor && (
                  <div className="pt-2">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Who It&apos;s For</h3>
                    <p className="text-base text-gray-700 leading-relaxed">{selectedMasterclass.whoItsFor}</p>
                  </div>
                )}

                {(selectedMasterclass.status === "live" ||
                  (selectedMasterclass.status === "upcoming" && !selectedMasterclass.canAccess) ||
                  (selectedMasterclass.status === "past" && !selectedMasterclass.canAccess)) && (
                  <div className="pt-4 space-y-4">
                    {selectedMasterclass.status === "live" && (
                      <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                        <Play className="w-4 h-4 mr-2" />
                        Enter Room
                      </Button>
                    )}
                    {selectedMasterclass.status === "upcoming" && !selectedMasterclass.canAccess && (
                      <p className="text-sm text-amber-600 font-medium">
                        Upgrade to access this masterclass
                      </p>
                    )}
                    {selectedMasterclass.status === "past" && !selectedMasterclass.canAccess && (
                      <p className="text-sm text-amber-600 font-medium">
                        Upgrade to access this masterclass
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recording Modal */}
      <Dialog open={isRecordingOpen} onOpenChange={setIsRecordingOpen}>
        <DialogContent className="max-w-6xl w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Watch Recording
            </DialogTitle>
          </DialogHeader>

          {selectedMasterclass?.videoUrl && getEmbedUrl(selectedMasterclass.videoUrl) && (
            <div className="mt-4 aspect-video w-full rounded-md overflow-hidden bg-black">
              <iframe
                src={getEmbedUrl(selectedMasterclass.videoUrl)!}
                title="Recording"
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar Modal */}
      <Dialog
        open={calendarModalOpen}
        onOpenChange={setCalendarModalOpen}
      >
        <DialogContent
          className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxWidth: "72rem" }}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Masterclass Calendar</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <p className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
                {formatMonthYear(calendarMonth)}
              </p>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border border-gray-200 p-2 text-xs font-medium text-gray-500 bg-gray-50"
                >
                  {day}
                </div>
              ))}
              {getCalendarDays(calendarMonth).map((dayInfo, index) => {
                const eventsForDay = getEventsForDate(dayInfo.date)
                const visibleEvents = eventsForDay.slice(0, 2)
                const hiddenCount = eventsForDay.length - 2
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[100px] border rounded-lg p-1 flex flex-col ${
                      dayInfo.isCurrentMonth ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"
                    } ${isToday(dayInfo.date) ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <span
                      className={`text-sm font-medium mb-1 px-1 ${
                        dayInfo.isCurrentMonth ? "text-gray-900" : "text-gray-400"
                      } ${isToday(dayInfo.date) ? "text-blue-600" : ""}`}
                    >
                      {dayInfo.date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1 flex-1 min-h-0">
                      {visibleEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => handleOpenMasterclass(event)}
                          className="block w-full text-left text-[11px] sm:text-xs px-1 py-0.5 rounded bg-blue-100 hover:bg-blue-200 truncate"
                        >
                          <span className="truncate block">{event.title}</span>
                          <span className="text-[10px] text-gray-600">{formatEventTime(event.scheduledAt)}</span>
                        </button>
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedDateEvents(eventsForDay)}
                          className="text-xs text-blue-600 px-1 hover:underline"
                        >
                          +{hiddenCount} more
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedDateEvents &&
        selectedDateEvents.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md pointer-events-auto">
              <h3 className="text-lg font-semibold mb-4">
                Events on {format(new Date(selectedDateEvents[0].scheduledAt!), "MMMM d, yyyy")}
              </h3>

              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedDateEvents(null)
                      handleOpenMasterclass(event)
                    }}
                    className="block w-full text-left px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                  >
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.scheduledAt!), "h:mm a")}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedDateEvents(null)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Schedule Masterclass Modal */}
      <Dialog
        open={scheduleModalOpen}
        onOpenChange={(open) => {
          setScheduleModalOpen(open)
          if (!open) {
            setScheduleTitle("")
            setScheduleDescription("")
            setScheduleTopics("")
            setScheduleWhoItsFor("")
            setScheduleDate("")
            setScheduleTime("")
            setScheduleDuration(60)
            setScheduleVideoUrl("")
            setScheduleImagePath(null)
          }
        }}
      >
        <DialogContent
          className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxWidth: "72rem" }}
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Schedule a Masterclass</h2>
            <p className="text-sm text-gray-500 mt-1">
              Submit your masterclass for admin approval.
            </p>
          </div>
          <form
            className="flex-1 overflow-y-auto"
            onSubmit={async (e) => {
              e.preventDefault()
              const topics = scheduleTopics
                .split("\n")
                .map((t) => t.trim())
                .filter(Boolean)
              if (!scheduleDate || !scheduleTime) {
                alert("Please enter date and time.")
                return
              }
              const scheduledAtISO = `${scheduleDate}T${scheduleTime}:00`
              const result = await createMasterclass({
                title: scheduleTitle,
                description: scheduleDescription || null,
                topics: topics.length > 0 ? topics : null,
                who_its_for: scheduleWhoItsFor || null,
                scheduled_at: scheduledAtISO,
                duration_minutes: scheduleDuration,
                image_path: scheduleImagePath,
                video_url: scheduleVideoUrl || null,
              })
              if (!result.success) {
                alert(result.error)
                return
              }
              setScheduleModalOpen(false)
              router.refresh()
            }}
          >
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <Label htmlFor="schedule-image" className="text-sm font-medium text-gray-700">
                  Masterclass Image
                </Label>
                {scheduleImagePath && (() => {
                  const supabase = getSupabaseBrowserClient()
                  const previewUrl = supabase
                    ? supabase.storage.from("masterclasses").getPublicUrl(scheduleImagePath).data.publicUrl
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/masterclasses/${scheduleImagePath}`
                  return (
                    <div className="mt-3 relative w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        Uploaded ✓
                      </div>
                    </div>
                  )
                })()}
                <input
                  id="schedule-image"
                  type="file"
                  accept="image/*"
                  disabled={scheduleImageUploading}
                  className="mt-1.5 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setScheduleImageUploading(true)
                    try {
                      const supabase = getSupabaseBrowserClient()
                      if (!supabase) throw new Error("Supabase not available")
                      const path = `pending/${Date.now()}_${file.name}`
                      const { error } = await supabase.storage
                        .from("masterclasses")
                        .upload(path, file, { upsert: true, contentType: file.type })
                      if (error) throw error
                      setScheduleImagePath(path)
                    } catch (err) {
                      console.error(err)
                      alert("Failed to upload image")
                    } finally {
                      setScheduleImageUploading(false)
                      e.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a 16:9 image. This image will be used in listings and header.
                </p>
              </div>
              <div>
                <Label htmlFor="schedule-title" className="text-sm font-medium text-gray-700">
                  Title
                </Label>
                <Input
                  id="schedule-title"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="Masterclass title"
                  className="mt-1.5 w-full"
                />
              </div>
              <div>
                <Label htmlFor="schedule-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="schedule-description"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="Describe what participants will learn"
                  rows={4}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div>
                <Label htmlFor="schedule-topics" className="text-sm font-medium text-gray-700">
                  Topics
                </Label>
                <Textarea
                  id="schedule-topics"
                  value={scheduleTopics}
                  onChange={(e) => setScheduleTopics(e.target.value)}
                  placeholder="One topic per line"
                  rows={4}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div>
                <Label htmlFor="schedule-who" className="text-sm font-medium text-gray-700">
                  Who It&apos;s For
                </Label>
                <Textarea
                  id="schedule-who"
                  value={scheduleWhoItsFor}
                  onChange={(e) => setScheduleWhoItsFor(e.target.value)}
                  placeholder="Describe your target audience"
                  rows={3}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="schedule-date" className="text-sm font-medium text-gray-700">
                    Date
                  </Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="mt-1.5 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-time" className="text-sm font-medium text-gray-700">
                    Time
                  </Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="mt-1.5 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-duration" className="text-sm font-medium text-gray-700">
                    Duration (minutes)
                  </Label>
                  <select
                    id="schedule-duration"
                    value={scheduleDuration}
                    onChange={(e) => setScheduleDuration(Number(e.target.value))}
                    className="mt-1.5 w-full h-9 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="schedule-video" className="text-sm font-medium text-gray-700">
                  Video URL (Optional)
                </Label>
                <Input
                  id="schedule-video"
                  type="url"
                  value={scheduleVideoUrl}
                  onChange={(e) => setScheduleVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/... or https://vimeo.com/..."
                  className="mt-1.5 w-full"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-4">
                All masterclasses require admin approval before going live.
              </p>
              <Button type="submit">Submit for Approval</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Masterclass Modal */}
      <Dialog
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open)
          if (!open) setEditError(null)
        }}
      >
        <DialogContent
          className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 max-h-[90vh] overflow-hidden flex flex-col"
          style={{ maxWidth: "72rem" }}
        >
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Masterclass</h2>
            <p className="text-sm text-gray-500 mt-1">
              Update your masterclass content. Date, time, and duration cannot be changed here.
            </p>
          </div>
          <form
            className="flex-1 overflow-y-auto"
            onSubmit={(e) => {
              e.preventDefault()
              if (!selectedMasterclass) return
              setEditError(null)
              startTransition(async () => {
                const topicsArr = editTopics
                  .split("\n")
                  .map((t) => t.trim())
                  .filter(Boolean)
                const result = await updateMasterclass({
                  id: selectedMasterclass.id,
                  title: editTitle.trim(),
                  description: editDescription.trim() || null,
                  topics: topicsArr.length > 0 ? topicsArr : null,
                  who_its_for: editWhoItsFor.trim() || null,
                  video_url: editVideoUrl.trim() || null,
                  image_path: editImagePath,
                })
                if (result.success) {
                  setEditModalOpen(false)
                  setSelectedMasterclass(null)
                  router.refresh()
                } else {
                  setEditError(result.error ?? "Failed to save changes")
                }
              })
            }}
          >
            <div className="p-4 sm:p-6 space-y-4">
              {editError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">
                  {editError}
                </p>
              )}
              <div>
                <Label htmlFor="edit-image" className="text-sm font-medium text-gray-700">
                  Masterclass Image
                </Label>
                {editImagePath && (() => {
                  const supabase = getSupabaseBrowserClient()
                  const previewUrl = supabase
                    ? supabase.storage.from("masterclasses").getPublicUrl(editImagePath).data.publicUrl
                    : `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/masterclasses/${editImagePath}`
                  return (
                    <div className="mt-1.5 mb-2 max-w-[400px] rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shadow-sm">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={previewUrl}
                          alt="Masterclass preview"
                          fill
                          className="object-cover"
                          sizes="400px"
                        />
                        <span className="absolute top-2 left-2 rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                          Uploaded ✓
                        </span>
                      </div>
                    </div>
                  )
                })()}
                <input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  disabled={editImageUploading}
                  className="mt-1.5 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !selectedMasterclass) return
                    setEditImageUploading(true)
                    try {
                      const supabase = getSupabaseBrowserClient()
                      if (!supabase) throw new Error("Supabase not available")
                      const path = `${selectedMasterclass.id}/${file.name}`
                      const { error } = await supabase.storage
                        .from("masterclasses")
                        .upload(path, file, { upsert: true, contentType: file.type })
                      if (error) throw error
                      setEditImagePath(path)
                    } catch (err) {
                      console.error(err)
                      setEditError("Failed to upload image")
                    } finally {
                      setEditImageUploading(false)
                      e.target.value = ""
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a 16:9 image. This image will be used in listings and header.
                </p>
              </div>
              <div>
                <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Masterclass title"
                  className="mt-1.5 w-full"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe what participants will learn"
                  rows={4}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-topics" className="text-sm font-medium text-gray-700">
                  Topics
                </Label>
                <Textarea
                  id="edit-topics"
                  value={editTopics}
                  onChange={(e) => setEditTopics(e.target.value)}
                  placeholder="One topic per line"
                  rows={4}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-who" className="text-sm font-medium text-gray-700">
                  Who It&apos;s For
                </Label>
                <Textarea
                  id="edit-who"
                  value={editWhoItsFor}
                  onChange={(e) => setEditWhoItsFor(e.target.value)}
                  placeholder="Describe your target audience"
                  rows={3}
                  className="mt-1.5 w-full resize-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-video" className="text-sm font-medium text-gray-700">
                  Video URL (Optional)
                </Label>
                <Input
                  id="edit-video"
                  type="url"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/... or https://vimeo.com/..."
                  className="mt-1.5 w-full"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Past Masterclasses Modal */}
      <Dialog open={isPastOpen} onOpenChange={setIsPastOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              Past Masterclasses
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {pastMasterclasses.map((mc) => (
              <div
                key={mc.id}
                className="flex flex-col sm:flex-row gap-4 items-start border-b pb-4"
              >
                {/* Image */}
                <div className="relative w-28 sm:w-32 aspect-video rounded-md overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={mc.image}
                    alt={mc.title}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">{mc.title}</h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarImage src={mc.hostAvatar} alt={mc.hostName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(mc.hostName)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{mc.hostName}</span>
                  </div>

                  {mc.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {mc.description}
                    </p>
                  )}
                </div>

                {/* View Details */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMasterclass(mc)
                    setIsPastOpen(false)
                  }}
                  className="px-4 py-2 rounded-md text-white hover:brightness-90 shrink-0"
                  style={{ backgroundColor: brandAccentColor }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
