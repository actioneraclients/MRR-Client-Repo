"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import {
  MoreVertical,
  Eye,
  Pencil,
  Power,
  Trash2,
  Plus,
  X,
  Link2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  createOptInPage,
  updateOptInPage,
  toggleOptInActive,
  softDeleteOptInPage,
  getAdminOptInPages,
  type OptInPageWithPlan,
  type PlanOption,
} from "./actions"

interface OptInItem extends OptInPageWithPlan {
  plan_name: string | null
}

type ModalMode = "add" | "edit" | null

interface FormData {
  name: string
  slug: string
  is_active: boolean
  logo_enabled: boolean
  use_brand_background: boolean
  use_background_color: boolean
  headline: string
  left_subheadline: string
  left_body: string
  left_bullets: string
  video_url: string
  image_url: string
  cta_text: string
  confirmation_message: string
  plan_id: string
}

const emptyFormData: FormData = {
  name: "",
  slug: "",
  is_active: true,
  logo_enabled: true,
  use_brand_background: false,
  use_background_color: false,
  headline: "",
  left_subheadline: "",
  left_body: "",
  left_bullets: "",
  video_url: "",
  image_url: "",
  cta_text: "",
  confirmation_message: "",
  plan_id: "",
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

type Props = {
  initialItems: OptInPageWithPlan[]
  plans: PlanOption[]
}

export function AdminOptInClient({ initialItems, plans }: Props) {
  const [items, setItems] = useState<OptInItem[]>(() =>
    initialItems.map((row) => ({
      ...row,
      plan_name: row.plans?.name ?? null,
    }))
  )
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedItem, setSelectedItem] = useState<OptInItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyFormData)
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const fetchItems = async () => {
    const res = await getAdminOptInPages()
    const list = res.items ?? []
    setItems(
      list.map((row) => ({
        ...row,
        plan_name: row.plans?.name ?? null,
      }))
    )
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const openAddModal = () => {
    setModalMode("add")
    setSelectedItem(null)
    setSubmitError(null)
    setAutoGenerateSlug(true)
    setFormData(emptyFormData)
  }

  const openEditModal = (item: OptInItem) => {
    setModalMode("edit")
    setSelectedItem(item)
    setSubmitError(null)
    setAutoGenerateSlug(false)
    setFormData({
      name: item.name,
      slug: item.slug,
      is_active: item.is_active,
      logo_enabled: item.logo_enabled ?? true,
      use_brand_background: item.use_brand_background ?? false,
      use_background_color: item.use_background_color === true,
      headline: item.headline ?? "",
      left_subheadline: item.left_subheadline ?? "",
      left_body: item.left_body ?? "",
      left_bullets: (item.left_bullets ?? []).join("\n"),
      video_url: item.video_url ?? "",
      image_url: item.image_url ?? "",
      cta_text: item.cta_text ?? "",
      confirmation_message: item.confirmation_message ?? "",
      plan_id: item.plan_id ?? "",
    })
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedItem(null)
    setSubmitError(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    try {
      setUploading(true)

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      const { error } = await supabase.storage
        .from("opt-in-pages")
        .upload(fileName, file)

      if (error) throw error

      const { data } = supabase.storage.from("opt-in-pages").getPublicUrl(fileName)

      handleFormChange("image_url", data.publicUrl)
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "name" && autoGenerateSlug) {
        next.slug = generateSlug(typeof value === "string" ? value : prev.name)
      }
      return next
    })
  }

  const handleCopyUrl = (slug: string) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}`
    navigator.clipboard.writeText(url)
  }

  const handleViewPage = (slug: string) => {
    window.open(`/${slug}`, "_blank")
  }

  const handleToggleActive = async (item: OptInItem) => {
    setIsLoading(true)
    const result = await toggleOptInActive(item.id, !item.is_active)
    if (result.success) await fetchItems()
    setIsLoading(false)
  }

  const handleSoftDelete = async (item: OptInItem) => {
    setIsLoading(true)
    const result = await softDeleteOptInPage(item.id)
    if (result.success) await fetchItems()
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const bullets = formData.left_bullets
        ? formData.left_bullets
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : null

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        is_active: formData.is_active,
        logo_enabled: formData.logo_enabled,
        use_brand_background: formData.use_brand_background,
        use_background_color: formData.use_background_color === true,
        headline: formData.headline.trim(),
        left_subheadline: formData.left_subheadline.trim() || null,
        left_body: formData.left_body.trim() || null,
        left_bullets: bullets,
        video_url: formData.video_url.trim() || null,
        image_url: formData.image_url.trim() || null,
        cta_text: formData.cta_text.trim() || null,
        confirmation_message: formData.confirmation_message.trim() || null,
        plan_id: formData.plan_id || null,
      }

      if (modalMode === "add") {
        if (!payload.name) {
          setSubmitError("Name is required")
          setIsSubmitting(false)
          return
        }
        if (!payload.headline) {
          setSubmitError("Headline is required")
          setIsSubmitting(false)
          return
        }
        const result = await createOptInPage(payload)
        if (!result.success) {
          setSubmitError(result.error ?? "Failed to create")
          setIsSubmitting(false)
          return
        }
      } else if (modalMode === "edit" && selectedItem) {
        if (!payload.name) {
          setSubmitError("Name is required")
          setIsSubmitting(false)
          return
        }
        if (!payload.headline) {
          setSubmitError("Headline is required")
          setIsSubmitting(false)
          return
        }
        const result = await updateOptInPage({ ...payload, id: selectedItem.id })
        if (!result.success) {
          setSubmitError(result.error ?? "Failed to update")
          setIsSubmitting(false)
          return
        }
      }

      closeModal()
      await fetchItems()
    } catch {
      setSubmitError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (active: boolean) =>
    active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"

  return (
    <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opt-In Pages</h1>
          <p className="text-gray-600 mt-1">Manage dynamic opt-in funnel pages</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Opt-In Page
        </button>
      </div>

      {/* Table */}
      <section>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-lg font-medium text-gray-900 mb-2">No opt-in pages yet</p>
              <p className="text-gray-500">Create your first opt-in page to get started</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-[20%] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate">{item.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 truncate font-mono">{item.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 truncate">{item.plan_name ?? "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          item.is_active
                        )}`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
                            aria-label="Open actions"
                            disabled={isLoading}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEditModal(item)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleViewPage(item.slug)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Page
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleCopyUrl(item.slug)}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleToggleActive(item)}>
                            <Power className="w-4 h-4 mr-2" />
                            {item.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => handleSoftDelete(item)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Modal */}
      {modalMode && (
        <>
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "add" ? "Create Opt-In Page" : "Edit Opt-In Page"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                {/* Section 1 — Core */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Core</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Lead Magnet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => {
                          setAutoGenerateSlug(false)
                          handleFormChange("slug", e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="auto-generated from name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <select
                        value={formData.plan_id}
                        onChange={(e) => handleFormChange("plan_id", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">No plan</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-6 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => handleFormChange("is_active", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.logo_enabled}
                          onChange={(e) => handleFormChange("logo_enabled", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Logo Enabled</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.use_brand_background}
                          onChange={(e) => handleFormChange("use_brand_background", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Use Brand Background Color</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 2 — Marketing Content */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Marketing Content</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headline *</label>
                      <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => handleFormChange("headline", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Main headline"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Left Subheadline</label>
                      <input
                        type="text"
                        value={formData.left_subheadline}
                        onChange={(e) => handleFormChange("left_subheadline", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Left Body</label>
                      <textarea
                        value={formData.left_body}
                        onChange={(e) => handleFormChange("left_body", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bullets (one per line)</label>
                      <textarea
                        value={formData.left_bullets}
                        onChange={(e) => handleFormChange("left_bullets", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="One bullet per line"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                        <input
                          type="text"
                          value={formData.video_url}
                          onChange={(e) => handleFormChange("video_url", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="YouTube, Vimeo, or direct URL"
                        />
                      </div>
                      <div>
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Upload Image
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90 transition"
                            >
                              Upload Image
                            </button>
                            {uploading && (
                              <span className="text-xs text-muted-foreground">
                                Uploading...
                              </span>
                            )}
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          {formData.image_url && (
                            <img
                              src={formData.image_url}
                              alt="Preview"
                              className="w-32 h-auto rounded border"
                            />
                          )}
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL (optional if uploading)
                          </label>
                          <input
                            type="text"
                            value={formData.image_url}
                            onChange={(e) => handleFormChange("image_url", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                      <input
                        type="text"
                        value={formData.cta_text}
                        onChange={(e) => handleFormChange("cta_text", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. Get Access Now"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Message</label>
                      <textarea
                        value={formData.confirmation_message}
                        onChange={(e) => handleFormChange("confirmation_message", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.name.trim() || !formData.headline.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Create Opt-In Page"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
