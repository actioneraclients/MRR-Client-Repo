"use client"

import { useState, useEffect } from "react"
import {
  getTaxonomiesByType,
  createTaxonomy,
  updateTaxonomy,
  deleteTaxonomy,
  type Taxonomy,
  type TaxonomyType,
} from "./actions"

type TabType = "categories" | "content-tags" | "expert-tags"

const TAB_TO_TYPE: Record<TabType, TaxonomyType> = {
  categories: "category",
  "content-tags": "content_tag",
  "expert-tags": "expert_tag",
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Taxonomy[]>([])

  const [currentTab, setCurrentTab] = useState<TabType>("categories")
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editingItem, setEditingItem] = useState<Taxonomy | null>(null)
  const [deleteItem, setDeleteItem] = useState<Taxonomy | null>(null)
  const [slugAutoUpdate, setSlugAutoUpdate] = useState(true)
  const [formData, setFormData] = useState({ name: "", slug: "" })
  const [errors, setErrors] = useState({ name: "", slug: "" })
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([])

  const fetchData = async () => {
    const type = TAB_TO_TYPE[currentTab]
    const data = await getTaxonomiesByType(type)
    setItems(data)
  }

  useEffect(() => {
    fetchData()
  }, [currentTab])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const validateSlug = (slug: string) => {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  }

  const showToast = (message: string, type = "success") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2300)
  }

  const getCurrentTabName = () => {
    switch (currentTab) {
      case "categories":
        return "Category"
      case "content-tags":
        return "Content Tag"
      case "expert-tags":
        return "Expert Tag"
    }
  }

  const openModal = (edit = false, item: Taxonomy | null = null) => {
    setIsEdit(edit)
    setEditingItem(item)
    setSlugAutoUpdate(!edit)

    if (edit && item) {
      setFormData({ name: item.name, slug: item.slug })
    } else {
      setFormData({ name: "", slug: "" })
    }

    setErrors({ name: "", slug: "" })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setIsEdit(false)
    setEditingItem(null)
    setSlugAutoUpdate(true)
    setFormData({ name: "", slug: "" })
    setErrors({ name: "", slug: "" })
  }

  const validateForm = () => {
    const newErrors = { name: "", slug: "" }
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
      isValid = false
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required"
      isValid = false
    } else if (!validateSlug(formData.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const saveItem = async () => {
    if (!validateForm()) return

    if (isEdit && editingItem) {
      // Update existing item via server action
      const { error } = await updateTaxonomy({
        id: editingItem.id,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      })

      if (error) {
        showToast("Failed to save", "error")
        return
      }

      showToast("Saved successfully")
    } else {
      // Create new item via server action
      const type = TAB_TO_TYPE[currentTab]
      const { error } = await createTaxonomy({
        type,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      })

      if (error) {
        showToast("Failed to create", "error")
        return
      }

      showToast("Created successfully")
    }

    closeModal()
    // Re-fetch data after create/update
    fetchData()
  }

  const confirmDelete = (item: Taxonomy) => {
    setDeleteItem(item)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteItem(null)
  }

  const performDelete = async () => {
    if (!deleteItem) return

    const { error } = await deleteTaxonomy(deleteItem.id)

    if (error) {
      showToast("Failed to delete", "error")
      closeDeleteModal()
      return
    }

    showToast("Deleted successfully")
    closeDeleteModal()
    // Re-fetch data after delete
    fetchData()
  }

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }))
    if (slugAutoUpdate) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }))
    }
  }

  const handleSlugChange = (value: string) => {
    setFormData((prev) => ({ ...prev, slug: value }))
    setSlugAutoUpdate(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showModal) closeModal()
        if (showDeleteModal) closeDeleteModal()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showModal, showDeleteModal])

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Categories/Tags</h1>
          <p className="text-gray-600">
            Global Categories and Tags used throughout the site in community, education and other places.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" role="tablist">
              <button
                onClick={() => setCurrentTab("categories")}
                className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap ${
                  currentTab === "categories"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
                aria-selected={currentTab === "categories"}
              >
                Categories
              </button>
              <button
                onClick={() => setCurrentTab("content-tags")}
                className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap ${
                  currentTab === "content-tags"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
                aria-selected={currentTab === "content-tags"}
              >
                Content Tags
              </button>
              <button
                onClick={() => setCurrentTab("expert-tags")}
                className={`py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap ${
                  currentTab === "expert-tags"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                role="tab"
                aria-selected={currentTab === "expert-tags"}
              >
                Expert Tags
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{getCurrentTabName()}s</h2>
            <button
              onClick={() => openModal(false)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add {getCurrentTabName()}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{item.slug ?? "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(true, item)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(item)}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded p-1"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEdit ? `Edit ${getCurrentTabName()}` : `Add ${getCurrentTabName()}`}
              </h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveItem()
              }}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="item-name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.name && <div className="mt-1 text-sm text-red-600">{errors.name}</div>}
              </div>
              <div>
                <label htmlFor="item-slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  id="item-slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.slug ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.slug && <div className="mt-1 text-sm text-red-600">{errors.slug}</div>}
              </div>
            </form>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEdit ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDeleteModal}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete this item?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-600">
                This will remove the item from your global {getCurrentTabName()}s. This cannot be undone in this demo.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
