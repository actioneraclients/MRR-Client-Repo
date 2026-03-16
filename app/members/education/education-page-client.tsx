"use client"

import { useState, useEffect, startTransition, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Search,
  Play,
  FileText,
  Headphones,
  File,
  ExternalLink,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Plus,
  MoreVertical,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getExpertsList, getExpertBySlug, getContentByExpert } from "@/app/members/education/actions-experts"
import {
  getContentList,
  getContentBySlug,
  createEducationContent,
  deleteEducationContent,
  updateEducationContent,
  getEducationContentById,
} from "@/app/members/education/actions-content"
import { createBrowserClient } from "@supabase/ssr"
import ExpertProfileModal from "@/components/experts/ExpertProfileModal"
import type { ExpertProfile, ExpertContent } from "@/components/experts/ExpertProfileModal"
import { UpgradeRequiredModal } from "../community/groups/upgrade-required-modal"
import { SpotlightSection } from "@/components/ui/SpotlightSection"

function normalizeYouTubeUrl(url: string): string {
  if (!url) return url

  // youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0]
    return `https://www.youtube.com/embed/${id}`
  }

  // youtube.com/watch?v=VIDEO_ID
  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0]
    return `https://www.youtube.com/embed/${id}`
  }

  // already embed or other providers
  return url
}

type ViewType = "content" | "experts"

type ExpertData = {
  id: string
  slug: string
  name: string
  businessName: string | null
  image: string | null
  bio: string | null
  tags: string[]
}

type ContentItem = {
  id: string
  slug: string
  title: string
  description: string
  contentType: string
  category: string | null
  tags: string[]
  image: string | null
  author: string | null
  authorImage: string | null
  owner_id: string | null
  is_featured?: boolean
  is_sponsored?: boolean
  plan_ids?: string[] | null
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

function ContentModal({
  content,
  sourceExpert,
  onBackToExpert,
  onClose,
}: {
  content: ContentDetail | null
  sourceExpert?: { id: string; name: string; slug: string } | null
  onBackToExpert?: () => void
  onClose: () => void
}) {
  if (!content) return null

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 min-w-0">
          {sourceExpert && onBackToExpert && (
            <button
              onClick={onBackToExpert}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
            >
              ← Back to {sourceExpert.name}
            </button>
          )}

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                content.contentType === "Video"
                  ? "bg-red-100 text-red-800"
                  : content.contentType === "Article"
                    ? "bg-blue-100 text-blue-800"
                    : content.contentType === "Audio"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {content.contentType}
            </span>

            {content.tags?.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Author */}
          {content.author && (
            <div className="flex items-center gap-3">
              <Image
                src={content.authorImage || "/placeholder.svg?height=40&width=40&query=avatar"}
                alt={content.author}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium text-gray-900">{content.author}</span>
            </div>
          )}

          {content.image && content.contentType !== "Video" && (
            <div className="relative w-full max-h-[420px] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              <Image
                src={content.image || "/placeholder.svg"}
                alt={content.title}
                width={1200}
                height={800}
                className="w-auto max-h-[420px] object-contain"
                priority
              />
              <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent" />
            </div>
          )}

          {/* Content Display based on type */}
          {content.contentType === "Video" && content.fullContent.videoUrl && (
            <>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={normalizeYouTubeUrl(content.fullContent.videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-gray-700 leading-relaxed">{content.description}</p>
            </>
          )}

          {content.contentType === "Article" && content.fullContent.articleBody && (
            <div className="max-w-3xl mx-auto px-6 pb-10">
              <div className="prose prose-gray max-w-none">
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content.fullContent.articleBody }}
                />
              </div>
            </div>
          )}

          {content.contentType === "Audio" && content.fullContent.audioUrl && (
            <>
              <div className="bg-gray-100 rounded-lg p-6">
                <audio controls className="w-full">
                  <source src={content.fullContent.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              <p className="text-gray-700 leading-relaxed">{content.description}</p>
            </>
          )}

          {content.contentType === "Document" && content.fullContent.documentUrl && (
            <>
              <Button
                onClick={() => window.open(content.fullContent.documentUrl, "_blank")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open / Download Document
              </Button>

              <p className="text-gray-700 leading-relaxed">{content.description}</p>
            </>
          )}

          {content.ctaText && content.ctaUrl && (
            <div className="pt-8 border-t border-gray-200">
              <Button
                onClick={() => window.open(content.ctaUrl!, "_blank")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
              >
                {content.ctaText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddContentModal({
  open,
  onClose,
  contentCategories,
  contentTags,
  onSuccess,
  content,
}: {
  open: boolean
  onClose: () => void
  contentCategories: string[]
  contentTags: { id: string; name: string }[]
  onSuccess?: () => void
  content?: ContentItem | null
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [contentType, setContentType] = useState<"Video" | "Article" | "Audio" | "Document">("Video")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    cta_text: "",
    cta_url: "",
    video_url: "",
    article_body: "",
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)

  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>("")
  const [audioUrl, setAudioUrl] = useState<string>("")
  const [documentUrl, setDocumentUrl] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)

  const isEditMode = !!content

  useEffect(() => {
    if (content) {
      // Edit mode: prefill basic fields
      setContentType(content.contentType as "Video" | "Article" | "Audio" | "Document")
      setFormData({
        title: content.title,
        description: content.description || "",
        category: content.category || "",
        cta_text: "",
        cta_url: "",
        video_url: "",
        article_body: "",
      })
      setSelectedTags(content.tags || [])
      setFeaturedImageUrl(content.image || "")

      // Fetch full details for fields not in ContentItem
      setIsLoadingEditData(true)
      getEducationContentById(content.id)
        .then((details) => {
          if (details) {
            setFormData((prev) => ({
              ...prev,
              cta_text: details.cta_text || "",
              cta_url: details.cta_url || "",
              video_url: details.video_url || "",
              article_body: details.article_body || "",
            }))
            setAudioUrl(details.audio_url || "")
            setDocumentUrl(details.document_url || "")
          }
        })
        .finally(() => {
          setIsLoadingEditData(false)
        })
    } else {
      // Create mode: reset all fields
      setContentType("Video")
      setFormData({
        title: "",
        description: "",
        category: "",
        cta_text: "",
        cta_url: "",
        video_url: "",
        article_body: "",
      })
      setSelectedTags([])
      setFeaturedImageUrl("")
      setAudioUrl("")
      setDocumentUrl("")
      setFeaturedImageFile(null)
      setAudioFile(null)
      setDocumentFile(null)
    }
  }, [content])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      cta_text: "",
      cta_url: "",
      video_url: "",
      article_body: "",
    })
    setSelectedTags([])
    setFeaturedImageFile(null)
    setAudioFile(null)
    setDocumentFile(null)
    setFeaturedImageUrl("")
    setAudioUrl("")
    setDocumentUrl("")
    setContentType("Video")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage.from("content-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

    if (error) throw error

    const { data } = supabase.storage.from("content-assets").getPublicUrl(path)
    return data.publicUrl
  }

  const handleFormAction = async (fd: FormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && content) {
        const result = await updateEducationContent({
          id: content.id,
          title: fd.get("title") as string,
          description: (fd.get("description") as string) || null,
          content_type: fd.get("content_type") as string,
          category: (fd.get("category") as string) || null,
          tags: JSON.parse((fd.get("tags") as string) || "[]"),
          image_url: (fd.get("image_url") as string) || null,
          video_url: contentType === "Video" ? (fd.get("video_url") as string) || null : null,
          audio_url: contentType === "Audio" ? (fd.get("audio_url") as string) || null : null,
          document_url: contentType === "Document" ? (fd.get("document_url") as string) || null : null,
          article_body: contentType === "Article" ? (fd.get("article_body") as string) || null : null,
          cta_text: (fd.get("cta_text") as string) || null,
          cta_url: (fd.get("cta_url") as string) || null,
        })
        if (!result.success) {
          alert(result.error || "Failed to update content")
          return
        }
      } else {
        // Normalize video URL before submitting
        const videoUrl = fd.get("video_url") as string
        if (videoUrl) {
          fd.set("video_url", normalizeYouTubeUrl(videoUrl))
        }

        const result = await createEducationContent(fd)
        if (!result.ok) {
          console.error("Create content error:", result.error)
          alert(result.error?.message || "Failed to create content")
          return
        }
      }
      onSuccess?.()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            startTransition(async () => {
              await handleFormAction(new FormData(e.currentTarget))
            })
          }}
          className="flex flex-col h-full"
        >
          <input type="hidden" name="image_url" value={featuredImageUrl} />
          <input type="hidden" name="audio_url" value={audioUrl} />
          <input type="hidden" name="document_url" value={documentUrl} />
          <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
          <input type="hidden" name="content_type" value={contentType} />

          <div className="shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 px-5 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Content" : "Add Content"}</h2>
            {isEditMode && isLoadingEditData && <p className="text-sm text-gray-500 mt-1">Loading content details…</p>}
          </div>

          <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 min-w-0">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter content title"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Brief description of the content"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Content Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Video">Video</option>
                    <option value="Article">Article</option>
                    <option value="Audio">Audio (Podcast)</option>
                    <option value="Document">Document (PDF)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select category</option>
                    {contentCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg">
                  {contentTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Featured Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    id="featured-image-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      setUploadingImage(true)
                      try {
                        const url = await uploadFile(file)
                        setFeaturedImageUrl(url)
                        setFeaturedImageFile(file)
                      } catch (err) {
                        alert("Failed to upload image")
                      } finally {
                        setUploadingImage(false)
                      }
                    }}
                  />

                  <label htmlFor="featured-image-upload" className="cursor-pointer block">
                    {uploadingImage ? (
                      <p className="text-sm text-gray-500">Uploading image…</p>
                    ) : featuredImageUrl ? (
                      <img
                        src={featuredImageUrl || "/placeholder.svg"}
                        alt="Featured preview"
                        className="mx-auto max-h-40 rounded-md object-cover"
                      />
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Click or drag to upload featured image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {contentType === "Video" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Video URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="video_url"
                    value={formData.video_url}
                    onChange={(e) => handleInputChange("video_url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full"
                  />
                </div>
              )}

              {contentType === "Article" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Article Content <span className="text-red-500">*</span>
                  </label>
                  <div
                    contentEditable
                    className="prose prose-gray max-w-none min-h-[300px] border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onBlur={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        article_body: e.currentTarget.innerHTML,
                      }))
                    }
                    dangerouslySetInnerHTML={{ __html: formData.article_body }}
                    suppressContentEditableWarning
                  />
                  <input type="hidden" name="article_body" value={formData.article_body} />
                </div>
              )}

              {contentType === "Audio" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Audio File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="audio/mpeg,audio/mp3"
                      className="hidden"
                      id="audio-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        setUploadingAudio(true)
                        try {
                          const url = await uploadFile(file)
                          setAudioUrl(url)
                          setAudioFile(file)
                        } catch (err) {
                          alert("Failed to upload audio")
                        } finally {
                          setUploadingAudio(false)
                        }
                      }}
                    />

                    <label htmlFor="audio-upload" className="cursor-pointer block">
                      {uploadingAudio ? (
                        <p className="text-sm text-gray-500">Uploading audio…</p>
                      ) : audioFile ? (
                        <p className="text-sm text-green-600">✓ {audioFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">Click to upload audio file</p>
                          <p className="text-xs text-gray-400 mt-1">MP3 format</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {contentType === "Document" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Document File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      id="document-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return

                        setUploadingDocument(true)
                        try {
                          const url = await uploadFile(file)
                          setDocumentUrl(url)
                          setDocumentFile(file)
                        } catch (err) {
                          alert("Failed to upload document")
                        } finally {
                          setUploadingDocument(false)
                        }
                      }}
                    />

                    <label htmlFor="document-upload" className="cursor-pointer block">
                      {uploadingDocument ? (
                        <p className="text-sm text-gray-500">Uploading document…</p>
                      ) : documentFile ? (
                        <p className="text-sm text-green-600">✓ {documentFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">Click to upload document</p>
                          <p className="text-xs text-gray-400 mt-1">PDF format</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button Text</label>
                <Input
                  name="cta_text"
                  value={formData.cta_text}
                  onChange={(e) => handleInputChange("cta_text", e.target.value)}
                  placeholder="e.g. Download Now, Get Started"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button URL</label>
                <Input
                  name="cta_url"
                  value={formData.cta_url}
                  onChange={(e) => handleInputChange("cta_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="shrink-0 sticky bottom-0 bg-white border-t border-gray-200 px-5 md:px-8 py-3 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6"
              disabled={isSubmitting || uploadingImage || uploadingAudio || uploadingDocument}
            >
              {isSubmitting ? "Submitting..." : isEditMode ? "Update Content" : "Submit Content"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContentCard({
  content,
  onClick,
  currentUserId,
  onEdit,
  onDelete,
  brandAccentColor,
  showFeaturedBadge,
}: {
  content: ContentItem
  onClick: () => void
  currentUserId: string | null
  onEdit: (content: ContentItem) => void
  onDelete: (content: ContentItem) => void
  brandAccentColor: string
  showFeaturedBadge?: boolean
}) {
  const isOwner = currentUserId !== null && content.owner_id === currentUserId

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Video":
        return "bg-red-600"
      case "Article":
        return "bg-blue-600"
      case "Audio":
        return "bg-green-600"
      case "Document":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Play className="w-3 h-3" />
      case "Article":
        return <FileText className="w-3 h-3" />
      case "Audio":
        return <Headphones className="w-3 h-3" />
      case "Document":
        return <File className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Header Image - EXACT MATCH to Events */}
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          className="w-full h-full object-cover object-center"
          src={content.image || "/placeholder.svg?height=400&width=600&query=content"}
          alt={content.title}
          width={600}
          height={400}
        />
        {/* Content Type Badge - Top Left */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span
            className={`${getTypeBadgeColor(content.contentType)} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5`}
          >
            {getTypeIcon(content.contentType)}
            {content.contentType}
          </span>
          {showFeaturedBadge && (
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Featured
            </span>
          )}
        </div>

        {isOwner && (
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(content)
                  }}
                >
                  Edit Content
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(content)
                  }}
                  className="text-red-600"
                >
                  Delete Content
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{content.title}</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{content.description}</p>

        {/* Author Avatar + Name */}
        {content.author && (
          <div className="flex items-center gap-3 mt-auto pt-3">
            <Image
              src={content.authorImage || "/placeholder.svg?height=32&width=32&query=avatar"}
              alt={content.author}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-900">{content.author}</span>
          </div>
        )}

        {/* View Button */}
        <div className="pt-3">
          <Button
            className="w-full text-white"
            style={{ backgroundColor: brandAccentColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1"
            }}
          >
            View Content
          </Button>
        </div>
      </div>
    </div>
  )
}

function ExpertCard({
  expert,
  onClick,
  brandAccentColor = "#2563eb",
}: {
  expert: ExpertData
  onClick: () => void
  brandAccentColor?: string
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          className="w-full h-full object-contain object-center"
          src={expert.image || "/placeholder.svg?height=400&width=600&query=expert"}
          alt={expert.name}
          width={600}
          height={400}
        />
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{expert.name}</h3>
        {expert.businessName && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-1">{expert.businessName}</p>
        )}
        {(expert.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
            {(expert.tags ?? []).slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {tag}
              </span>
            ))}
            {(expert.tags ?? []).length > 2 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                +{(expert.tags ?? []).length - 2} more
              </span>
            )}
          </div>
        )}
        <div className="pt-3">
          <Button
            className="w-full text-white"
            style={{ backgroundColor: brandAccentColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1"
            }}
          >
            View Profile
          </Button>
        </div>
      </div>
    </div>
  )
}

interface EducationPageClientProps {
  pageTitle: string
  brandAccentColor?: string
  initialExperts: ExpertData[]
  allExpertTags: string[]
  initialContent: ContentItem[]
  totalContent: number
  initialPage: number
  pageSize: number
  initialSponsoredItem: ContentItem | null
  contentFilters: {
    categories: string[]
    contentTypes: string[]
    tags: string[]
  }
  contentCategories: string[]
  contentTags: { id: string; name: string }[]
  currentUserId: string | null
  canCreateContent: boolean
  upgradeLink: string | null
}

export default function EducationPageClient({
  pageTitle,
  brandAccentColor = "#2563eb",
  initialExperts,
  allExpertTags,
  initialContent,
  totalContent,
  initialPage,
  pageSize,
  initialSponsoredItem,
  contentFilters,
  contentCategories,
  contentTags,
  currentUserId,
  canCreateContent,
  upgradeLink,
}: EducationPageClientProps) {
  const searchParams = useSearchParams()
  const didPrefillExpertRef = useRef(false)

  const [activeView, setActiveView] = useState<ViewType>("content")
  const [selectedContentSlug, setSelectedContentSlug] = useState<string | null>(null)
  const [selectedContentDetail, setSelectedContentDetail] = useState<ContentDetail | null>(null)
  const [selectedExpertSlug, setSelectedExpertSlug] = useState<string | null>(null)
  const [selectedExpertProfile, setSelectedExpertProfile] = useState<ExpertProfile | null>(null)
  const [selectedExpertContent, setSelectedExpertContent] = useState<ExpertContent[]>([])
  const [contentSourceExpert, setContentSourceExpert] = useState<{ id: string; name: string; slug: string } | null>(
    null,
  )
  const [isAddContentOpen, setIsAddContentOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [masterclassesEnabled, setMasterclassesEnabled] = useState(false)

  const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
  const [deletingContent, setDeletingContent] = useState<ContentItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Content filters
  const [contentSearch, setContentSearch] = useState("")
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all")
  const [contentCategoryFilter, setContentCategoryFilter] = useState<string>("all")
  const [contentTagFilter, setContentTagFilter] = useState<string>("all")
  const [planView, setPlanView] = useState<"all" | "my">("all")
  const isMyPlanView = planView === "my"
  const [memberPlanId, setMemberPlanId] = useState<string | null>(null)

  // Expert filters
  const [expertSearch, setExpertSearch] = useState("")
  const [expertTagFilter, setExpertTagFilter] = useState<string>("all")

  const [experts, setExperts] = useState<ExpertData[]>(initialExperts)
  const [expertTags] = useState<string[]>(allExpertTags)

  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContent)
  const [totalContentCount, setTotalContentCount] = useState(totalContent)
  const [contentPage, setContentPage] = useState(initialPage)
  const [sponsoredItem, setSponsoredItem] = useState<ContentItem | null>(initialSponsoredItem ?? null)

  const totalContentPages = Math.ceil(totalContentCount / pageSize)

  useEffect(() => {
    setContentPage(1)
  }, [planView])

  // Add useEffect to handle deep-linking to experts without immediately scrolling
  useEffect(() => {
    const expertParam = searchParams.get("expert")
    const viewParam = searchParams.get("view")

    if (expertParam || viewParam === "experts") {
      setActiveView("experts")
    }
  }, [searchParams])

  useEffect(() => {
    const expertSlug = searchParams.get("expert")
    if (!expertSlug) return
    if (didPrefillExpertRef.current) return

    // Find matching expert by slug from initialExperts or experts
    const foundExpert = initialExperts.find((e) => e.slug === expertSlug) || experts.find((e) => e.slug === expertSlug)
    if (!foundExpert) return

    setExpertSearch(foundExpert.name)
    didPrefillExpertRef.current = true
  }, [searchParams, initialExperts, experts])

  useEffect(() => {
    const fetchPlan = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setMemberPlanId(null)
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("plan_id")
        .eq("id", user.id)
        .single()

      setMemberPlanId(data?.plan_id ?? null)
    }

    fetchPlan()
  }, [])

  useEffect(() => {
    const fetchMasterclassesConfig = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase
        .from("site_settings")
        .select("member_navigation")
        .limit(1)
        .maybeSingle()

      if (!data?.member_navigation) return

      let nav: Array<{ id?: string; visible?: boolean }> = []
      if (Array.isArray(data.member_navigation)) {
        nav = data.member_navigation
      } else if (typeof data.member_navigation === "string") {
        try {
          nav = JSON.parse(data.member_navigation)
        } catch {
          return
        }
      }

      const masterclassesItem = nav.find((item) => item.id === "masterclasses")
      if (masterclassesItem && masterclassesItem.visible === true) {
        setMasterclassesEnabled(true)
      }
    }
    fetchMasterclassesConfig()
  }, [])

  // Helper to open content modal
  const openContentModal = (slug: string) => {
    setSelectedContentSlug(slug)
    handleOpenContentModal(slug)
  }

  useEffect(() => {
    const fetchContent = async () => {
      const result = await getContentList({
        search: contentSearch || undefined,
        contentType: contentTypeFilter !== "all" ? contentTypeFilter : undefined,
        category: contentCategoryFilter !== "all" ? contentCategoryFilter : undefined,
        tag: contentTagFilter !== "all" ? contentTagFilter : undefined,
        page: contentPage,
        pageSize,
        includeAll: planView === "my",
      })

      setContentItems(result.items)
      setTotalContentCount(result.total)
      setSponsoredItem(result.sponsoredItem ?? null)
    }

    fetchContent()
  }, [contentSearch, contentTypeFilter, contentCategoryFilter, contentTagFilter, contentPage, pageSize, planView])

  // Filter experts based on search and tag filter
  const filteredExperts = experts.filter((expert) => {
    const matchesSearch = expert.name.toLowerCase().includes(expertSearch.toLowerCase())
    const matchesTag = expertTagFilter === "all" || (expert.tags ?? []).includes(expertTagFilter)
    return matchesSearch && matchesTag
  })

  // Handle expert search/filter changes - refetch from server
  useEffect(() => {
    const fetchExperts = async () => {
      const result = await getExpertsList({
        search: expertSearch || undefined,
        tag: expertTagFilter !== "all" ? expertTagFilter : undefined,
      })
      setExperts(result.items)
    }
    // Only fetch if filters have changed from initial state
    if (expertSearch || expertTagFilter !== "all") {
      fetchExperts()
    } else {
      setExperts(initialExperts)
    }
  }, [expertSearch, expertTagFilter, initialExperts])

  // Handle opening expert modal - fetch full profile and content
  const handleOpenExpertModal = async (slug: string) => {
    // Ensure selectedExpertSlug is updated before fetching
    setSelectedExpertSlug(slug)
    const profile = await getExpertBySlug(slug)
    if (!profile) return

    const content = await getContentByExpert(profile.id)
    setSelectedExpertProfile(profile)
    setSelectedExpertContent(content)
  }

  const handleCloseExpertModal = () => {
    setSelectedExpertSlug(null)
    setSelectedExpertProfile(null)
    setSelectedExpertContent([])
    setContentSourceExpert(null)
  }

  const handleOpenContentModal = async (slug: string) => {
    setSelectedContentSlug(slug)
    const detail = await getContentBySlug(slug)
    setSelectedContentDetail(detail)
  }

  const handleCloseContentModal = () => {
    setSelectedContentSlug(null)
    setSelectedContentDetail(null)
    setContentSourceExpert(null)
  }

  const handleOpenContentFromExpert = async (slug: string) => {
    if (!selectedExpertProfile) return

    // Store the expert info before closing
    setContentSourceExpert({
      id: selectedExpertProfile.id,
      name: selectedExpertProfile.name,
      slug: selectedExpertProfile.slug,
    })

    // Close expert modal
    setSelectedExpertProfile(null)
    setSelectedExpertContent([])

    // Open content modal
    const content = await getContentBySlug(slug)
    if (!content) return
    setSelectedContentDetail(content)
  }

  const handleBackToExpert = async () => {
    if (!contentSourceExpert) return

    // Close content modal
    setSelectedContentDetail(null)

    // Reopen expert modal with the stored expert data
    const profile = await getExpertBySlug(contentSourceExpert.slug)
    if (!profile) return

    const content = await getContentByExpert(profile.id)
    setSelectedExpertProfile(profile)
    setSelectedExpertContent(content)

    // Clear the source expert tracker
    setContentSourceExpert(null)
  }

  const handleContentSuccess = async () => {
    const result = await getContentList({
      search: contentSearch || undefined,
      contentType: contentTypeFilter !== "all" ? contentTypeFilter : undefined,
      category: contentCategoryFilter !== "all" ? contentCategoryFilter : undefined,
      tag: contentTagFilter !== "all" ? contentTagFilter : undefined,
      page: contentPage,
      pageSize,
      includeAll: planView === "my",
    })

    setContentItems(result.items)
    setTotalContentCount(result.total)
    setSponsoredItem(result.sponsoredItem ?? null)
  }

  const handleEditContent = (content: ContentItem) => {
    setEditingContent(content)
    setIsAddContentOpen(true)
  }

  const handleDeleteContent = (content: ContentItem) => {
    setDeletingContent(content)
  }

  const confirmDelete = async () => {
    if (!deletingContent) return
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteEducationContent({ id: deletingContent.id })
      if (result.success) {
        setDeletingContent(null)
        // Re-fetch content list to reflect deletion
        const refreshedContent = await getContentList({
          search: contentSearch || undefined,
          contentType: contentTypeFilter !== "all" ? contentTypeFilter : undefined,
          category: contentCategoryFilter !== "all" ? contentCategoryFilter : undefined,
          tag: contentTagFilter !== "all" ? contentTagFilter : undefined,
          page: contentPage,
          pageSize,
          includeAll: planView === "my",
        })
        setContentItems(refreshedContent.items)
        setTotalContentCount(refreshedContent.total)
        setSponsoredItem(refreshedContent.sponsoredItem ?? null)
      } else {
        alert(result.error || "Failed to delete content")
      }
      setIsDeleting(false)
    })
  }

  const handleCloseAddModal = () => {
    setIsAddContentOpen(false)
    setEditingContent(null)
  }

  const filteredContentByPlan = contentItems.filter((item) => {
    let plans: string[] = []

    if (Array.isArray(item.plan_ids)) {
      plans = item.plan_ids
    } else if (typeof item.plan_ids === "string") {
      try {
        plans = JSON.parse(item.plan_ids)
      } catch {
        plans = []
      }
    }

    // PUBLIC CONTENT (no plans assigned)
    if (!plans || plans.length === 0) {
      return planView === "all"
    }

    // MY PLAN TAB
    if (planView === "my") {
      return memberPlanId ? plans.includes(memberPlanId) : false
    }

    // ALL CONTENT TAB
    return memberPlanId ? plans.includes(memberPlanId) : false
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">Explore expert content and connect with industry leaders</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 min-w-0">
          <button
            onClick={() => setActiveView("content")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
              activeView === "content" ? "text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
            style={
              activeView === "content"
                ? { backgroundColor: brandAccentColor, borderColor: brandAccentColor }
                : undefined
            }
          >
            <BookOpen className="w-8 h-8" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">Content Library</h3>
              <p className={activeView === "content" ? "text-white/80" : "text-gray-500"}>
                Browse articles, videos, and resources
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveView("experts")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
              activeView === "experts" ? "text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
            style={
              activeView === "experts"
                ? { backgroundColor: brandAccentColor, borderColor: brandAccentColor }
                : undefined
            }
          >
            <GraduationCap className="w-8 h-8" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">Expert Directory</h3>
              <p className={activeView === "experts" ? "text-white/80" : "text-gray-500"}>
                Connect with industry professionals
              </p>
            </div>
          </button>

          {masterclassesEnabled && (
            <button
              onClick={() => { window.location.href = "/members/masterclasses" }}
              className="p-6 rounded-xl border-2 bg-white border-gray-200 text-gray-900 hover:border-gray-300 transition-all duration-200 flex items-center gap-4"
            >
              <GraduationCap className="w-8 h-8 text-gray-700" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Masterclasses</h3>
                <p className="text-gray-500">
                  Academy Exclusive Masterclasses
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Content View */}
        {activeView === "content" && (
          <div>
            {/* Content Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 min-w-0">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name..."
                    value={contentSearch}
                    onChange={(e) => {
                      setContentSearch(e.target.value)
                      setContentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <div className="relative">
                  <select
                    value={contentTypeFilter}
                    onChange={(e) => {
                      setContentTypeFilter(e.target.value)
                      setContentPage(1)
                    }}
                    className="w-full h-10 px-3 pr-8 border border-gray-200 rounded-md bg-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Content Types</option>
                    {(contentFilters?.contentTypes ?? []).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={contentCategoryFilter}
                    onChange={(e) => {
                      setContentCategoryFilter(e.target.value)
                      setContentPage(1)
                    }}
                    className="w-full h-10 px-3 pr-8 border border-gray-200 rounded-md bg-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {(contentFilters?.categories ?? []).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>

                {/* Tag Filter */}
                <div className="relative">
                  <select
                    value={contentTagFilter}
                    onChange={(e) => {
                      setContentTagFilter(e.target.value)
                      setContentPage(1)
                    }}
                    className="w-full h-10 px-3 pr-8 border border-gray-200 rounded-md bg-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Tags</option>
                    {(contentFilters?.tags ?? []).map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              {/* Plan Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlanView("all")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    planView === "all"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Content
                </button>

                <button
                  onClick={() => setPlanView("my")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    planView === "my"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  My Plan
                </button>
              </div>

              {/* Add Content Button */}
              <Button
                onClick={() => {
                  if (canCreateContent) {
                    setIsAddContentOpen(true)
                  } else {
                    setIsUpgradeModalOpen(true)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>

            {filteredContentByPlan.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 mb-8 border border-gray-100 shadow-sm text-center">
                {planView === "my" ? (
                  <>
                    <p className="text-gray-700 text-lg font-medium">
                      There is No Plan Specific Content
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Content will appear here when it is assigned to your plan.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 text-lg">No content found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Try adjusting your filters or check back later
                    </p>
                  </>
                )}
              </div>
            ) : (
              <SpotlightSection
                items={
                  sponsoredItem
                    ? [sponsoredItem, ...filteredContentByPlan]
                    : filteredContentByPlan
                }
                CardComponent={({ item }) => (
                  <ContentCard
                    content={item}
                    onClick={() => openContentModal(item.slug)}
                    currentUserId={currentUserId}
                    onEdit={handleEditContent}
                    onDelete={handleDeleteContent}
                    brandAccentColor={brandAccentColor}
                    showFeaturedBadge={item.is_featured}
                  />
                )}
                onSponsorClick={(item) => openContentModal(item.slug)}
                brandAccentColor={brandAccentColor}
              />
            )}

            {/* Pagination */}
            {!isMyPlanView && totalContentPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mt-8 min-w-0">
                <Button
                  variant="outline"
                  onClick={() => setContentPage((p) => Math.max(1, p - 1))}
                  disabled={contentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {contentPage} of {totalContentPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setContentPage((p) => Math.min(totalContentPages, p + 1))}
                  disabled={contentPage === totalContentPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Experts View */}
        {activeView === "experts" && (
          <div>
            {/* Expert Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name..."
                    value={expertSearch}
                    onChange={(e) => setExpertSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Tag Filter */}
                <div className="relative">
                  <select
                    value={expertTagFilter}
                    onChange={(e) => setExpertTagFilter(e.target.value)}
                    className="w-full h-10 px-3 pr-8 border border-gray-200 rounded-md bg-white text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">All Expert Tags</option>
                    {(expertTags ?? []).map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
            {/* Experts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
              {filteredExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  onClick={() => handleOpenExpertModal(expert.slug)}
                  brandAccentColor={brandAccentColor}
                />
              ))}
            </div>
            {/* Empty State */}
            {filteredExperts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No experts found matching your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExpertProfileModal
        expert={selectedExpertProfile}
        content={selectedExpertContent}
        onClose={handleCloseExpertModal}
        onSelectContent={handleOpenContentFromExpert}
      />
      <ContentModal
        content={selectedContentDetail}
        sourceExpert={contentSourceExpert}
        onBackToExpert={handleBackToExpert}
        onClose={handleCloseContentModal}
      />

      <AddContentModal
        open={isAddContentOpen}
        onClose={handleCloseAddModal}
        contentCategories={contentCategories}
        contentTags={contentTags}
        onSuccess={handleContentSuccess}
        content={editingContent}
      />

      <UpgradeRequiredModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} context="content" upgradeLink={upgradeLink} />

      <Dialog open={!!deletingContent} onOpenChange={(open) => !open && setDeletingContent(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <div className="px-5 md:px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Delete Content</h2>
          </div>
          <div className="px-5 md:px-6 py-6">
            <p className="text-gray-600">Are you sure you want to delete this content? This action cannot be undone.</p>
          </div>
          <div className="px-5 md:px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingContent(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Content"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
