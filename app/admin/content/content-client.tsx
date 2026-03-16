"use client"

import type React from "react"

import { useState, useRef, useEffect, useTransition, useMemo } from "react"
import { MoreVertical, Eye, Pencil, Trash2, X, Search, Star, Megaphone } from "lucide-react"
import {
  toggleAdminContentStatus,
  adminDeleteContent,
  getAdminContentBySlug,
  getPlans,
  toggleFeaturedContent,
  setSponsoredContent,
  removeSponsoredContent,
} from "./actions"
import { useRouter } from "next/navigation"
import { ContentModal } from "@/components/content-modal"
import { PlanAccessModal } from "@/components/admin/plan-access-modal"

interface Content {
  id: string
  slug: string | null
  title: string
  content_type: string
  category: string | null
  status: string
  published_at: string | null
  created_at: string
  owner: {
    full_name: string | null
    avatar_url: string | null
  } | null
  is_featured: boolean
  is_sponsored: boolean
  plan_ids: string[] | null
}

type ContentDetail = {
  id: string
  slug: string
  title: string
  description: string | null
  contentType: string
  image: string | null
  author: string | null
  authorImage: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  fullContent: {
    videoUrl?: string
    audioUrl?: string
    documentUrl?: string
    articleBody?: string
  }
}

type FilterState = {
  search: string
  submittedBy: string
  contentType: string
  status: string
  plan: string
}

type Props = {
  initialItems: Content[]
}

export default function AdminContentClient({ initialItems }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    submittedBy: "",
    contentType: "",
    status: "",
    plan: "",
  })

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPlanAccessModalOpen, setIsPlanAccessModalOpen] = useState(false)
  const [planAccessContent, setPlanAccessContent] = useState<Content | null>(null)
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [viewContent, setViewContent] = useState<ContentDetail | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])

  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    async function loadPlans() {
      const data = await getPlans()
      setPlans(data || [])
    }

    loadPlans()
  }, [])

  const uniqueSubmitters = useMemo(() => {
    const submitters = initialItems
      .map((item) => item.owner?.full_name)
      .filter((name): name is string => name !== null && name !== undefined)
    return Array.from(new Set(submitters)).sort()
  }, [initialItems])

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      // Search filter
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Submitted By filter
      if (filters.submittedBy && item.owner?.full_name !== filters.submittedBy) {
        return false
      }

      // Content Type filter
      if (filters.contentType && item.content_type.toLowerCase() !== filters.contentType.toLowerCase()) {
        return false
      }

      // Status filter
      if (filters.status && item.status !== filters.status) {
        return false
      }

      // Plan filter
      if (filters.plan) {
        if (!item.plan_ids) {
          return false
        }

        if (!item.plan_ids.includes(filters.plan)) {
          return false
        }
      }

      return true
    })
  }, [initialItems, filters])

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

  const toggleDropdown = (contentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === contentId ? null : contentId))
  }

  const openDeleteModal = (content: Content) => {
    setSelectedContent(content)
    setIsDeleteModalOpen(true)
    setOpenDropdown(null)
  }

  const openPlanAccessModal = (content: Content) => {
    setPlanAccessContent(content)
    setIsPlanAccessModalOpen(true)
    setOpenDropdown(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedContent(null)
  }

  const handleViewContent = async (content: Content) => {
    if (!content.slug) return
    setOpenDropdown(null)
    setIsLoadingContent(true)

    try {
      const contentDetail = await getAdminContentBySlug(content.slug)
      if (contentDetail) {
        setViewContent(contentDetail)
      }
    } catch (error) {
      console.error("Error loading content:", error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  const handleToggleStatus = (content: Content) => {
    const nextStatus = content.status === "published" ? "draft" : "published"
    startTransition(async () => {
      const result = await toggleAdminContentStatus({
        id: content.id,
        nextStatus,
      })
      if (result.success) {
        router.refresh()
      }
      setOpenDropdown(null)
    })
  }

  const handleToggleFeatured = (content: Content) => {
    startTransition(async () => {
      const result = await toggleFeaturedContent(content.id)
      if (result.success) {
        router.refresh()
      }
      setOpenDropdown(null)
    })
  }

  const handleSponsorContent = (content: Content) => {
    startTransition(async () => {
      const result = await setSponsoredContent(content.id)
      if (result.success) {
        router.refresh()
      }
      setOpenDropdown(null)
    })
  }

  const handleRemoveSponsored = (content: Content) => {
    startTransition(async () => {
      const result = await removeSponsoredContent(content.id)
      if (result.success) {
        router.refresh()
      }
      setOpenDropdown(null)
    })
  }

  const handleDelete = () => {
    if (!selectedContent) return
    startTransition(async () => {
      const result = await adminDeleteContent({ id: selectedContent.id })
      if (result.success) {
        closeDeleteModal()
        router.refresh()
      }
    })
  }

  const getContentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      video: "bg-purple-100 text-purple-800",
      article: "bg-blue-100 text-blue-800",
      audio: "bg-emerald-100 text-emerald-800",
      document: "bg-amber-100 text-amber-800",
    }
    return colors[type.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const getStatusColor = (status: string) => {
    return status === "published" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="flex-1 overflow-hidden p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-gray-600 mt-1">Manage all submitted education content</p>
        </div>

        <section className="mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search by Title</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submitted By</label>
                <select
                  value={filters.submittedBy}
                  onChange={(e) => setFilters({ ...filters, submittedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  {uniqueSubmitters.map((submitter) => (
                    <option key={submitter} value={submitter}>
                      {submitter}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.contentType}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plans</label>
                <select
                  value={filters.plan}
                  onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {filteredItems.length === 0 ? (
              // Empty State
              <div className="text-center py-16 px-4">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {initialItems.length === 0 ? "No content found" : "No content matches your filters"}
                </p>
                <p className="text-gray-500">
                  {initialItems.length === 0
                    ? "Content submitted by members will appear here"
                    : "Try adjusting your filter criteria"}
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="w-[22%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="w-[18%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="w-[12%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content Type
                    </th>
                    <th className="w-[14%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-[14%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published Date
                    </th>
                    <th className="w-[10%] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {/* Title Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex shrink-0 items-center justify-center">
                            {item.is_sponsored && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                          </span>
                          <span className="font-medium text-gray-900 truncate">{item.title}</span>
                        </div>
                      </td>

                      {/* Submitted By Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-0">
                          <img
                            src={item.owner?.avatar_url || "/placeholder.svg?height=32&width=32"}
                            alt={item.owner?.full_name || "Unknown"}
                            className="w-8 h-8 rounded-full mr-3 flex-shrink-0"
                          />
                          <div className="font-medium text-gray-900 truncate">{item.owner?.full_name || "Unknown"}</div>
                        </div>
                      </td>

                      {/* Content Type Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContentTypeColor(
                            item.content_type,
                          )}`}
                        >
                          {formatStatus(item.content_type)}
                        </span>
                      </td>

                      {/* Category Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 truncate">{item.category || "—"}</td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            item.status,
                          )}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </td>

                      {/* Published Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block" ref={(el) => (dropdownRefs.current[item.id] = el)}>
                          <button
                            onClick={(e) => toggleDropdown(item.id, e)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Open actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === item.id && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <span
                                onClick={() => handleViewContent(item)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                View Content
                              </span>
                              <span
                                onClick={() => handleToggleStatus(item)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                                {item.status === "published" ? "Unpublish" : "Publish"}
                              </span>
                              <span
                                onClick={() => handleToggleFeatured(item)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Star className="w-4 h-4 mr-2 text-amber-500" />
                                {item.is_featured ? "Remove Featured" : "Feature Content"}
                              </span>
                              <span
                                onClick={() =>
                                  item.is_sponsored ? handleRemoveSponsored(item) : handleSponsorContent(item)
                                }
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Megaphone className="w-4 h-4 mr-2 text-blue-500" />
                                {item.is_sponsored ? "Remove Sponsored" : "Sponsor Content"}
                              </span>
                              <span
                                onClick={() => openPlanAccessModal(item)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Star className="w-4 h-4 mr-2 text-indigo-500" />
                                Plan Access
                              </span>
                              <span
                                onClick={() => openDeleteModal(item)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                                Delete Content
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

      <ContentModal content={viewContent} onClose={() => setViewContent(null)} />

      {isPlanAccessModalOpen && planAccessContent && (
        <PlanAccessModal
          content={planAccessContent}
          onClose={() => {
            setIsPlanAccessModalOpen(false)
            setPlanAccessContent(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedContent && (
        <>
          <div
            onClick={closeDeleteModal}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delete Content</h2>
                <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedContent.title}"? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isPending}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
