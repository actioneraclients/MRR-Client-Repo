"use client"

import { useState, useEffect, startTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Plus, ChevronDown, X, Calendar, Clock, DollarSign, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { CommunityEventListItem, CommunityEventDetails } from "./actions"
import {
  getCommunityEventById,
  createCommunityEvent,
  uploadEventImage,
  updateCommunityEvent,
  deleteCommunityEvent,
} from "./actions"
import { UpgradeRequiredModal } from "../groups/upgrade-required-modal"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ")
}

function getEventTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    Virtual: "bg-emerald-600",
    "In-Person": "bg-purple-600",
    Webinar: "bg-blue-600",
    Summit: "bg-amber-600",
    Workshop: "bg-green-600",
    Networking: "bg-indigo-600",
    Panel: "bg-rose-600",
    Bootcamp: "bg-orange-600",
  }
  return colors[type] || "bg-gray-600"
}

function formatEventDate(startDate: string, endDate: string | null): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (endDate) {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`
  }
  return formatDate(startDate)
}

function EventCard({
  event,
  onMoreDetails,
  currentUserId,
  onEdit,
  onDelete,
}: {
  event: CommunityEventListItem
  onMoreDetails: (eventId: string) => void
  currentUserId: string | null
  onEdit: (event: CommunityEventListItem) => void
  onDelete: (event: CommunityEventListItem) => void
}) {
  const dateDisplay = formatEventDate(event.startDate, event.endDate)
  const isOwner = currentUserId !== null && event.createdBy === currentUserId

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1">
      <div className="w-full h-[120px] sm:h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          className="w-full h-full object-cover object-center"
          src={event.headerImageUrl || "/placeholder.svg?height=400&width=1200&query=event"}
          alt={event.title}
          width={1200}
          height={400}
        />
        <div className="absolute top-3 left-3">
          <span
            className={`${getEventTypeBadgeColor(event.eventType)} text-white px-3 py-1 rounded-full text-xs font-medium`}
          >
            {event.eventType}
          </span>
        </div>

        {isOwner && (
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(event)}>Edit Event</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(event)} className="text-red-600">
                  Delete Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {dateDisplay} • {event.timeLabel}
          </span>
        </div>

        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{event.title}</h3>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{event.shortDescription}</p>

        {event.creatorName && (
          <div className="flex items-center gap-3 mt-auto pt-3">
            <Image
              src={event.creatorAvatarUrl || "/placeholder.svg?height=32&width=32&query=avatar"}
              alt={event.creatorName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-900">{event.creatorName}</span>
          </div>
        )}

        <div className="pt-3">
          <Button onClick={() => onMoreDetails(event.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            More Details
          </Button>
        </div>
      </div>
    </div>
  )
}

function CreateEventModal({
  open,
  onClose,
  event,
}: {
  open: boolean
  onClose: () => void
  event?: CommunityEventListItem | null
}) {
  const [title, setTitle] = useState("")
  const [eventType, setEventType] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [timeLabel, setTimeLabel] = useState("")
  const [cost, setCost] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [fullDescription, setFullDescription] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [agendaItems, setAgendaItems] = useState<string[]>([])
  const [agendaInput, setAgendaInput] = useState("")
  const [benefitItems, setBenefitItems] = useState<string[]>([])
  const [benefitInput, setBenefitInput] = useState("")
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)

  const isEditMode = !!event

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setEventType(event.eventType)
      setStartDate(event.startDate ? event.startDate.split("T")[0] : "")
      setEndDate(event.endDate ? event.endDate.split("T")[0] : "")
      setTimeLabel(event.timeLabel)
      setCost(event.costLabel || "")
      setShortDescription(event.shortDescription)
      setHeaderImageUrl(event.headerImageUrl)

      setIsLoadingEditData(true)
      getCommunityEventById(event.id)
        .then((details) => {
          if (details) {
            setFullDescription(details.fullDescription || "")
            setEventUrl(details.eventUrl || "")
            setAgendaItems(details.agenda || [])
            setBenefitItems(details.benefits || [])
          }
        })
        .finally(() => {
          setIsLoadingEditData(false)
        })
    } else {
      setTitle("")
      setEventType("")
      setStartDate("")
      setEndDate("")
      setTimeLabel("")
      setCost("")
      setShortDescription("")
      setFullDescription("")
      setEventUrl("")
      setAgendaItems([])
      setBenefitItems([])
      setHeaderImageUrl(null)
    }
  }, [event])

  const handleFormAction = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && event) {
        await updateCommunityEvent({
          id: formData.get("id") as string,
          title: formData.get("title") as string,
          event_type: formData.get("event_type") as string,
          start_date: formData.get("start_date") as string,
          end_date: (formData.get("end_date") as string) || null,
          time_label: formData.get("time_label") as string,
          cost_label: (formData.get("cost_label") as string) || null,
          short_description: formData.get("short_description") as string,
          full_description: (formData.get("full_description") as string) || null,
          event_url: formData.get("event_url") as string,
          agenda: JSON.parse(formData.get("agenda") as string),
          benefits: JSON.parse(formData.get("benefits") as string),
          header_image_url: (formData.get("header_image_url") as string) || null,
        })
      } else {
        await createCommunityEvent({
          title: formData.get("title") as string,
          eventType: formData.get("event_type") as string,
          startDate: formData.get("start_date") as string,
          endDate: (formData.get("end_date") as string) || null,
          timeLabel: formData.get("time_label") as string,
          costLabel: (formData.get("cost_label") as string) || null,
          shortDescription: formData.get("short_description") as string,
          fullDescription: (formData.get("full_description") as string) || null,
          eventUrl: formData.get("event_url") as string,
          agenda: JSON.parse(formData.get("agenda") as string),
          benefits: JSON.parse(formData.get("benefits") as string),
          headerImageUrl: (formData.get("header_image_url") as string) || null,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 flex flex-col min-h-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            startTransition(async () => {
              await handleFormAction(new FormData(e.currentTarget))
              onClose()
            })
          }}
          className="flex flex-col h-full min-h-0"
        >
          {isEditMode && event && <input type="hidden" name="id" value={event.id} />}
          <input type="hidden" name="agenda" value={JSON.stringify(agendaItems)} />
          <input type="hidden" name="benefits" value={JSON.stringify(benefitItems)} />
          <input type="hidden" name="header_image_url" value={headerImageUrl || ""} />

          <div className="shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{isEditMode ? "Edit Event" : "Create Event"}</DialogTitle>
              {isEditMode && isLoadingEditData && <p className="text-sm text-gray-500 mt-1">Loading event details…</p>}
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Networking Meetup"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="event_type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select event type</option>
                    {ALLOWED_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date (optional)</label>
                  <Input
                    name="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Time <span className="text-red-500">*</span>
                </label>
                <Input
                  name="time_label"
                  type="text"
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                  placeholder="e.g. 2:00 PM EST or All Day"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost</label>
                <Input
                  name="cost_label"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. Free, $50, Members Only"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="short_description"
                  rows={2}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Brief description for the event card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
                <textarea
                  name="full_description"
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Detailed description about the event"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Agenda</label>

                <div className="flex gap-2 mb-2">
                  <Input
                    value={agendaInput}
                    onChange={(e) => setAgendaInput(e.target.value)}
                    placeholder="Add agenda item"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!agendaInput.trim()) return
                      setAgendaItems([...agendaItems, agendaInput.trim()])
                      setAgendaInput("")
                    }}
                  >
                    Add
                  </Button>
                </div>

                <ul className="space-y-1">
                  {agendaItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">What You'll Get</label>

                <div className="flex gap-2 mb-2">
                  <Input
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder="Add benefit"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!benefitInput.trim()) return
                      setBenefitItems([...benefitItems, benefitInput.trim()])
                      setBenefitInput("")
                    }}
                  >
                    Add
                  </Button>
                </div>

                <ul className="space-y-1">
                  {benefitItems.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Website URL <span className="text-red-500">*</span>
                </label>
                <Input
                  name="event_url"
                  value={eventUrl}
                  onChange={(e) => setEventUrl(e.target.value)}
                  placeholder="https://example.com/your-event"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    id="event-image-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      setUploadingImage(true)

                      const url = await uploadEventImage(file)
                      setHeaderImageUrl(url)

                      setUploadingImage(false)
                    }}
                  />

                  <label htmlFor="event-image-upload" className="cursor-pointer block">
                    {uploadingImage ? (
                      <p className="text-sm text-gray-500">Uploading image…</p>
                    ) : headerImageUrl ? (
                      <img
                        src={headerImageUrl || "/placeholder.svg"}
                        alt="Event preview"
                        className="mx-auto max-h-40 rounded-md object-cover"
                      />
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Click or drag to upload event image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
              disabled={isSubmitting || isLoadingEditData}
            >
              {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EventDetailsModal({
  event,
  open,
  onClose,
  isLoading,
  currentUserId,
  onEdit,
  onDelete,
}: {
  event: CommunityEventDetails | null
  open: boolean
  onClose: () => void
  isLoading: boolean
  currentUserId: string | null
  onEdit: (event: CommunityEventDetails) => void
  onDelete: (event: CommunityEventDetails) => void
}) {
  if (!open) return null

  const isOwner = event && currentUserId !== null && event.createdBy === currentUserId

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <div className="flex items-center gap-2">
            {isOwner && event && (
              <>
                <button
                  onClick={() => {
                    onEdit(event)
                    onClose()
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Event"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    onDelete(event)
                    onClose()
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Event"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading event details…</p>
        ) : !event ? (
          <p className="text-center text-gray-500 py-12">Event not found</p>
        ) : (
          <>
            <div className="h-48 bg-gray-200 overflow-hidden flex-shrink-0">
              <Image
                src={event.headerImageUrl || "/placeholder.svg?height=300&width=1200&query=event"}
                alt={event.title}
                width={1200}
                height={300}
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

              <div className="flex items-center text-gray-600 mb-3">
                <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                <span className="font-medium">{formatEventDate(event.startDate, event.endDate)}</span>
              </div>

              <div className="flex items-center text-gray-600 mb-3">
                <Clock className="w-5 h-5 mr-3 text-blue-600" />
                <span>{event.timeLabel}</span>
              </div>

              {event.costLabel && (
                <div className="flex items-center text-gray-600 mb-6">
                  <DollarSign className="w-5 h-5 mr-3 text-blue-600" />
                  <span>{event.costLabel}</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{event.fullDescription}</p>
              </div>

              {event.agenda && event.agenda.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Agenda</h3>
                  <ul className="space-y-2">
                    {event.agenda.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {event.benefits && event.benefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What You'll Get</h3>
                  <ul className="space-y-2">
                    {event.benefits.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
              <Button
                onClick={() => window.open(event.eventUrl, "_blank", "noopener,noreferrer")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
              >
                Go to Event Website
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Visit the event website for full details and registration
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const ALLOWED_EVENT_TYPES = [
  "Virtual",
  "In-Person",
  "Webinar",
  "Summit",
  "Workshop",
  "Networking",
  "Panel",
  "Bootcamp",
] as const

type AllowedEventType = (typeof ALLOWED_EVENT_TYPES)[number]

export function EventsPageContent({
  events,
  canCreateEvents,
  currentUserId,
  upgradeLink,
}: {
  events: CommunityEventListItem[]
  canCreateEvents: boolean
  currentUserId: string | null
  upgradeLink?: string | null
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<CommunityEventDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventType, setEventType] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CommunityEventListItem | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<CommunityEventListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pageTitle, setPageTitle] = useState("Community Events")

  useEffect(() => {
    async function fetchPageTitle() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
          .from("site_settings")
          .select("member_navigation")
          .single()

        if (data?.member_navigation) {
          const navItems =
            typeof data.member_navigation === "string" ? JSON.parse(data.member_navigation) : data.member_navigation
          const communityNav = navItems.find((item: { id?: string }) => item.id === "community")

          if (communityNav?.children && Array.isArray(communityNav.children)) {
            const eventsChild = communityNav.children.find((c: { id?: string; label?: string }) => c.id === "community_events")
            if (eventsChild?.label) {
              setPageTitle(eventsChild.label)
            }
          }
        }
      } catch {
        // Keep default title
      }
    }
    fetchPageTitle()
  }, [])

  const openEventModal = async (eventId: string) => {
    setSelectedEventId(eventId)
    setIsLoadingDetails(true)

    try {
      const details = await getCommunityEventById(eventId)
      setEventDetails(details)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedEventId(null)
    setEventDetails(null)
  }

  const selectedEvent = selectedEventId ? (eventDetails ?? null) : null

  const filteredEvents = events.filter((event) => {
    const matchesSearch = searchTerm === "" || event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = eventType === "" || event.eventType.toLowerCase() === eventType.toLowerCase()
    return matchesSearch && matchesType
  })

  const handleEditEvent = (event: CommunityEventListItem) => {
    setEditingEvent(event)
    setCreateModalOpen(true)
  }

  const handleDeleteEvent = (event: CommunityEventListItem) => {
    setDeletingEvent(event)
  }

  const confirmDelete = async () => {
    if (!deletingEvent) return
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteCommunityEvent({ id: deletingEvent.id })
      if (result.success) {
        setDeletingEvent(null)
      } else {
        alert(result.error || "Failed to delete event")
      }
      setIsDeleting(false)
    })
  }

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    setEditingEvent(null)
  }

  const handleEditFromDetails = (event: CommunityEventDetails) => {
    const listItem: CommunityEventListItem = {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      timeLabel: event.timeLabel,
      costLabel: event.costLabel,
      shortDescription: "",
      headerImageUrl: event.headerImageUrl,
      createdBy: event.createdBy,
      creatorName: "",
      creatorAvatarUrl: null,
    }
    setEditingEvent(listItem)
    setCreateModalOpen(true)
  }

  const handleDeleteFromDetails = (event: CommunityEventDetails) => {
    const listItem: CommunityEventListItem = {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      timeLabel: event.timeLabel,
      costLabel: event.costLabel,
      shortDescription: "",
      headerImageUrl: event.headerImageUrl,
      createdBy: event.createdBy,
      creatorName: "",
      creatorAvatarUrl: null,
    }
    setDeletingEvent(listItem)
  }

  return (
    <div className="pb-12">
      <div className="px-4 sm:px-6 lg:px-8">
        <div id="events-header" className="bg-white rounded-2xl p-8 my-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
              <p className="text-gray-600">Join exclusive events, workshops, and networking opportunities</p>
            </div>
            <Button
              onClick={() => {
                if (canCreateEvents) {
                  setCreateModalOpen(true)
                } else {
                  setIsUpgradeModalOpen(true)
                }
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </Button>
          </div>
        </div>

        <div id="events-filters" className="bg-white rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by event name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none bg-white"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {ALLOWED_EVENT_TYPES.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div
            id="events-empty"
            className="bg-white rounded-2xl p-12 mb-8 border border-gray-100 shadow-sm text-center"
          >
            <p className="text-gray-500 text-lg">No events found</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for upcoming community events</p>
          </div>
        ) : (
          <div id="events-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onMoreDetails={openEventModal}
                currentUserId={currentUserId}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>

      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEventId}
        onClose={closeModal}
        isLoading={isLoadingDetails}
        currentUserId={currentUserId}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
      />

      <CreateEventModal open={createModalOpen} onClose={handleCloseCreateModal} event={editingEvent} />

      <UpgradeRequiredModal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        context="events"
        upgradeLink={upgradeLink}
      />

      <Dialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <DialogContent className="max-w-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Delete Event</h2>
          </div>
          <div className="px-6 py-6">
            <p className="text-gray-600">Are you sure you want to delete this event? This action cannot be undone.</p>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingEvent(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
