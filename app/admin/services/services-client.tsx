"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Eye, Power, Star, Sparkles } from "lucide-react"
import {
  getAdminServices,
  getServiceBySlug,
  toggleServiceActive,
  featureService,
  unfeatureService,
  sponsorService,
  unsponsorService,
  type ServiceAdminListItem,
} from "./actions"
import ServiceProfileModal from "@/components/services/ServiceProfileModal"
import type { ServiceProfile } from "@/components/services/ServiceProfileModal"

type Props = {
  initialItems: ServiceAdminListItem[]
}

export default function AdminServicesClient({ initialItems }: Props) {
  const [services, setServices] = useState<ServiceAdminListItem[]>(initialItems)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [viewingService, setViewingService] = useState<ServiceProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const fetchServices = async () => {
    const res = await getAdminServices()
    const items = res?.items ?? []
    setServices((prev) => {
      if (items.length > 0) return items
      if (prev.length > 0) return prev
      return items
    })
  }

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (openDropdown) {
        const currentRef = dropdownRefs.current[openDropdown]
        if (currentRef && !currentRef.contains(target)) {
          setOpenDropdown(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  const toggleDropdown = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === serviceId ? null : serviceId))
  }

  const handleViewService = async (slug: string) => {
    setOpenDropdown(null)
    const profile = await getServiceBySlug(slug)
    if (!profile) return
    setViewingService(profile)
  }

  const handleToggleActive = async (service: ServiceAdminListItem) => {
    setOpenDropdown(null)
    setIsLoading(true)
    const result = await toggleServiceActive({ id: service.id, is_active: !service.is_active })
    if (result.success) await fetchServices()
    setIsLoading(false)
  }

  const getStatusColor = (isActive: boolean) =>
    isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"

  const filteredServices = services.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const name = (s.name ?? "").toLowerCase()
    const slug = (s.slug ?? "").toLowerCase()
    const about = (s.short_description ?? "").toLowerCase()
    const owner = (s.owner_name ?? "").toLowerCase()
    return name.includes(q) || slug.includes(q) || about.includes(q) || owner.includes(q)
  })

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Manage services shown in Product &amp; Services</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {services.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-lg font-medium text-gray-900 mb-2">No services yet</p>
                <p className="text-gray-500">Services will appear here when added.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services or members…"
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search services or members"
                  />
                </div>
                {filteredServices.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
                    <p className="text-gray-500">Try a different search term.</p>
                  </div>
                ) : (
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          About
                        </th>
                        <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                        <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-[15%] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-0">
                          <div className="w-24 flex-shrink-0 mr-3 aspect-video overflow-hidden bg-gray-100 rounded flex items-center justify-center">
                            <img
                              src={service.image_url || "/placeholder.svg?height=72&width=128&query=service"}
                              alt={service.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 flex shrink-0 items-center justify-center">
                                {service.is_sponsored && (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                )}
                              </span>
                              <span className="font-medium text-gray-900 truncate">{service.name}</span>
                            </div>
                            <div className="text-sm text-gray-500 truncate">{service.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-2 min-w-0">
                          {service.short_description?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 truncate min-w-0">
                          {service.owner_name?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            service.is_active,
                          )}`}
                        >
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block" ref={(el) => (dropdownRefs.current[service.id] = el)}>
                          <button
                            onClick={(e) => toggleDropdown(service.id, e)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Open actions"
                            disabled={isLoading}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === service.id && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <span
                                onClick={() => handleViewService(service.slug)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                View Service
                              </span>
                              <span
                                onClick={() => handleToggleActive(service)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4 mr-2 text-gray-400" />
                                {service.is_active ? "Deactivate" : "Activate"}
                              </span>
                              {service.is_featured ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unfeatureService(service.id)
                                    if (result.success) await fetchServices()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                                  Remove Feature
                                </span>
                              ) : (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await featureService(service.id)
                                    if (result.success) await fetchServices()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                                  Feature
                                </span>
                              )}
                              {service.is_sponsored ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unsponsorService(service.id)
                                    if (result.success) await fetchServices()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 mr-2 text-gray-400" />
                                  Remove Sponsor
                                </span>
                              ) : (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await sponsorService(service.id)
                                    if (result.success) await fetchServices()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 mr-2 text-gray-400" />
                                  Sponsor
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {viewingService && (
        <ServiceProfileModal
          service={viewingService}
          onClose={() => setViewingService(null)}
        />
      )}
    </div>
  )
}
