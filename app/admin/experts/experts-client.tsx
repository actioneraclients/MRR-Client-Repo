"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Eye, Pencil, Power, X, Plus, ChevronDown, Check } from "lucide-react"
import {
  createExpert,
  updateExpert,
  toggleExpertActive,
  getAdminExperts,
  type ProfileForExpertSelect,
  type ExpertTagOption,
} from "./actions"
import ExpertProfileModal from "@/components/experts/ExpertProfileModal"
import type { ExpertProfile, ExpertContent } from "@/components/experts/ExpertProfileModal"
import { getExpertBySlug, getContentByExpert } from "@/app/members/education/actions-experts"

interface Expert {
  id: string
  profile_id: string
  name: string
  title: string
  business_name: string | null
  avatar_url: string | null
  expert_tags: string[]
  status: "active" | "inactive"
  bio: string | null
  business_about: string | null
  website_url: string | null
  slug: string
}

type ModalMode = "add" | "edit" | null

interface FormData {
  name: string
  title: string
  imageUrl: string
  businessName: string
  businessAbout: string
  bio: string
  websiteUrl: string
}

const emptyFormData: FormData = {
  name: "",
  title: "",
  imageUrl: "",
  businessName: "",
  businessAbout: "",
  bio: "",
  websiteUrl: "",
}

type Props = {
  initialItems: Expert[]
  profiles: ProfileForExpertSelect[]
  expertTags: ExpertTagOption[]
}

export default function AdminExpertsClient({ initialItems, profiles, expertTags }: Props) {
  const router = useRouter()
  const [experts, setExperts] = useState<Expert[]>(initialItems)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading] = useState(false)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [addFormData, setAddFormData] = useState<FormData>(emptyFormData)
  const [editFormData, setEditFormData] = useState<FormData>(emptyFormData)

  const [viewingExpert, setViewingExpert] = useState<ExpertProfile | null>(null)
  const [viewingExpertContent, setViewingExpertContent] = useState<ExpertContent[]>([])

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const tagDropdownRef = useRef<HTMLDivElement | null>(null)

  const fetchExperts = async () => {
    const res = await getAdminExperts()
    const items = res?.items ?? []

    const mapped: Expert[] = items.map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      slug: row.slug,
      name: row.name,
      title: row.title ?? "",
      business_name: row.business_name ?? null,
      business_about: row.business_about ?? null,
      bio: row.bio ?? null,
      website_url: row.website_url ?? null,
      avatar_url: row.avatar_url ?? null,
      expert_tags: row.expert_tags ?? [],
      status: row.is_active ? "active" : "inactive",
    }))

    setExperts(mapped)
  }

  useEffect(() => {
    fetchExperts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Handle action dropdown
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

  const toggleDropdown = (expertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === expertId ? null : expertId))
  }

  const openAddModal = () => {
    setModalMode("add")
    setSelectedMember("")
    setSelectedTags([])
    setSubmitError(null)
    setAddFormData(emptyFormData)
  }

  const openEditModal = (expert: Expert) => {
    setModalMode("edit")
    setSelectedExpert(expert)
    setSelectedTags(expert.expert_tags || [])
    setSubmitError(null)
    setEditFormData({
      name: expert.name,
      title: expert.title,
      imageUrl: expert.avatar_url || "",
      businessName: expert.business_name || "",
      businessAbout: expert.business_about || "",
      bio: expert.bio || "",
      websiteUrl: expert.website_url || "",
    })
    setOpenDropdown(null)
  }

  const handleViewExpertProfile = async (slug: string) => {
    setOpenDropdown(null)
    const profile = await getExpertBySlug(slug)
    if (!profile) return

    const content = await getContentByExpert(profile.id)
    setViewingExpert(profile)
    setViewingExpertContent(content)
  }

  const handleToggleStatus = async (expert: Expert) => {
    setOpenDropdown(null)
    setIsLoading(true)
    const newStatus = expert.status !== "active"
    const result = await toggleExpertActive({ id: expert.id, is_active: newStatus })
    if (result.success) {
      await fetchExperts()
    }
    setIsLoading(false)
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedExpert(null)
    setSelectedMember("")
    setSelectedTags([])
    setSubmitError(null)
  }

  const handleAddFormChange = (field: keyof FormData, value: string) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditFormChange = (field: keyof FormData, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileSelect = (profileId: string) => {
    setSelectedMember(profileId)

    if (profileId) {
      const profile = profiles.find((p) => p.id === profileId)
      if (profile) {
        setAddFormData({
          name: profile.full_name || "",
          title: profile.job_title || "",
          imageUrl: profile.avatar_url || "",
          businessName: profile.company || "",
          businessAbout: "",
          bio: profile.bio || "",
          websiteUrl: "",
        })
      }
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) => (prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      if (modalMode === "add") {
        if (!selectedMember) {
          setSubmitError("Please select a member")
          setIsSubmitting(false)
          return
        }

        const result = await createExpert({
          profile_id: selectedMember,
          slug: generateSlug(addFormData.name),
          name: addFormData.name,
          title: addFormData.title,
          image_url: addFormData.imageUrl || null,
          business_name: addFormData.businessName || null,
          business_about: addFormData.businessAbout || null,
          bio: addFormData.bio || null,
          website_url: addFormData.websiteUrl || null,
          expert_tags: selectedTags,
        })

        if (!result.success) {
          setSubmitError(result.error || "Failed to create expert")
          setIsSubmitting(false)
          return
        }
      } else if (modalMode === "edit" && selectedExpert) {
        const result = await updateExpert({
          id: selectedExpert.id,
          slug: generateSlug(editFormData.name),
          name: editFormData.name,
          title: editFormData.title,
          image_url: editFormData.imageUrl || null,
          business_name: editFormData.businessName || null,
          business_about: editFormData.businessAbout || null,
          bio: editFormData.bio || null,
          website_url: editFormData.websiteUrl || null,
          expert_tags: selectedTags,
        })

        if (!result.success) {
          setSubmitError(result.error || "Failed to update expert")
          setIsSubmitting(false)
          return
        }
      }

      // Success - close modal and refresh
      closeModal()
      await fetchExperts()
    } catch (err) {
      setSubmitError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const renderTags = (tags: string[]) => {
    const maxVisible = 3
    const visibleTags = tags.slice(0, maxVisible)
    const hiddenCount = tags.length - maxVisible

    return (
      <div className="flex flex-wrap gap-1">
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
          >
            {tag}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            +{hiddenCount} more
          </span>
        )}
      </div>
    )
  }

  // Loading skeleton
  if (isPageLoading) {
    return (
      <div className="flex-1 overflow-hidden p-8">
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
    <div className="flex-1 overflow-hidden p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Experts</h1>
            <p className="text-gray-600 mt-1">Manage experts shown in the Education section</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expert
          </button>
        </div>

        {/* Table Section */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {experts.length === 0 ? (
              // Empty State
              <div className="text-center py-16 px-4">
                <p className="text-lg font-medium text-gray-900 mb-2">No experts yet</p>
                <p className="text-gray-500">Add your first expert to feature them in Education</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-[40%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expert
                    </th>
                    <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
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
                  {experts.map((expert) => (
                    <tr key={expert.id} className="hover:bg-gray-50">
                      {/* Expert Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-0">
                          <img
                            src={expert.avatar_url || "/placeholder.svg?height=40&width=40&query=person"}
                            alt={expert.name}
                            className="w-10 h-10 rounded-full mr-3 object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{expert.name}</div>
                            <div className="text-sm text-gray-500 truncate">{expert.title}</div>
                            {expert.business_name && (
                              <div className="text-sm text-gray-400 truncate">{expert.business_name}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tags Column */}
                      <td className="px-6 py-4 overflow-hidden">{renderTags(expert.expert_tags)}</td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            expert.status,
                          )}`}
                        >
                          {formatStatus(expert.status)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block" ref={(el) => (dropdownRefs.current[expert.id] = el)}>
                          <button
                            onClick={(e) => toggleDropdown(expert.id, e)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Open actions"
                            disabled={isLoading}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === expert.id && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <span
                                onClick={() => handleViewExpertProfile(expert.slug)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                View Profile
                              </span>
                              <span
                                onClick={() => openEditModal(expert)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                                Edit Profile
                              </span>
                              <span
                                onClick={() => handleToggleStatus(expert)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4 mr-2 text-gray-400" />
                                {expert.status === "active" ? "Deactivate" : "Activate"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* Add/Edit Expert Modal */}
      {modalMode && (
        <>
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "add" ? "Add Expert" : "Edit Expert"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                {modalMode === "add" && (
                  <>
                    {/* Step 1: Select Member - using real profiles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Member</label>
                      <div className="relative">
                        <select
                          value={selectedMember}
                          onChange={(e) => handleProfileSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">Choose a member to make an expert</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Experts must already be members</p>
                    </div>

                    {/* Step 2: Expert Details - shown only when member is selected */}
                    {selectedMember && (
                      <div className="pt-4 border-t border-gray-100 space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">Expert Details</h3>

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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={addFormData.title}
                            onChange={(e) => handleAddFormChange("title", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={addFormData.imageUrl}
                            onChange={(e) => handleAddFormChange("imageUrl", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                          <input
                            type="text"
                            value={addFormData.businessName}
                            onChange={(e) => handleAddFormChange("businessName", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business About</label>
                          <textarea
                            value={addFormData.businessAbout}
                            onChange={(e) => handleAddFormChange("businessAbout", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea
                            value={addFormData.bio}
                            onChange={(e) => handleAddFormChange("bio", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                          <input
                            type="text"
                            value={addFormData.websiteUrl}
                            onChange={(e) => handleAddFormChange("websiteUrl", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Expert Tags Multi-Select */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expert Tags</label>
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
                                {expertTags.map((tag) => (
                                  <div
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.name)}
                                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                  >
                                    <div
                                      className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${
                                        selectedTags.includes(tag.name)
                                          ? "bg-blue-600 border-blue-600"
                                          : "border-gray-300"
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

                          {/* Selected Tags Display */}
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
                  </>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => handleEditFormChange("title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                      <input
                        type="text"
                        value={editFormData.imageUrl}
                        onChange={(e) => handleEditFormChange("imageUrl", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={editFormData.businessName}
                        onChange={(e) => handleEditFormChange("businessName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business About</label>
                      <textarea
                        value={editFormData.businessAbout}
                        onChange={(e) => handleEditFormChange("businessAbout", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={editFormData.bio}
                        onChange={(e) => handleEditFormChange("bio", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                      <input
                        type="text"
                        value={editFormData.websiteUrl}
                        onChange={(e) => handleEditFormChange("websiteUrl", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Expert Tags Multi-Select */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expert Tags</label>
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
                            {expertTags.map((tag) => (
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

                      {/* Selected Tags Display */}
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

              {/* Modal Footer */}
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
                  disabled={isSubmitting || (modalMode === "add" && !selectedMember)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : modalMode === "add" ? "Add Expert" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Expert Profile Modal */}
      {viewingExpert && (
        <ExpertProfileModal
          expert={viewingExpert}
          content={viewingExpertContent}
          onClose={() => {
            setViewingExpert(null)
            setViewingExpertContent([])
          }}
          onSelectContent={() => {}}
        />
      )}
    </div>
  )
}
