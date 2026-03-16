"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Eye, Pencil, Power, X, ChevronDown, Check, Star, Sparkles } from "lucide-react"
import {
  createBusiness,
  updateBusiness,
  toggleBusinessActive,
  featureBusiness,
  unfeatureBusiness,
  sponsorBusiness,
  unsponsorBusiness,
  getAdminBusinesses,
  getBusinessProfileBySlug,
  type BusinessTagOption,
} from "./actions"
import BusinessProfileModal from "@/components/businesses/BusinessProfileModal"
import type { BusinessProfile } from "@/components/businesses/BusinessProfileModal"

interface Business {
  id: string
  slug: string
  name: string
  avatar_url: string | null
  business_tags: string[]
  status: "active" | "inactive"
  created_at: string
  is_featured: boolean
  is_sponsored: boolean
  short_description?: string | null
  owner_name?: string | null
}

type ModalMode = "add" | "edit" | null

interface FormData {
  name: string
  logoUrl: string
}

const emptyFormData: FormData = {
  name: "",
  logoUrl: "",
}

type Props = {
  initialItems: Business[]
  businessTags: BusinessTagOption[]
}

export default function AdminBusinessesClient({ initialItems, businessTags }: Props) {
  const [businesses, setBusinesses] = useState<Business[]>(initialItems)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading] = useState(false)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [addFormData, setAddFormData] = useState<FormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<FormData>(emptyFormData)

  const [viewingBusiness, setViewingBusiness] = useState<BusinessProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const tagDropdownRef = useRef<HTMLDivElement | null>(null)

  const fetchBusinesses = async () => {
    const res = await getAdminBusinesses()
    console.log("[AdminBusinessesClient] getAdminBusinesses res:", res)
    const items = res?.items ?? []
    const mapped: Business[] = items.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      avatar_url: row.logo_url ?? null,
      business_tags: row.business_tags ?? [],
      status: row.is_active ? "active" : "inactive",
      created_at: row.created_at ?? "",
      is_featured: row.is_featured ?? false,
      is_sponsored: row.is_sponsored ?? false,
      short_description: (row as { short_description?: string | null }).short_description ?? null,
      owner_name: (row as { owner_name?: string | null }).owner_name ?? null,
    }))
    setBusinesses((prev) => {
      if (mapped.length > 0) return mapped
      if (prev.length > 0) return prev
      return mapped
    })
  }

  useEffect(() => {
    fetchBusinesses()
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
      if (isTagDropdownOpen && tagDropdownRef.current && !tagDropdownRef.current.contains(target)) {
        setIsTagDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown, isTagDropdownOpen])

  const toggleDropdown = (businessId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === businessId ? null : businessId))
  }

  const openAddModal = () => {
    setModalMode("add")
    setSelectedTags([])
    setSubmitError(null)
    setAddFormData(emptyFormData)
  }

  const openEditModal = (business: Business) => {
    setModalMode("edit")
    setSelectedBusiness(business)
    setSelectedTags(business.business_tags || [])
    setSubmitError(null)
    setEditFormData({
      name: business.name,
      logoUrl: business.avatar_url || "",
    })
    setOpenDropdown(null)
  }

  const handleViewBusinessProfile = async (slug: string) => {
    setOpenDropdown(null)
    const profile = await getBusinessProfileBySlug(slug)
    if (!profile) return
    setViewingBusiness(profile)
  }

  const handleToggleStatus = async (business: Business) => {
    setOpenDropdown(null)
    setIsLoading(true)
    const newStatus = business.status !== "active"
    const result = await toggleBusinessActive({ id: business.id, is_active: newStatus })
    if (result.success) await fetchBusinesses()
    setIsLoading(false)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedBusiness(null)
    setSelectedTags([])
    setSubmitError(null)
  }

  const handleAddFormChange = (field: keyof FormData, value: string) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditFormChange = (field: keyof FormData, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]))
  }

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "business"

  const handleSubmit = async () => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (modalMode === "add") {
        const result = await createBusiness({
          slug: slugFromName(addFormData.name),
          name: addFormData.name,
          logo_url: addFormData.logoUrl || null,
          business_tags: selectedTags,
        })
        if (!result.success) {
          setSubmitError(result.error || "Failed to create business")
          setIsSubmitting(false)
          return
        }
      } else if (modalMode === "edit" && selectedBusiness) {
        const result = await updateBusiness({
          id: selectedBusiness.id,
          slug: slugFromName(editFormData.name),
          name: editFormData.name,
          logo_url: editFormData.logoUrl || null,
          business_tags: selectedTags,
        })
        if (!result.success) {
          setSubmitError(result.error || "Failed to update business")
          setIsSubmitting(false)
          return
        }
      }
      closeModal()
      await fetchBusinesses()
    } catch {
      setSubmitError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) =>
    status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"

  const formatStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

  const filteredBusinesses = businesses.filter((b) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const name = (b.name ?? "").toLowerCase()
    const slug = (b.slug ?? "").toLowerCase()
    const about = (b.short_description ?? "").toLowerCase()
    const owner = (b.owner_name ?? "").toLowerCase()
    return name.includes(q) || slug.includes(q) || about.includes(q) || owner.includes(q)
  })

  if (isPageLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center px-6 py-4 border-b border-gray-100">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3" />
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-20">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="w-10">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
            <p className="text-gray-600 mt-1">Manage businesses shown in Product &amp; Services</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {businesses.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-lg font-medium text-gray-900 mb-2">No businesses yet</p>
                <p className="text-gray-500">Add your first business to feature it in Product &amp; Services</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search businesses or members…"
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search businesses or members"
                  />
                </div>
                {filteredBusinesses.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
                    <p className="text-gray-500">Try a different search term.</p>
                  </div>
                ) : (
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
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
                      {filteredBusinesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-0">
                          <div className="w-20 h-10 flex-shrink-0 mr-3 flex items-center justify-center overflow-hidden bg-gray-50 rounded">
                            <img
                              src={business.avatar_url || "/placeholder.svg?height=40&width=80&query=business"}
                              alt={business.name}
                              className="w-20 h-10 object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 flex shrink-0 items-center justify-center">
                                {business.is_sponsored && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                              </span>
                              <span className="font-medium text-gray-900 truncate">{business.name}</span>
                            </div>
                            <div className="text-sm text-gray-500 truncate">{business.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-2 min-w-0">
                          {business.short_description?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 truncate min-w-0">
                          {business.owner_name?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            business.status,
                          )}`}
                        >
                          {formatStatus(business.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block" ref={(el) => (dropdownRefs.current[business.id] = el)}>
                          <button
                            onClick={(e) => toggleDropdown(business.id, e)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Open actions"
                            disabled={isLoading}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === business.id && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <span
                                onClick={() => handleViewBusinessProfile(business.slug)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                View Business
                              </span>
                              <span
                                onClick={() => openEditModal(business)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                                Edit Business
                              </span>
                              <span
                                onClick={() => handleToggleStatus(business)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4 mr-2 text-gray-400" />
                                {business.status === "active" ? "Deactivate" : "Activate"}
                              </span>
                              {business.is_featured ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unfeatureBusiness(business.id)
                                    if (result.success) await fetchBusinesses()
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
                                    const result = await featureBusiness(business.id)
                                    if (result.success) await fetchBusinesses()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                                  Feature
                                </span>
                              )}
                              {business.is_sponsored ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unsponsorBusiness(business.id)
                                    if (result.success) await fetchBusinesses()
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
                                    const result = await sponsorBusiness(business.id)
                                    if (result.success) await fetchBusinesses()
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

      {modalMode && (
        <>
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "add" ? "Add Business" : "Edit Business"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                {modalMode === "add" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Business Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={addFormData.name}
                        onChange={(e) => handleAddFormChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input
                        type="text"
                        value={addFormData.logoUrl}
                        onChange={(e) => handleAddFormChange("logoUrl", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Tags</label>
                      <div className="relative" ref={tagDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                        >
                          <span className="text-gray-500">
                            {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Select tags..."}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        {isTagDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {businessTags.map((tag) => (
                              <div
                                key={tag.id}
                                onClick={() => toggleTag(tag.name)}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${
                                    selectedTags.includes(tag.name) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                  }`}
                                >
                                  {selectedTags.includes(tag.name) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-gray-700">{tag.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {modalMode === "edit" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                      <input
                        type="text"
                        value={editFormData.logoUrl}
                        onChange={(e) => handleEditFormChange("logoUrl", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Tags</label>
                      <div className="relative" ref={tagDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                        >
                          <span className="text-gray-500">
                            {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Select tags..."}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        {isTagDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {businessTags.map((tag) => (
                              <div
                                key={tag.id}
                                onClick={() => toggleTag(tag.name)}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${
                                    selectedTags.includes(tag.name) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                  }`}
                                >
                                  {selectedTags.includes(tag.name) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm text-gray-700">{tag.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (modalMode === "add" && !addFormData.name.trim())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Business" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {viewingBusiness && (
        <BusinessProfileModal
          business={viewingBusiness}
          onClose={() => setViewingBusiness(null)}
          onSelectProduct={() => {}}
          onSelectService={() => {}}
        />
      )}
    </div>
  )
}
