"use client"

import { useState, useEffect, useTransition } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import {
  createFeedPost,
  createFeedReply,
  reportFeedItem,
  getGuidelines,
  updateGuidelines,
  updateFeedComment,
  deleteFeedComment,
  getFeedPostsPage,
  getFeedRepliesForPosts,
  getCurrentUserProfile,
  getCommunityUiSettings,
} from "./actions"
import type { FeedPost, FeedReply } from "@/lib/types/community"

// simple classnames helper
function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ")
}

function ProfileAvatar({
  avatarUrl,
  displayName,
  size = "md",
}: {
  avatarUrl?: string | null
  displayName: string
  size?: "sm" | "md"
}) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-12 h-12"

  return (
    <Avatar className={sizeClasses}>
      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">{initials}</AvatarFallback>
    </Avatar>
  )
}

function ImageLightbox({
  imageUrl,
  isOpen,
  onClose,
}: {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>Full size image preview</DialogDescription>
        </DialogHeader>
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Full size preview"
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      </DialogContent>
    </Dialog>
  )
}

function DocumentViewer({
  documentUrl,
  fileName,
  isOpen,
  onClose,
}: {
  documentUrl: string
  fileName: string
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Preview</DialogTitle>
          <DialogDescription>{fileName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-20 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <i className="fa-solid fa-file-pdf text-red-600 text-2xl" />
          </div>
          <p className="text-gray-700 font-medium mb-4">{fileName}</p>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Open in New Tab
          </a>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GuidelinesModal({
  isOpen,
  onClose,
  content,
}: {
  isOpen: boolean
  onClose: () => void
  content: string
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Community Guidelines</DialogTitle>
          <DialogDescription>Please follow these rules when participating in the community</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="bg-gray-50 rounded-lg p-6">
            <div
              className="prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{
                __html: content.replace(/\n/g, "<br />")
              }}
            />
          </div>
        </div>
        <div className="border-t border-gray-200 px-6 py-4 bg-white flex items-center space-x-2">
          <input
            type="checkbox"
            id="hide-guidelines"
            onChange={(e) => {
              if (e.target.checked) {
                localStorage.setItem("hideCommunityGuidelines", "true")
              } else {
                localStorage.removeItem("hideCommunityGuidelines")
              }
            }}
          />
          <label htmlFor="hide-guidelines" className="text-sm text-gray-600">
            Don&apos;t show again
          </label>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditCommentModal({
  isOpen,
  onClose,
  currentBody,
  onSave,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  currentBody: string
  onSave: (newBody: string) => void
  isPending: boolean
}) {
  const [editedBody, setEditedBody] = useState(currentBody)

  useEffect(() => {
    if (isOpen) {
      setEditedBody(currentBody)
    }
  }, [isOpen, currentBody])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogDescription>Update your comment text below</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={10} // Changed from 5 to 10
            placeholder="Enter your comment..."
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedBody)}
            disabled={!editedBody.trim() || isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Comment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

function getVideoEmbedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // YouTube: youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.has("v")) {
      const videoId = urlObj.searchParams.get("v")
      return `https://www.youtube.com/embed/${videoId}`
    }

    // YouTube short: youtu.be/VIDEO_ID
    if (urlObj.hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1)
      return `https://www.youtube.com/embed/${videoId}`
    }

    // Vimeo: vimeo.com/VIDEO_ID
    if (urlObj.hostname.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").filter(Boolean).pop()
      return `https://player.vimeo.com/video/${videoId}`
    }

    // Loom: loom.com/share/VIDEO_ID
    if (urlObj.hostname.includes("loom.com") && urlObj.pathname.includes("/share/")) {
      const videoId = urlObj.pathname.split("/share/").pop()?.split("?")[0]
      return `https://www.loom.com/embed/${videoId}`
    }

    // Unsupported video URL
    return null
  } catch {
    return null
  }
}

// ---- Page (wired to comments table) ----
export default function CommunityPage() {
  const [isPending, startTransition] = useTransition()
  const [nextCursor, setNextCursor] = useState<{ created_at: string; id: string } | null>(null)

  // User state
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email: string
    display_name: string
    avatar_url: string | null
    is_creator?: boolean
  } | null>(null)

  const [posts, setPosts] = useState<FeedPost[]>([])
  const [postReplies, setPostReplies] = useState<Record<string, FeedReply[]>>({})
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // UI state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTargetId, setReportTargetId] = useState<string | null>(null)
  const [reportDetails, setReportDetails] = useState("")

  const [showPhotoInput, setShowPhotoInput] = useState(false)
  const [showDocumentInput, setShowDocumentInput] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState("")
  const [documentName, setDocumentName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [postContent, setPostContent] = useState("")

  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [documentViewer, setDocumentViewer] = useState<{ url: string; name: string } | null>(null)
  const [photoFilePreviewUrl, setPhotoFilePreviewUrl] = useState<string | null>(null)
  const [documentFilePreviewUrl, setDocumentFilePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile)
      setPhotoFilePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPhotoFilePreviewUrl(null)
    }
  }, [photoFile])

  useEffect(() => {
    if (documentFile) {
      const url = URL.createObjectURL(documentFile)
      setDocumentFilePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setDocumentFilePreviewUrl(null)
    }
  }, [documentFile])

  // Reply input state per post
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})

  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false)
  const [guidelinesContent, setGuidelinesContent] = useState("")
  const [brandBackgroundColor, setBrandBackgroundColor] = useState<string | null>(null)
  const [brandAccentColor, setBrandAccentColor] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState("Member Feed")

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editTargetBody, setEditTargetBody] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [editGuidelinesOpen, setEditGuidelinesOpen] = useState(false)
  const [editedGuidelines, setEditedGuidelines] = useState("")

  const refreshFeed = async () => {
    const { posts: pagePosts, nextCursor: nc } = await getFeedPostsPage({ limit: 20, cursor: null })
    setPosts(pagePosts)
    setNextCursor(nc)
    if (pagePosts.length > 0) {
      const repliesMap = await getFeedRepliesForPosts(pagePosts.map((p) => p.id))
      setPostReplies(repliesMap)
    } else {
      setPostReplies({})
    }
  }

  const handleLoadMore = async () => {
    if (!nextCursor) return
    setIsLoadingMore(true)
    try {
      const { posts: pagePosts, nextCursor: nc } = await getFeedPostsPage({
        limit: 20,
        cursor: nextCursor,
      })
      if (pagePosts.length === 0) {
        setNextCursor(null)
        return
      }
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newPosts = pagePosts.filter((p) => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })
      setNextCursor(nc)
      const newIds = pagePosts.map((p) => p.id)
      const repliesMap = await getFeedRepliesForPosts(newIds)
      setPostReplies((prev) => ({ ...prev, ...repliesMap }))
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Fetch current user, posts, and settings on mount
  useEffect(() => {
    async function init() {
      const profile = await getCurrentUserProfile()
      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          is_creator: profile.is_creator,
        })
      }

      const uiSettings = await getCommunityUiSettings()
      if (uiSettings.brand_background_color) {
        setBrandBackgroundColor(uiSettings.brand_background_color)
      }
      if (uiSettings.brand_accent_color) {
        setBrandAccentColor(uiSettings.brand_accent_color)
      }
      if (uiSettings.member_navigation) {
        try {
          const navItems =
            typeof uiSettings.member_navigation === "string"
              ? JSON.parse(uiSettings.member_navigation)
              : uiSettings.member_navigation
          const communityNav = navItems.find((item: { id?: string }) => item.id === "community")

          if (communityNav?.children && Array.isArray(communityNav.children)) {
            const feedChild = communityNav.children.find((c: { id?: string; label?: string }) => c.id === "community_feed")
            if (feedChild?.label) {
              setPageTitle(feedChild.label)
            }
          }
        } catch (e) {
          // Keep default title on parse error
        }
      }

      const guidelines = await getGuidelines()
      setGuidelinesContent(guidelines)

      const { posts: pagePosts, nextCursor: nc } = await getFeedPostsPage({ limit: 20, cursor: null })
      setPosts(pagePosts)
      setNextCursor(nc)
      if (pagePosts.length > 0) {
        const repliesMap = await getFeedRepliesForPosts(pagePosts.map((p) => p.id))
        setPostReplies(repliesMap)
      } else {
        setPostReplies({})
      }

      setLoading(false)
    }

    init()
  }, [])

  useEffect(() => {
    const hasSeen = localStorage.getItem("hideCommunityGuidelines")
    if (!hasSeen && guidelinesContent) {
      setShowGuidelinesModal(true)
    }
  }, [guidelinesContent])

  useEffect(() => {
    if (editGuidelinesOpen) {
      setEditedGuidelines(guidelinesContent)
    }
  }, [editGuidelinesOpen, guidelinesContent])

  const openReportModal = (id: string) => {
    setReportTargetId(id)
    setReportDetails("")
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!reportTargetId) return

    startTransition(async () => {
      const result = await reportFeedItem(reportTargetId, reportDetails || "")
      if (result.success) {
        setShowReportModal(false)
        // Reload feed - reported item will disappear
        await refreshFeed()
      } else {
        alert(result.error || "Failed to submit report")
      }
    })
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    const supabase = getSupabaseBrowserClient()
    const formData = new FormData()
    formData.set("body", postContent)

    if (photoFile) {
      const path = `images/${crypto.randomUUID()}-${photoFile.name}`
      const { error } = await supabase.storage
        .from("feed-content")
        .upload(path, photoFile, {
          upsert: false,
          contentType: photoFile.type,
        })
      if (error) {
        alert("Image upload failed")
        return
      }
      const { data } = supabase.storage.from("feed-content").getPublicUrl(path)
      formData.set("imageUrl", data.publicUrl)
    } else if (photoUrl) {
      formData.set("imageUrl", photoUrl)
    }

    if (documentFile) {
      const path = `documents/${crypto.randomUUID()}-${documentFile.name}`
      const { error } = await supabase.storage
        .from("feed-content")
        .upload(path, documentFile, {
          upsert: false,
          contentType: documentFile.type,
        })
      if (error) {
        alert("Document upload failed")
        return
      }
      const { data } = supabase.storage.from("feed-content").getPublicUrl(path)
      formData.set("documentUrl", data.publicUrl)
      formData.set("documentName", documentFile.name)
    } else if (documentUrl) {
      formData.set("documentUrl", documentUrl)
      if (documentName) formData.set("documentName", documentName)
    }

    if (linkUrl) formData.set("linkUrl", linkUrl)
    if (videoUrl) formData.set("videoUrl", videoUrl)
    if (videoTitle) formData.set("videoTitle", videoTitle)

    startTransition(async () => {
      const result = await createFeedPost(formData)
      if (result.success) {
        setPostContent("")
        setPhotoUrl("")
        setPhotoFile(null)
        setDocumentFile(null)
        setDocumentUrl("")
        setDocumentName("")
        setLinkUrl("")
        setVideoUrl("")
        setVideoTitle("")
        setShowPhotoInput(false)
        setShowDocumentInput(false)
        setShowLinkInput(false)
        setShowVideoInput(false)
        // Reload feed
        await refreshFeed()
      } else {
        alert(result.error || "Failed to create post")
      }
    })
  }

  const handleCreateReply = async (postId: string) => {
    const content = replyInputs[postId]
    if (!content?.trim()) return

    startTransition(async () => {
      const result = await createFeedReply(postId, content)
      if (result.success) {
        setReplyInputs((prev) => ({ ...prev, [postId]: "" }))
        // Reload feed
        await refreshFeed()
      } else {
        alert(result.error || "Failed to create reply")
      }
    })
  }

  const getFilenameFromUrl = (url: string) => {
    try {
      const pathname = new URL(url).pathname
      return pathname.split("/").pop() || "document.pdf"
    } catch {
      return "document.pdf"
    }
  }

  const handleEditComment = (commentId: string, currentBody: string) => {
    setEditTargetId(commentId)
    setEditTargetBody(currentBody)
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (newBody: string) => {
    if (!editTargetId || !newBody.trim()) return

    startTransition(async () => {
      const result = await updateFeedComment(editTargetId, newBody)
      if (result.success) {
        setEditModalOpen(false)
        setEditTargetId(null)
        setEditTargetBody("")
        await refreshFeed()
      } else {
        alert(result.error || "Failed to update comment")
      }
    })
  }

  const handleDeleteComment = (commentId: string) => {
    setDeleteTargetId(commentId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return

    startTransition(async () => {
      const result = await deleteFeedComment(deleteTargetId)
      if (result.success) {
        setDeleteModalOpen(false)
        setDeleteTargetId(null)
        await refreshFeed()
      } else {
        alert(result.error || "Failed to delete comment")
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Create Post */}
      <section id="create-post" className="px-4 sm:px-6 lg:px-8 py-6 bg-white border-b border-gray-200">
        <div className="w-full">
          <div className="flex items-center justify-end mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGuidelinesModal(true)}
                className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center space-x-1"
              >
                <i className="fa-solid fa-circle-info" />
                <span>Member Feed Rules &amp; Guidelines</span>
              </button>
              {currentUser?.is_creator && (
                <button
                  onClick={() => setEditGuidelinesOpen(true)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <i className="fa-solid fa-pen" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <ProfileAvatar displayName={currentUser?.display_name || "Guest"} avatarUrl={currentUser?.avatar_url} />
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <textarea
                  placeholder={currentUser ? "Share something with the community..." : "Log in to share something..."}
                  className="w-full bg-transparent resize-none outline-none text-gray-700 placeholder-gray-500"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  disabled={!currentUser}
                />

                {showPhotoInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fa-solid fa-image text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Add Photo URL</span>
                      <button
                        onClick={() => {
                          setShowPhotoInput(false)
                          setPhotoUrl("")
                          setPhotoFile(null)
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById("photo-upload-input")?.click()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <i className="fa-solid fa-upload"></i>
                        Upload Image
                      </button>
                      {photoFile && (
                        <span className="text-sm text-gray-600">
                          {photoFile.name}
                        </span>
                      )}
                    </div>
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setPhotoFile(file)
                      }}
                      className="hidden"
                    />
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(photoUrl || photoFile) && (
                      <div className="mt-3">
                        <img
                          src={photoFilePreviewUrl || photoUrl || "/placeholder.svg"}
                          alt="Preview"
                          className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: "400px" }}
                          onClick={() => setLightboxImage(photoFilePreviewUrl || photoUrl)}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {showDocumentInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fa-solid fa-file text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Add Document URL</span>
                      <button
                        onClick={() => {
                          setShowDocumentInput(false)
                          setDocumentUrl("")
                          setDocumentName("")
                          setDocumentFile(null)
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById("document-upload-input")?.click()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <i className="fa-solid fa-upload"></i>
                        Upload Document
                      </button>
                      {documentFile && (
                        <span className="text-sm text-gray-600">
                          {documentFile.name}
                        </span>
                      )}
                    </div>
                    <input
                      id="document-upload-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setDocumentFile(file)
                      }}
                      className="hidden"
                    />
                    <input
                      type="url"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Document name (optional)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(documentUrl || documentFile) && (
                      <div
                        className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() =>
                          setDocumentViewer({
                            url: documentFilePreviewUrl || documentUrl,
                            name: documentName || (documentFile ? documentFile.name : getFilenameFromUrl(documentUrl)),
                          })
                        }
                      >
                        <div className="w-10 h-12 bg-red-100 rounded flex items-center justify-center">
                          <i className="fa-solid fa-file-pdf text-red-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {documentName || (documentFile ? documentFile.name : getFilenameFromUrl(documentUrl))}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {showLinkInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fa-solid fa-link text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Add Link URL</span>
                      <button
                        onClick={() => {
                          setShowLinkInput(false)
                          setLinkUrl("")
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {linkUrl && (
                      <div className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-12 bg-blue-100 rounded flex items-center justify-center">
                          <i className="fa-solid fa-link text-blue-600" />
                        </div>
                        <span className="text-sm text-blue-600 font-medium truncate">{linkUrl}</span>
                      </div>
                    )}
                  </div>
                )}

                {showVideoInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="fa-solid fa-video text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Add Video URL</span>
                      <button
                        onClick={() => {
                          setShowVideoInput(false)
                          setVideoUrl("")
                          setVideoTitle("")
                        }}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Video title (optional)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {videoUrl && getVideoEmbedUrl(videoUrl) && (
                      <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg">
                        <iframe
                          src={getVideoEmbedUrl(videoUrl)!}
                          className="h-full w-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    )}
                    {videoUrl && !getVideoEmbedUrl(videoUrl) && (
                      <p className="mt-2 text-sm text-amber-600">Supported: YouTube, Vimeo, Loom</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setShowPhotoInput(!showPhotoInput)
                        setShowDocumentInput(false)
                        setShowLinkInput(false)
                        setShowVideoInput(false)
                      }}
                      disabled={!currentUser}
                      className={cx(
                        "flex items-center px-3 py-2 rounded-lg transition-colors",
                        showPhotoInput ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200",
                        !currentUser && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <i className="fa-solid fa-image mr-2" />
                      Photo
                    </button>
                    <button
                      onClick={() => {
                        setShowDocumentInput(!showDocumentInput)
                        setShowPhotoInput(false)
                        setShowLinkInput(false)
                        setShowVideoInput(false)
                      }}
                      disabled={!currentUser}
                      className={cx(
                        "flex items-center px-3 py-2 rounded-lg transition-colors",
                        showDocumentInput ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200",
                        !currentUser && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <i className="fa-solid fa-file mr-2" />
                      Document
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkInput(!showLinkInput)
                        setShowPhotoInput(false)
                        setShowDocumentInput(false)
                        setShowVideoInput(false)
                      }}
                      disabled={!currentUser}
                      className={cx(
                        "flex items-center px-3 py-2 rounded-lg transition-colors",
                        showLinkInput ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200",
                        !currentUser && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <i className="fa-solid fa-link mr-2" />
                      Link
                    </button>
                    <button
                      onClick={() => {
                        setShowVideoInput(!showVideoInput)
                        setShowPhotoInput(false)
                        setShowDocumentInput(false)
                        setShowLinkInput(false)
                      }}
                      disabled={!currentUser}
                      className={cx(
                        "flex items-center px-3 py-2 rounded-lg transition-colors",
                        showVideoInput ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-200",
                        !currentUser && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <i className="fa-solid fa-video mr-2" />
                      Video
                    </button>
                  </div>
                  <button
                    onClick={handleCreatePost}
                    disabled={!currentUser || !postContent.trim() || isPending}
                    className={cx(
                      "px-6 py-2 bg-blue-600 text-white rounded-lg font-medium",
                      "hover:bg-blue-700 transition-colors",
                      (!currentUser || !postContent.trim() || isPending) && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {isPending ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Left column: Member Feed */}
          <div className="flex-1 min-w-0">
            <section id="member-feed">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">{pageTitle}</h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <i className="fa-solid fa-comments text-gray-300 text-4xl mb-4"></i>
                  <p className="text-gray-600">No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <ProfileAvatar
                          displayName={post.author?.name || "Unknown"}
                          avatarUrl={post.author?.avatar_url}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{post.author?.name || "Unknown"}</h3>
                              <p className="text-sm text-gray-500">{formatRelativeTime(post.created_at)}</p>
                            </div>
                            {currentUser?.id === post.author_id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-600 p-1">
                                    <i className="fa-solid fa-ellipsis-vertical" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditComment(post.id, post.body)}>
                                    <i className="fa-solid fa-pen mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(post.id)}
                                    className="text-red-600"
                                  >
                                    <i className="fa-solid fa-trash mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="mt-3 text-gray-700 whitespace-pre-wrap [overflow-wrap:anywhere]">{post.body}</p>

                          {/* Image attachment */}
                          {post.image_url && (
                            <div className="mt-4">
                              <img
                                src={post.image_url || "/placeholder.svg"}
                                alt="Post attachment"
                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: "400px" }}
                                onClick={() => setLightboxImage(post.image_url!)}
                              />
                            </div>
                          )}

                          {/* Document attachment */}
                          {post.document_url && (
                            <div
                              className="mt-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() =>
                                setDocumentViewer({
                                  url: post.document_url!,
                                  name: post.document_name || getFilenameFromUrl(post.document_url!),
                                })
                              }
                            >
                              <div className="w-10 h-12 bg-red-100 rounded flex items-center justify-center">
                                <i className="fa-solid fa-file-pdf text-red-600" />
                              </div>
                              <span className="text-sm text-gray-700 font-medium">
                                {post.document_name || getFilenameFromUrl(post.document_url!)}
                              </span>
                            </div>
                          )}

                          {post.link_url && (
                            <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-10 h-12 bg-blue-100 rounded flex items-center justify-center">
                                <i className="fa-solid fa-link text-blue-600" />
                              </div>
                              <a
                                href={post.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium truncate"
                              >
                                {post.link_url}
                              </a>
                            </div>
                          )}

                          {post.video_url &&
                            (() => {
                              const embedUrl = getVideoEmbedUrl(post.video_url)
                              return embedUrl ? (
                                <div className="mt-4">
                                  {post.video_title && (
                                    <p className="text-sm font-medium text-gray-700 mb-2">{post.video_title}</p>
                                  )}
                                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                                    <iframe
                                      src={embedUrl}
                                      className="h-full w-full"
                                      allowFullScreen
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                  </div>
                                </div>
                              ) : null
                            })()}

                          <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
                            <button className="flex items-center space-x-1 hover:text-blue-600">
                              <i className="fa-regular fa-comment" />
                              <span>{postReplies[post.id]?.length || 0} comments</span>
                            </button>

                            <button
                              className="flex items-center space-x-1 hover:text-red-600"
                              onClick={() => openReportModal(post.id)}
                            >
                              <i className="fa-regular fa-flag" />
                              <span>Report</span>
                            </button>
                          </div>

                          {/* Replies */}
                          {postReplies[post.id] && postReplies[post.id].length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 ml-0 sm:ml-12">
                              {postReplies[post.id].map((reply) => (
                                <div key={reply.id} className="flex items-start space-x-3">
                                  <ProfileAvatar
                                    displayName={reply.author?.name || "Unknown"}
                                    avatarUrl={reply.author?.avatar_url}
                                    size="sm"
                                  />
                                  <div
                                    className="flex-1 rounded-lg p-3 border border-black/5 shadow-sm"
                                    style={{
                                      backgroundColor: brandBackgroundColor ? `${brandBackgroundColor}14` : "#f9fafb",
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {reply.author?.name || "Unknown"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatRelativeTime(reply.created_at)}
                                        </span>
                                      </div>
                                      {currentUser?.id === reply.author_id && (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button className="text-gray-400 hover:text-gray-600 p-1 text-xs">
                                              <i className="fa-solid fa-ellipsis-vertical" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditComment(reply.id, reply.body)}>
                                              <i className="fa-solid fa-pen mr-2 text-xs" />
                                              <span className="text-xs">Edit</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteComment(reply.id)}
                                              className="text-red-600"
                                            >
                                              <i className="fa-solid fa-trash mr-2 text-xs" />
                                              <span className="text-xs">Delete</span>
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                                      {reply.body}
                                    </p>
                                    <div className="mt-2">
                                      <button
                                        onClick={() => openReportModal(reply.id)}
                                        className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center space-x-1"
                                      >
                                        <i className="fa-regular fa-flag" />
                                        <span>Report</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply input */}
                          {currentUser && (
                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                              <ProfileAvatar
                                displayName={currentUser.display_name}
                                avatarUrl={currentUser.avatar_url}
                                size="sm"
                              />
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={replyInputs[post.id] || ""}
                                onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleCreateReply(post.id)
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleCreateReply(post.id)}
                                disabled={!replyInputs[post.id]?.trim() || isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {posts.length > 0 && nextCursor && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? "Loading..." : "Load More Posts"}
                  </button>
                </div>
              )}
            </section>
          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 mt-8 lg:mt-0 space-y-6">
            {/* Card 1: Community Context */}
            <div className="bg-blue-50 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <i className="fa-solid fa-users text-blue-600" />
                <h3 className="font-semibold text-gray-800">About the Member Feed</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                This is the main conversation space for the community. It's here to help members connect, contribute,
                and learn together.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start space-x-2">
                  <span>💬</span>
                  <span>Start conversations — ask questions or share ideas</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>Share insights — lessons learned, wins, or breakthroughs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🔗</span>
                  <span>Post resources — tools, links, or content others may find useful</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🤝</span>
                  <span>Engage thoughtfully — comment, encourage, and support others</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 italic">
                The strongest communities grow through participation, not perfection.
              </p>
            </div>

            {/* Card 2: Inspiration Box */}
            <div className="bg-amber-50 rounded-xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <i className="fa-solid fa-lightbulb text-amber-600" />
                <h3 className="font-semibold text-gray-800">Need a Conversation Starter?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Not sure what to post? Try one of these prompts:</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-start space-x-2">
                  <span>💡</span>
                  <span>What's something you learned this week that surprised you?</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🚀</span>
                  <span>What's one win — big or small — you've had recently?</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>❓</span>
                  <span>What are you currently thinking through or working on?</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🛠</span>
                  <span>What tool, resource, or workflow are you finding helpful right now?</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🔄</span>
                  <span>What's something you're actively improving in your business or life?</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500 italic">
                There's no "right" post — sharing helps the whole community.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
          <p>&copy; 2026 Community Platform. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-gray-700 transition-colors">
              Help Center
            </a>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxImage && <ImageLightbox imageUrl={lightboxImage} isOpen={true} onClose={() => setLightboxImage(null)} />}

      {/* Document Viewer */}
      {documentViewer && (
        <DocumentViewer
          documentUrl={documentViewer.url}
          fileName={documentViewer.name}
          isOpen={true}
          onClose={() => setDocumentViewer(null)}
        />
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Report Content</h2>
              <p className="text-sm text-gray-600 mb-4">
                Help us keep this community safe. Please let us know why you're reporting this content.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Reporting Guidelines:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Harassment or bullying behavior</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Spam or misleading content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Inappropriate or offensive material</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Violates community guidelines</span>
                  </li>
                </ul>
              </div>

              <textarea
                placeholder="Additional details (optional)..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />

              <p className="text-xs text-gray-500 mb-4">
                Your report will be reviewed by our moderation team. The reported content will be hidden from your feed
                immediately.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Report Content"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EditCommentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditTargetId(null)
          setEditTargetBody("")
        }}
        currentBody={editTargetBody}
        onSave={handleSaveEdit}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteTargetId(null)
        }}
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />

      {/* Guidelines Modal */}
      <GuidelinesModal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
        content={guidelinesContent}
      />

      {editGuidelinesOpen && (
        <Dialog open={true} onOpenChange={() => setEditGuidelinesOpen(false)}>
          <DialogContent className="w-full max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Community Guidelines</DialogTitle>
            </DialogHeader>

            <textarea
              value={editedGuidelines}
              onChange={(e) => setEditedGuidelines(e.target.value)}
              className="w-full min-h-[500px] border rounded-lg p-6 text-base leading-relaxed resize-none"
            />

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setEditGuidelinesOpen(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const result = await updateGuidelines(editedGuidelines)
                  if (result.success) {
                    setGuidelinesContent(editedGuidelines)
                    setEditGuidelinesOpen(false)
                  } else {
                    alert(result.error || "Failed to update")
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
