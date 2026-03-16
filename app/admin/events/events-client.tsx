"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Plus, Search, MoreVertical, Eye, Pencil, Trash2, X, LinkIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toggleCommunityEventPublished } from "./actions"

interface Event {
  id: string
  title: string
  short_description: string
  header_image_url: string | null
  organizer: {
    full_name: string
    avatar_url: string | null
    email: string | null
  } | null
  start_date: string
  end_date: string | null
  time_label: string
  event_type: string
  is_published: boolean
  cost_label: string | null
  event_url: string
}

type FilterState = {
  search: string
  eventType: string
  status: string
}

type Props = {
  events: Event[]
  initialFilters?: {
    search?: string
    eventType?: string
    status?: string
  }
}

export default function AdminEventsClient({ events, initialFilters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FilterState>({
    search: initialFilters?.search || "",
    eventType: initialFilters?.eventType || "",
    status: initialFilters?.status || "",
  })

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) return
      const target = event.target as Node
      const currentRef = dropdownRefs.current[openDropdown]
      if (currentRef && !currentRef.contains(target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  const toggleDropdown = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === eventId ? null : eventId))
  }

  const openModal = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
    setOpenDropdown(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  const isEventExpired = (startDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(startDate)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate < today
  }

  const getStatusColor = (is_published: boolean, startDate: string) => {
    if (isEventExpired(startDate)) {
      return "bg-gray-100 text-gray-800"
    }
    return is_published ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  const getStatusText = (is_published: boolean, startDate: string) => {
    if (isEventExpired(startDate)) {
      return "Expired"
    }
    return is_published ? "Published" : "Unpublished"
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Summit: "bg-purple-100 text-purple-800",
      Workshop: "bg-blue-100 text-blue-800",
      Webinar: "bg-emerald-100 text-emerald-800",
      Launch: "bg-amber-100 text-amber-800",
      Networking: "bg-indigo-100 text-indigo-800",
      "In-Person": "bg-pink-100 text-pink-800",
      Virtual: "bg-sky-100 text-sky-800",
      Hybrid: "bg-teal-100 text-teal-800",
      Other: "bg-gray-100 text-gray-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    const params = new URLSearchParams()
    if (updated.search) params.set("search", updated.search)
    if (updated.eventType) params.set("eventType", updated.eventType)
    if (updated.status) params.set("status", updated.status)

    router.push(`/admin/events?${params.toString()}`)
  }

  const handleTogglePublish = async (eventId: string, currentlyPublished: boolean) => {
    const result = await toggleCommunityEventPublished(eventId, !currentlyPublished)
    if (result.success) {
      router.refresh()
    }
    setOpenDropdown(null)
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Community Events</h1>
              <p className="text-gray-600 mt-1">Manage events created by members or add your own community events</p>
            </div>
            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        <section className="mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Events</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by event name..."
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => updateFilters({ eventType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Virtual">Virtual</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Summit">Summit</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Podcast">Podcast</option>
                  <option value="Networking">Networking</option>
                  <option value="Retreat">Retreat</option>
                  <option value="Challenge">Challenge</option>
                  <option value="Launch">Launch</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offered By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={event.header_image_url || "/placeholder.svg?height=48&width=48"}
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.short_description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={event.organizer?.avatar_url || "/placeholder.svg?height=32&width=32"}
                          alt={event.organizer?.full_name || "Unknown"}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div className="font-medium text-gray-900">{event.organizer?.full_name || "Unknown"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      <div className="text-sm">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-500">{event.time_label}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          event.event_type,
                        )}`}
                      >
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          event.is_published,
                          event.start_date,
                        )}`}
                      >
                        {getStatusText(event.is_published, event.start_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative inline-block" ref={(el) => (dropdownRefs.current[event.id] = el)}>
                        <button
                          onClick={(e) => toggleDropdown(event.id, e)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          aria-label="Open actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openDropdown === event.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <span
                              onClick={() => openModal(event)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2 text-gray-400" />
                              View Event
                            </span>
                            {!isEventExpired(event.start_date) && (
                              <span
                                onClick={() => handleTogglePublish(event.id, event.is_published)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                                {event.is_published ? "Unpublish Event" : "Publish Event"}
                              </span>
                            )}
                            <span className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                              Delete Event
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isModalOpen && selectedEvent && (
        <>
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {selectedEvent.header_image_url && (
                <img
                  src={selectedEvent.header_image_url || "/placeholder.svg"}
                  alt="Event Header"
                  className="w-full h-56 object-cover rounded-t-2xl"
                />
              )}

              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEvent.title}</h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        selectedEvent.event_type,
                      )}`}
                    >
                      {selectedEvent.event_type}
                    </span>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 ml-4" aria-label="Close">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                    <p className="text-gray-900">{selectedEvent.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        selectedEvent.event_type,
                      )}`}
                    >
                      {selectedEvent.event_type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Offered By</label>
                    <div className="flex items-center">
                      <img
                        src={selectedEvent.organizer?.avatar_url || "/placeholder.svg?height=32&width=32"}
                        alt={selectedEvent.organizer?.full_name || "Unknown"}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedEvent.organizer?.full_name || "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <p className="text-gray-900">
                      {new Date(selectedEvent.start_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <p className="text-gray-900">
                      {selectedEvent.end_date
                        ? new Date(selectedEvent.end_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <p className="text-gray-900">{selectedEvent.time_label}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
                    <p className="text-gray-900">{selectedEvent.cost_label || "Not specified"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event URL</label>
                    {selectedEvent.event_url ? (
                      <a
                        href={selectedEvent.event_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {selectedEvent.event_url}
                      </a>
                    ) : (
                      <p className="text-gray-500 text-sm">Not specified</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                  <p className="text-gray-700 leading-relaxed">{selectedEvent.short_description}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Event</h2>
                <button
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <p>Event creation form coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
