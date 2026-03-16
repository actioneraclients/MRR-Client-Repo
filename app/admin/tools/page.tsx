"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

type Tool = {
  id: string
  name: string
  slug: string
  short_description: string
  full_description: string
  image_url?: string | null
  launch_url: string
  is_active: boolean
  plan_only: boolean
  icon: string
  iconBg: string
  iconColor: string
  plans: string[]
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    plans: [] as string[], // Now stores plan IDs
    url: "",
    active: true,
    imageUrl: null as string | null, // Added imageUrl to formData
    planOnly: false,
  })

  const [availablePlans, setAvailablePlans] = useState<Array<{ id: string; name: string }>>([])

  const fetchTools = async () => {
    setIsLoading(true)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      console.error("Supabase client not available")
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug, short_description, full_description, image_url, launch_url, is_active, plan_only, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tools:", error)
      setIsLoading(false)
      return
    }

    const { data: accessData, error: accessError } = await supabase
      .from("tool_plan_access")
      .select("tool_id, plan_id, plans(name)")

    if (accessError) {
      console.error("Error fetching tool plan access:", accessError)
    }

    const plansByToolId: Record<string, string[]> = {}
    if (accessData) {
      accessData.forEach((access: any) => {
        if (!plansByToolId[access.tool_id]) {
          plansByToolId[access.tool_id] = []
        }
        // Store the plan name for display
        if (access.plans?.name) {
          plansByToolId[access.tool_id].push(access.plans.name)
        }
      })
    }

    const mappedTools: Tool[] = (data ?? []).map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      short_description: tool.short_description,
      full_description: tool.full_description,
      image_url: tool.image_url,
      launch_url: tool.launch_url,
      is_active: tool.is_active,
      plan_only: tool.plan_only ?? false,
      icon: "wrench",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      plans: plansByToolId[tool.id] || [],
    }))

    setTools(mappedTools)
    setIsLoading(false)
  }

  const fetchAvailablePlans = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("plans").select("id, name").order("name", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching plans:", error)
        return
      }

      setAvailablePlans(data || [])
    } catch (error) {
      console.error("[v0] Error in fetchAvailablePlans:", error)
    }
  }

  const fetchToolPlanAccess = async (toolId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("tool_plan_access").select("plan_id").eq("tool_id", toolId)

      if (error) {
        console.error("[v0] Error fetching tool plan access:", error)
        return
      }

      const planIds = data?.map((item) => item.plan_id) || []
      setFormData((prev) => ({ ...prev, plans: planIds }))
    } catch (error) {
      console.error("[v0] Error in fetchToolPlanAccess:", error)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailablePlans()
    }
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen && editingTool) {
      fetchToolPlanAccess(editingTool.id)
    }
  }, [isModalOpen, editingTool])

  const openAddModal = () => {
    setEditingTool(null)
    setImageFile(null)
    setImagePreview(null)
    setFormData({
      name: "",
      shortDescription: "",
      fullDescription: "",
      plans: [],
      url: "",
      active: true,
      imageUrl: null,
      planOnly: false,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (tool: Tool) => {
    setEditingTool(tool)
    setImageFile(null)
    setImagePreview(tool.image_url || null)
    setFormData({
      name: tool.name,
      shortDescription: tool.short_description,
      fullDescription: tool.full_description,
      plans: [], // Will be populated by fetchToolPlanAccess
      url: tool.launch_url,
      active: tool.is_active,
      imageUrl: tool.image_url || null,
      planOnly: tool.plan_only ?? false,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTool(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = getSupabaseBrowserClient()

    try {
      let uploadedImageUrl = formData.imageUrl

      if (imageFile) {
        setIsUploadingImage(true)

        const toolId = editingTool?.id || crypto.randomUUID()
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${toolId}/${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("tool-images")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("[Admin Tools] Failed to upload image:", uploadError.message)
          setIsUploadingImage(false)
          return
        }

        const { data: publicUrlData } = supabase.storage.from("tool-images").getPublicUrl(uploadData.path)

        uploadedImageUrl = publicUrlData.publicUrl
        setIsUploadingImage(false)
      }

      if (editingTool) {
        const updatePayload = {
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
          short_description: formData.shortDescription,
          full_description: formData.fullDescription,
          launch_url: formData.url,
          is_active: formData.active,
          image_url: uploadedImageUrl,
          plan_only: formData.planOnly,
        }

        console.log("[Admin Tools] Saving tool payload", updatePayload)

        const { error: updateError } = await supabase.from("tools").update(updatePayload).eq("id", editingTool.id)

        if (updateError) {
          console.error("[Admin Tools] Failed to update tool:", updateError.message)
          return
        }

        const { error: deleteError } = await supabase.from("tool_plan_access").delete().eq("tool_id", editingTool.id)

        if (deleteError) {
          console.error("[Admin Tools] Failed to delete existing plan access:", deleteError.message)
          return
        }

        if (formData.plans.length > 0) {
          const planAccessRows = formData.plans.map((planId) => ({
            tool_id: editingTool.id,
            plan_id: planId,
          }))

          const { error: insertError } = await supabase.from("tool_plan_access").insert(planAccessRows)

          if (insertError) {
            console.error("[Admin Tools] Failed to insert plan access:", insertError.message)
            return
          }
        }
      } else {
        const newSlug = formData.name.toLowerCase().replace(/\s+/g, "-")

        const insertPayload = {
          name: formData.name,
          slug: newSlug,
          short_description: formData.shortDescription,
          full_description: formData.fullDescription,
          launch_url: formData.url,
          is_active: formData.active,
          image_url: uploadedImageUrl,
          plan_only: formData.planOnly,
        }

        console.log("[Admin Tools] Saving tool payload", insertPayload)

        const { data: newTool, error: createError } = await supabase
          .from("tools")
          .insert([insertPayload])
          .select("id")
          .single()

        if (createError || !newTool) {
          console.error("[Admin Tools] Failed to create tool:", createError?.message)
          return
        }

        if (formData.plans.length > 0) {
          const planAccessRows = formData.plans.map((planId) => ({
            tool_id: newTool.id,
            plan_id: planId,
          }))

          const { error: insertError } = await supabase.from("tool_plan_access").insert(planAccessRows)

          if (insertError) {
            console.error("[Admin Tools] Failed to insert plan access:", insertError.message)
            return
          }
        }
      }

      await fetchTools()
      closeModal()
    } catch (error) {
      console.error("[Admin Tools] Unexpected error during save:", error)
    }
  }

  const handleDelete = () => {
    if (editingTool && confirm("Are you sure you want to delete this tool? This action cannot be undone.")) {
      setTools(tools.filter((t) => t.id !== editingTool.id))
      closeModal()
    }
  }

  const handlePlanToggle = (planId: string) => {
    setFormData((prev) => ({
      ...prev,
      plans: prev.plans.includes(planId) ? prev.plans.filter((p) => p !== planId) : [...prev.plans, planId],
    }))
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "pro+":
        return "bg-purple-100 text-purple-800"
      case "enterprise":
        return "bg-emerald-100 text-emerald-800"
      case "all plans":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getIconSvg = (iconName: string) => {
    switch (iconName) {
      case "address-book":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 2H9c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H9V8l8 5 8-5v10zm-8-7L9 6h14l-8 5z" />
          </svg>
        )
      case "handshake":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 6h-2.5l-1.5-1.5L15.5 6H13l-1.5-1.5L10 6H7.5L6 4.5 4.5 6H3c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 13H3V8h2.5l1.5 1.5L8.5 8H11l1.5 1.5L14 8h2.5l1.5 1.5L19.5 8H21v11z" />
          </svg>
        )
      case "network-wired":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 2h12v2H6V2zm0 18h12v2H6v-2zm-4-8h4v4H2v-4zm7 0h6v4H9v-4zm9 0h4v4h-4v-4zM4 8h2v2H4V8zm7 0h2v2h-2V8zm7 0h2v2h-2V8z" />
          </svg>
        )
      case "envelope-open-text":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z" />
          </svg>
        )
      case "chart-line":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.5 18.5l6-6 4 4L22 6.92 20.59 5.5l-7.09 8-4-4L11 18.83l6.41-6.42L16 11z" />
          </svg>
        )
      case "calendar-check":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zm-2 5l-5 5-3-3-1.41 1.41L11 18.83l6.41-6.42L16 11z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
          </svg>
        )
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Platform Tools</h1>
              <p className="text-gray-600">Add or Manage The Platform Tools You Create For Your Community</p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add New Tool
            </button>
          </div>
        </section>

        <section className="mb-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading tools...</p>
              </div>
            </div>
          ) : tools.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                </svg>
                <p className="text-gray-600 mb-2">No tools found</p>
                <p className="text-sm text-gray-500">Get started by adding your first tool</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
                    !tool.is_active ? "opacity-75 bg-gray-50" : ""
                  }`}
                  onClick={() => openEditModal(tool)}
                >
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {tool.image_url ? (
                      <img
                        src={tool.image_url || "/placeholder.svg"}
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${tool.iconBg} rounded-lg flex items-center justify-center ${tool.iconColor}`}
                      >
                        {getIconSvg(tool.icon)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(tool)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{tool.short_description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        {tool.plans.length > 0 ? (
                          tool.plans.map((plan) => (
                            <span
                              key={plan}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(plan)}`}
                            >
                              {plan}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No plans assigned</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 ${tool.is_active ? "bg-green-500" : "bg-red-500"} rounded-full mr-2`}
                        ></span>
                        <span className="text-xs text-gray-500">{tool.is_active ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{editingTool ? "Edit Tool" : "Add New Tool"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tool Image (Optional)</label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Tool preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                        setFormData({ ...formData, imageUrl: null })
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                    <label className="absolute bottom-2 right-2 cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Change Image
                      <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                ) : (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF recommended</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="toolName" className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Name
                </label>
                <input
                  type="text"
                  id="toolName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter tool name"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Brief description for the tool card"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description
                </label>
                <textarea
                  id="fullDescription"
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Detailed description of the tool and its features"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Member Plans Access</label>
                <div className="space-y-2">
                  {availablePlans.map((plan) => (
                    <label key={plan.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.plans.includes(plan.id)}
                        onChange={() => handlePlanToggle(plan.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{plan.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tool Visibility
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.planOnly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planOnly: e.target.checked
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Show only to members who have the required plan
                  </span>
                </label>
              </div>

              <div className="mb-6">
                <label htmlFor="toolUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Tool URL
                </label>
                <input
                  type="url"
                  id="toolUrl"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://example.com/tool"
                  required
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="activeToggle" className="block text-sm font-medium text-gray-700">
                    Active Status
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="activeToggle"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                {editingTool && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    Delete Tool
                  </button>
                )}
                <div className="flex items-center space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingImage}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingImage ? "Uploading..." : "Save Tool"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
