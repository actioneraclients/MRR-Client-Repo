"use client"

import type React from "react"

import { useState, useEffect, useTransition, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { updateFeedComment, deleteFeedComment } from "@/app/members/community/actions"
import {
  getGroupFeedPosts,
  getGroupFeedReplies,
  createGroupFeedPost,
  createGroupFeedReply,
  reportGroupFeedItem,
  deleteGroupFeedPost,
  curateGroupVideo,
  getGroupEvents,
  updateGroupEvent,
  publishGroupEvent,
  deleteGroupEvent, // Add deleteGroupEvent import
  createGroupEvent, // Import createGroupEvent
  getGroupMediaCounts,
  sendGroupMessage,
  pinGroupPost,
  unpinGroupPost,
  toggleFeaturePost,
} from "./actions"
import { updateGroup } from "@/actions/groups/update-group"
import { uploadGroupAvatar } from "@/actions/groups/upload-group-avatar"
import { uploadGroupHeaderImage } from "@/actions/groups/upload-group-header-image"
import type { FeedPost, FeedReply } from "@/lib/types/community"

interface GroupEvent {
  id: string
  group_id: string
  created_by: string
  title: string
  event_type: string
  start_at: string
  // Changed 'end_date' to 'end_at'
  end_at: string | null
  description: string | null
  intention: string | null
  image_url: string | null
  access_details: string | null
  additional_info_link: string | null
  status: string
  created_at: string
}

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
      <AvatarFallback className="bg-green-100 text-green-600 text-sm font-medium">{initials}</AvatarFallback>
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Open in New Tab
          </a>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogDescription>Update your comment text below</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={5}
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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

function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return pathname.split("/").pop() || "Document"
  } catch {
    return "Document"
  }
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

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string
  const supabase = getSupabaseBrowserClient()
  const [isPending, startTransition] = useTransition()

  const [isJoined, setIsJoined] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())

  const [group, setGroup] = useState<{
    name: string
    description: string | null
    visibility: string
    created_by: string
    allow_member_posts: boolean | null
    require_post_approval: boolean | null
    allow_member_events: boolean | null
    allow_member_invites: boolean | null
    avatar_url: string | null // Added avatar_url to group state
    header_url: string | null // Added header_url to group state
    updated_at: string | null // Added updated_at for cache-busting
  } | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)
  const [memberCount, setMemberCount] = useState<number>(0)
  const [members, setMembers] = useState<any[]>([])
  const [brandColor, setBrandColor] = useState<string | undefined>(undefined)
  const [brandAccentColor, setBrandAccentColor] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState<string>("Community")

  const [currentUser, setCurrentUser] = useState<{
    id: string
    email: string
    display_name: string
    avatar_url: string | null
  } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isGroupOwner, setIsGroupOwner] = useState(false)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [eventForm, setEventForm] = useState({
    name: "", // This will be used for the Event Name field when creating an event.
    eventType: "",
    startDate: "",
    // Changed 'endDate' to 'endTime' in eventForm state
    endDate: "",
    description: "",
    intention: "",
    imageUrl: "",
    accessDetails: "",
    additionalInfoLink: "",
    status: "draft",
  })
  const [eventSubmitting, setEventSubmitting] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)

  const [curateModalOpen, setCurateModalOpen] = useState(false)
  const [curatePost, setCuratePost] = useState<FeedPost | null>(null)
  const [curateMediaTitle, setCurateMediaTitle] = useState("")
  const [curateLoading, setCurateLoading] = useState(false)

  const PAGE_SIZE = 20
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [postReplies, setPostReplies] = useState<Record<string, FeedReply[]>>({})
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const [postContent, setPostContent] = useState("")
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

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTargetId, setReportTargetId] = useState<string | null>(null)
  const [reportDetails, setReportDetails] = useState("")

  // Reply input state per post
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})

  const [groupEvents, setGroupEvents] = useState<GroupEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<GroupEvent[]>([])
  const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(true)

  const [selectedEvent, setSelectedEvent] = useState<GroupEvent | null>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventDetailsForm, setEventDetailsForm] = useState({
    name: "", // This is for the event name field in the edit modal
    eventType: "",
    startDate: "",
    // Changed 'endDate' to 'endTime' in eventDetailsForm state
    endDate: "",
    description: "",
    intention: "",
    imageUrl: "",
    accessDetails: "",
    additionalInfoLink: "",
  })
  const [eventDetailsSubmitting, setEventDetailsSubmitting] = useState(false)
  const [eventDetailsError, setEventDetailsError] = useState<string | null>(null)

  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [showEditEventsModal, setShowEditEventsModal] = useState(false)
  const [allGroupEvents, setAllGroupEvents] = useState<GroupEvent[]>([])
  const [editEventsLoading, setEditEventsLoading] = useState(false)
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<string | null>(null)

  type EventManagerMode = "list" | "create" | "edit"
  const [showEventManager, setShowEventManager] = useState(false)
  const [eventManagerMode, setEventManagerMode] = useState<EventManagerMode>("list")
  const [eventManagerSelectedEvent, setEventManagerSelectedEvent] = useState<GroupEvent | null>(null)
  const [eventManagerLoading, setEventManagerLoading] = useState(false)

  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [groupMessageModalOpen, setGroupMessageModalOpen] = useState(false)
  const [groupMessageBody, setGroupMessageBody] = useState("")
  const [isSendingGroupMessage, setIsSendingGroupMessage] = useState(false)
  const [editGroupForm, setEditGroupForm] = useState({
    name: "",
    description: "",
    visibility: "public",
    allowMemberPosts: true,
    requirePostApproval: false,
    allowMemberEvents: true,
    allowMemberInvites: true,
  })

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editTargetBody, setEditTargetBody] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [expandedPinnedPostId, setExpandedPinnedPostId] = useState<string | null>(null)
  const [mediaCounts, setMediaCounts] = useState<{
    feed: { videoCount: number; imageCount: number; documentCount: number; linkCount: number }
    featured: { videoCount: number; imageCount: number; documentCount: number; linkCount: number }
  }>({
    feed: { videoCount: 0, imageCount: 0, documentCount: 0, linkCount: 0 },
    featured: { videoCount: 0, imageCount: 0, documentCount: 0, linkCount: 0 },
  })

  const pinnedPost = posts.find((p) => (p as FeedPost & { is_pinned?: boolean }).is_pinned)
  const regularPosts = posts.filter((p) => !(p as FeedPost & { is_pinned?: boolean }).is_pinned)

  // Use a ref for the file input to trigger uploads
  const groupAvatarInputRef = useRef<HTMLInputElement>(null)
  const handleGroupAvatarClick = () => {
    groupAvatarInputRef.current?.click()
  }

  const avatarFormRef = useRef<HTMLFormElement>(null)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const headerFormRef = useRef<HTMLFormElement>(null)
  const headerFileInputRef = useRef<HTMLInputElement>(null)

  const handleGroupAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !groupId) return

    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadGroupAvatar(groupId, formData)

    if (result.success) {
      // Update group state with new avatar URL
      setGroup((prevGroup) =>
        prevGroup
          ? {
              ...prevGroup,
              avatar_url: result.avatarUrl,
            }
          : null,
      )
      // Reset the input value to allow uploading the same file again if needed
      event.target.value = ""
    } else {
      alert(result.error || "Failed to upload avatar")
    }
  }

  const handleCloseEventModal = () => {
    setEventModalOpen(false)
    setSelectedEvent(null)
    setEventDetailsError(null)
  }

  const closeMemberModal = () => {
    setSelectedMember(null)
  }

  useEffect(() => {
    async function fetchGroup() {
      setGroupLoading(true)
      const { data, error } = await supabase
        .from("groups")
        .select(
          "name, description, visibility, created_by, allow_member_posts, require_post_approval, allow_member_events, allow_member_invites, avatar_url, header_image_url, updated_at",
        )
        .eq("id", groupId)
        .single()

      if (!error && data) {
        setGroup(data)
        // Initialize editGroupForm with fetched group data
        setEditGroupForm({
          name: data.name || "",
          description: data.description || "",
          visibility: data.visibility || "public",
          allowMemberPosts: data.allow_member_posts ?? true,
          requirePostApproval: data.require_post_approval ?? false,
          allowMemberEvents: data.allow_member_events ?? true,
          allowMemberInvites: data.allow_member_invites ?? true,
        })

        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId)

        setMemberCount(count ?? 0)
      } else {
        setGroup(null)
      }
      setGroupLoading(false)
    }
    fetchGroup()
  }, [groupId, supabase])

  useEffect(() => {
    async function fetchMediaCounts() {
      if (!groupId) return
      const counts = await getGroupMediaCounts(groupId)
      setMediaCounts(counts)
    }
    fetchMediaCounts()
  }, [groupId])

  // Fetch member count
  useEffect(() => {
    async function fetchMemberCount() {
      if (!groupId) return
      try {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: "exact", head: true })
          .eq("group_id", groupId)
        setMemberCount(count ?? 0)
      } catch (error) {
        console.error("Error fetching member count:", error)
      }
    }
    fetchMemberCount()
  }, [groupId, supabase])

  useEffect(() => {
    async function fetchMembers() {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("group_members")
        .select("user_id, full_name, role, joined_at, avatar_url")
        .eq("group_id", groupId)

      if (!error && data) {
        const sorted = [...data].sort((a, b) => {
          const aIsMod = ["admin", "moderator"].includes(a.role)
          const bIsMod = ["admin", "moderator"].includes(b.role)
          if (aIsMod && !bIsMod) return -1
          if (!aIsMod && bIsMod) return 1
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        })

        setMembers(sorted.slice(0, 20))
      }
    }

    if (groupId) fetchMembers()
  }, [groupId])

  useEffect(() => {
    async function fetchSiteSettings() {
      if (!supabase) return
      const { data } = await supabase
        .from("site_settings")
        .select("brand_background_color, brand_accent_color, member_navigation")
        .single()
      if (data?.brand_background_color) {
        setBrandColor(data.brand_background_color)
      }
      if (data?.brand_accent_color) {
        setBrandAccentColor(data.brand_accent_color)
      }
      if (data?.member_navigation) {
        try {
          const navItems =
            typeof data.member_navigation === "string"
              ? JSON.parse(data.member_navigation)
              : data.member_navigation
          const communityNav = navItems.find((item: { id: string; label?: string }) => item.id === "community")
          if (communityNav?.label) setPageTitle(communityNav.label)
        } catch {
          /* keep default */
        }
      }
    }
    fetchSiteSettings()
  }, [supabase])

  useEffect(() => {
    async function fetchUserRole() {
      if (!currentUser || !group) return

      // Check if user is group owner
      setIsGroupOwner(group.created_by === currentUser.id)

      // Fetch user's membership role
      const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", currentUser.id)
        .single()

      setUserRole(membership?.role || null)
    }
    fetchUserRole()
  }, [currentUser, group, groupId, supabase])

  useEffect(() => {
    async function fetchUpcomingEvents() {
      if (!groupId || !supabase) return
      setUpcomingEventsLoading(true)
      try {
        const now = new Date().toISOString()
        const { data, error } = await supabase
          .from("group_events")
          .select("*")
          .eq("group_id", groupId)
          .eq("status", "published")
          .gte("start_at", now)
          .order("start_at", { ascending: true })
          .limit(3)

        if (error) {
          console.error("Error fetching upcoming events:", error)
          setUpcomingEvents([])
        } else {
          setUpcomingEvents(data || [])
        }
      } catch (err) {
        console.error("Error fetching upcoming events:", err)
        setUpcomingEvents([])
      } finally {
        setUpcomingEventsLoading(false)
      }
    }
    fetchUpcomingEvents()
  }, [groupId, supabase])

  // Keep existing fetchGroupEvents for calendar (all events based on role)
  useEffect(() => {
    async function fetchGroupEvents() {
      if (!groupId) return
      setEventsLoading(true)
      try {
        // Moderators/owners see all events (including drafts), members only see published
        const includeAll = isOwner || isAdmin
        const events = await getGroupEvents(groupId, includeAll)
        setGroupEvents(events)
      } catch (err) {
        console.error("Error fetching group events:", err)
      } finally {
        setEventsLoading(false)
      }
    }
    fetchGroupEvents()
  }, [groupId, isGroupOwner, userRole])

  useEffect(() => {
    const fetchAllEvents = async () => {
      if (!showEditEventsModal || !groupId) return
      setEditEventsLoading(true)
      try {
        const events = await getGroupEvents(groupId, true) // include all statuses
        setAllGroupEvents(events as GroupEvent[])
      } catch (err) {
        console.error("Error fetching all events:", err)
      } finally {
        setEditEventsLoading(false)
      }
    }
    fetchAllEvents()
  }, [showEditEventsModal, groupId])

  const fetchPosts = async () => {
    const { posts: initialPosts, hasMore: initialHasMore } = await getGroupFeedPosts(
      groupId,
      PAGE_SIZE,
      0,
    )
    setPosts(initialPosts)
    setOffset(PAGE_SIZE)
    setHasMore(initialHasMore)

    // Fetch replies for each post
    const repliesMap: Record<string, FeedReply[]> = {}
    for (const post of initialPosts) {
      const repliesData = await getGroupFeedReplies(post.id)
      repliesMap[post.id] = repliesData.map((reply: any) => ({
        ...reply,
        author: reply.author
          ? {
              name: reply.author.name || reply.author.display_name || "Unknown User",
              avatar_url: reply.author.avatar_url ?? null,
            }
          : { name: "Unknown User", avatar_url: null },
      }))
    }
    setPostReplies(repliesMap)
  }

  const handleLoadMore = async () => {
    setIsLoading(true)
    const { posts: newPosts, hasMore: more } = await getGroupFeedPosts(groupId, PAGE_SIZE, offset)
    setPosts((prev) => [...prev, ...newPosts])
    setOffset((prev) => prev + PAGE_SIZE)
    setHasMore(more)

    // Fetch replies for newly loaded posts
    const newRepliesMap: Record<string, FeedReply[]> = {}
    for (const post of newPosts) {
      const repliesData = await getGroupFeedReplies(post.id)
      newRepliesMap[post.id] = repliesData.map((reply: any) => ({
        ...reply,
        author: reply.author
          ? {
              name: reply.author.name || reply.author.display_name || "Unknown User",
              avatar_url: reply.author.avatar_url ?? null,
            }
          : { name: "Unknown User", avatar_url: null },
      }))
    }
    setPostReplies((prev) => ({ ...prev, ...newRepliesMap }))
    setIsLoading(false)
  }

  useEffect(() => {
    async function init() {
      if (!supabase) {
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .single()

        setCurrentUser({
          id: user.id,
          email: user.email || "",
          display_name: profile?.display_name || user.email?.split("@")[0] || "User",
          avatar_url: profile?.avatar_url || null,
        })
        setIsJoined(true) // Auto-join if logged in for now
      }

      await fetchPosts()
      setLoading(false)
    }

    init()
  }, [supabase, groupId])

  const handleJoinGroup = () => {
    setIsJoined(!isJoined)
  }

  const handleLikePost = (postId: number, currentLikes: number) => {
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const isOwner = !!(group && currentUser && group.created_by === currentUser.id)
  const isAdmin = userRole === "admin"
  const canSendGroupMessage = isGroupOwner || isAdmin

  // Helper to check if user can delete a post
  const canDeletePost = (post: FeedPost) => {
    if (!currentUser) return false
    const isAuthor = post.author_id === currentUser.id
    return isAuthor || isOwner || isAdmin
  }

  const canCurateMedia = (post: FeedPost) => {
    if (!currentUser) return false
    if (!(post.image_url || post.document_url || post.link_url || post.video_url)) return false
    return isOwner || isAdmin
  }

  const openCurateModal = (post: FeedPost) => {
    setCuratePost(post)
    setCurateMediaTitle("")
    setCurateModalOpen(true)
  }

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupMessageBody.trim()) return

    setIsSendingGroupMessage(true)

    try {
      const result = await sendGroupMessage(groupId, groupMessageBody.trim())

      if (result.success) {
        setGroupMessageBody("")
        setGroupMessageModalOpen(false)
      } else {
        alert(result.error || "Failed to send message")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSendingGroupMessage(false)
    }
  }

  // Curate post to Group Media (writes is_featured + video_title; server action name unchanged)
  const handleCurateMedia = async () => {
    const title = curateMediaTitle.trim()
    if (!curatePost || !title) return
    setCurateLoading(true)
    const result = await curateGroupVideo(groupId, curatePost.id, title)
    setCurateLoading(false)
    if (result.success) {
      setCurateModalOpen(false)
      setCuratePost(null)
      setCurateMediaTitle("")
    } else {
      alert(result.error || "Failed to add to Group Media")
    }
  }

  // Delete handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    startTransition(async () => {
      const result = await deleteGroupFeedPost(groupId, postId)
      if (result.success) {
        await fetchPosts()
      } else {
        alert(result.error || "Failed to delete post")
      }
    })
  }

  const handlePinPost = async (postId: string) => {
    if (!groupId) return
    await pinGroupPost(groupId, postId)
    window.location.reload()
  }

  const handleUnpinPost = async (postId: string) => {
    await unpinGroupPost(postId)
    window.location.reload()
  }

  const handleToggleFeature = async (postId: string, isFeatured: boolean) => {
    if (!groupId) return
    await toggleFeaturePost(groupId, postId, !isFeatured)
    window.location.reload()
  }

  const openReportModal = (id: string) => {
    setReportTargetId(id)
    setReportDetails("")
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!reportTargetId) return

    startTransition(async () => {
      const result = await reportGroupFeedItem(reportTargetId, reportDetails || "")
      if (result.success) {
        setShowReportModal(false)
        await fetchPosts()
      } else {
        alert(result.error || "Failed to submit report")
      }
    })
  }

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    const formData = new FormData()
    formData.set("body", postContent)
    if (photoFile) formData.set("photoFile", photoFile)
    else if (photoUrl) formData.set("imageUrl", photoUrl)
    if (documentFile) formData.set("documentFile", documentFile)
    else {
      if (documentUrl) formData.set("documentUrl", documentUrl)
      if (documentName) formData.set("documentName", documentName)
    }
    if (linkUrl) formData.set("linkUrl", linkUrl)
    if (videoUrl) formData.set("videoUrl", videoUrl)

    startTransition(async () => {
      const result = await createGroupFeedPost(groupId, formData)
      if (result.success) {
        setPostContent("")
        setPhotoFile(null)
        setPhotoUrl("")
        setDocumentFile(null)
        setDocumentUrl("")
        setDocumentName("")
        setLinkUrl("")
        setVideoUrl("")
        setShowPhotoInput(false)
        setShowDocumentInput(false)
        setShowLinkInput(false)
        setShowVideoInput(false)
        await fetchPosts()
      } else {
        alert(result.error || "Failed to create post")
      }
    })
  }

  const handleCreateReply = async (postId: string) => {
    const content = replyInputs[postId]
    if (!content?.trim()) return

    startTransition(async () => {
      const result = await createGroupFeedReply(groupId, postId, content)
      if (result.success) {
        setReplyInputs((prev) => ({ ...prev, [postId]: "" }))
        await fetchPosts()
      } else {
        alert(result.error || "Failed to create reply")
      }
    })
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
        await fetchPosts()
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
        await fetchPosts()
      } else {
        alert(result.error || "Failed to delete comment")
      }
    })
  }

  const handleCreateEvent = async () => {
    // Ensure 'name' field is checked for event creation
    if (!eventForm.name.trim() || !eventForm.startDate || !eventForm.eventType) {
      setEventError("Please fill in all required fields")
      return
    }

    setEventSubmitting(true)
    setEventError(null)

    const formData = new FormData()
    formData.append("name", eventForm.name) // Appending the event name
    formData.append("eventType", eventForm.eventType)
    formData.append("startDate", eventForm.startDate)
    // Use `endDate` (from eventForm state) for event creation
    formData.append("endDate", eventForm.endDate)
    formData.append("description", eventForm.description)
    formData.append("intention", eventForm.intention)
    formData.append("imageUrl", eventForm.imageUrl)
    formData.append("accessDetails", eventForm.accessDetails)
    formData.append("additionalInfoLink", eventForm.additionalInfoLink)
    formData.append("status", eventForm.status)

    const result = await createGroupEvent(groupId, formData)

    setEventSubmitting(false)

    if (result.success) {
      setShowAddEventModal(false)
      setEventForm({
        name: "",
        eventType: "",
        startDate: "",
        endDate: "",
        description: "",
        intention: "",
        imageUrl: "",
        accessDetails: "",
        additionalInfoLink: "",
        status: "draft",
      })
      // Refresh the events list after adding a new one
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setGroupEvents(events)
      setUpcomingEventsLoading(true) // Trigger refetch for upcoming events if applicable
      const now = new Date().toISOString()
      const { data: upcoming } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "published")
        .gte("start_at", now)
        .order("start_at", { ascending: true })
        .limit(3)
      setUpcomingEvents(upcoming || [])
      setUpcomingEventsLoading(false)
    } else {
      setEventError(result.error || "Failed to create event")
    }
  }

  const canManageEvents = () => {
    return isOwner || isAdmin
  }

  const handleOpenEventDetails = (event: GroupEvent) => {
    setSelectedEvent(event)
    // Set modal mode to 'details'
    // setEventModalMode("details")
    setEventDetailsForm({
      name: event.title, // Use event.title for the name field
      eventType: event.event_type,
      // Format startDate and endDate correctly for datetime-local input
      startDate: event.start_at ? event.start_at.slice(0, 16) : "",
      endDate: event.end_at ? event.end_at.slice(0, 16) : "", // Use event.end_at
      description: event.description || "",
      intention: event.intention || "",
      imageUrl: event.image_url || "",
      accessDetails: event.access_details || "",
      additionalInfoLink: event.additional_info_link || "",
    })
    setEventDetailsError(null)
    setEventModalOpen(true)
  }

  const handleSaveEventDetails = async () => {
    if (!selectedEvent || !groupId) return
    setEventDetailsSubmitting(true)
    setEventDetailsError(null)

    const formData = new FormData()
    // Append event.title for the name field
    formData.append("name", eventDetailsForm.name)
    formData.append("eventType", eventDetailsForm.eventType)
    // Append startDate and endTime correctly
    formData.append("startDate", eventDetailsForm.startDate)
    formData.append("endDate", eventDetailsForm.endDate) // Use eventDetailsForm.endDate
    formData.append("description", eventDetailsForm.description)
    formData.append("intention", eventDetailsForm.intention)
    formData.append("imageUrl", eventForm.imageUrl)
    formData.append("accessDetails", eventDetailsForm.accessDetails)
    formData.append("additionalInfoLink", eventDetailsForm.additionalInfoLink)

    const result = await updateGroupEvent(groupId, selectedEvent.id, formData)

    if (result.success) {
      // Refresh events list
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setGroupEvents(events)
      // Update selected event with new data
      const updated = events.find((e) => e.id === selectedEvent.id)
      if (updated) {
        setSelectedEvent(updated)
      }
      // Set modal mode to 'details'
      // setEventModalMode("details")
    } else {
      setEventDetailsError(result.error || "Failed to save changes")
    }
    setEventDetailsSubmitting(false)
  }

  const handlePublishEvent = async () => {
    if (!selectedEvent || !groupId) return
    setEventDetailsSubmitting(true)
    setEventDetailsError(null)

    const result = await publishGroupEvent(groupId, selectedEvent.id)

    if (result.success) {
      // Refresh events list
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setGroupEvents(events)
      handleCloseEventModal()
    } else {
      setEventDetailsError(result.error || "Failed to publish event")
    }
    setEventDetailsSubmitting(false)
  }

  const handleDeleteEvent = async (eventId: string) => {
    const result = await deleteGroupEvent(groupId, eventId)
    if (result.success) {
      setAllGroupEvents((prev) => prev.filter((e) => e.id !== eventId))
      setDeleteConfirmEventId(null)
      // Refresh upcoming events in sidebar
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "published")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3)
      setUpcomingEvents(data || [])
    } else {
      alert(result.error || "Failed to delete event")
    }
  }

  const handleDeleteEventFromManager = async (eventId: string) => {
    const result = await deleteGroupEvent(groupId, eventId)
    if (result.success) {
      setAllGroupEvents((prev) => prev.filter((e) => e.id !== eventId))
      setDeleteConfirmEventId(null)
      // Refresh events list in manager
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setAllGroupEvents(events)
      // Refresh upcoming events in sidebar
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "published")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3)
      setUpcomingEvents(data || [])
    } else {
      alert(result.error || "Failed to delete event")
    }
  }

  const handleSaveEventWithStatus = async (status: "draft" | "published") => {
    if (!eventForm.name.trim() || !eventForm.startDate || !eventForm.eventType) {
      setEventError("Please fill in all required fields")
      return
    }

    setEventSubmitting(true)
    setEventError(null)

    const formData = new FormData()
    formData.append("name", eventForm.name)
    formData.append("eventType", eventForm.eventType)
    formData.append("startDate", eventForm.startDate)
    formData.append("endDate", eventForm.endDate)
    formData.append("description", eventForm.description)
    formData.append("intention", eventForm.intention)
    formData.append("imageUrl", eventForm.imageUrl)
    formData.append("accessDetails", eventForm.accessDetails)
    formData.append("additionalInfoLink", eventForm.additionalInfoLink)
    formData.append("status", status)

    let result
    if (eventManagerMode === "edit" && eventManagerSelectedEvent) {
      result = await updateGroupEvent(groupId, eventManagerSelectedEvent.id, formData)
    } else {
      result = await createGroupEvent(groupId, formData)
    }

    setEventSubmitting(false)

    if (result.success) {
      // Refresh events list
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setAllGroupEvents(events)
      setGroupEvents(events)

      // Refresh upcoming events
      const now = new Date().toISOString()
      const { data: upcoming } = await supabase
        .from("group_events")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "published")
        .gte("start_at", now)
        .order("start_at", { ascending: true })
        .limit(3)
      setUpcomingEvents(upcoming || [])

      // Return to list mode (don't close modal)
      setEventManagerMode("list")
      setEventManagerSelectedEvent(null)
      setEventForm({
        name: "",
        eventType: "",
        startDate: "",
        endDate: "",
        description: "",
        intention: "",
        imageUrl: "",
        accessDetails: "",
        additionalInfoLink: "",
        status: "draft",
      })
      setEventError(null)
    } else {
      setEventError(result.error || "Failed to save event")
    }
  }

  const handleOpenEventManager = async (mode: EventManagerMode, event?: GroupEvent) => {
    setEventManagerMode(mode)
    setEventManagerSelectedEvent(event || null)
    setShowEventManager(true)
    setEventError(null)
    setDeleteConfirmEventId(null)

    // Load all events if opening in list mode
    if (mode === "list") {
      setEventManagerLoading(true)
      const includeAll = isOwner || isAdmin
      const events = await getGroupEvents(groupId, includeAll)
      setAllGroupEvents(events)
      setEventManagerLoading(false)
    }

    // Reset form for create mode
    if (mode === "create") {
      setEventForm({
        name: "",
        eventType: "",
        startDate: "",
        endDate: "",
        description: "",
        intention: "",
        imageUrl: "",
        accessDetails: "",
        additionalInfoLink: "",
        status: "draft",
      })
    }

    // Pre-fill form for edit mode
    if (mode === "edit" && event) {
      setEventForm({
        name: event.title || "",
        eventType: event.event_type || "",
        startDate: event.start_at ? event.start_at.slice(0, 16) : "",
        endDate: event.end_at ? event.end_at.slice(0, 16) : "",
        description: event.description || "",
        intention: event.intention || "",
        imageUrl: event.image_url || "",
        accessDetails: event.access_details || "",
        additionalInfoLink: event.additional_info_link || "",
        status: event.status || "draft",
      })
    }
  }

  const handleSaveEventFromManager = async () => {
    // The logic for saving events is now handled by handleSaveEventWithStatus,
    // which needs to be called with the desired status.
    // For simplicity in this context, we'll assume the form's `status` field determines it,
    // but in a real app, you'd likely have distinct save/publish buttons.

    // Temporarily call handleSaveEventWithStatus with the status from eventForm
    await handleSaveEventWithStatus(eventForm.status as "draft" | "published")
  }

  const handleEditEventFromList = (event: GroupEvent) => {
    setShowEditEventsModal(false)
    setSelectedEvent(event)
    setEventModalOpen(true)
    // Set modal mode to 'edit'
    // setEventModalMode("edit")
  }

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case "workshop":
        return { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700" }
      case "webinar":
        return { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700" }
      case "q&a":
      case "qa":
        return { border: "border-green-500", bg: "bg-green-50", text: "text-green-700" }
      case "networking":
        return { border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700" }
      default:
        return { border: "border-gray-500", bg: "bg-gray-50", text: "text-gray-700" }
    }
  }

  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    // Changed `lastDay` calculation to use `month + 1` correctly
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Add days from next month to complete the grid (6 rows)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return groupEvents.filter((event) => {
      const eventDate = new Date(event.start_at)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const goToPreviousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
  }

  const handleCalendarEventClick = (event: GroupEvent) => {
    setShowCalendarModal(false)
    handleOpenEventDetails(event)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  if (!groupLoading && !group) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h1>
          <p className="text-gray-600">The group you're looking for doesn't exist or has been removed.</p>
        </div>
      </main>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero banner with group info */}
      <div className="relative h-[140px] sm:h-48 md:h-64 overflow-hidden">
        {/* Header Image or Branded Fallback */}
        {group?.header_image_url ? (
          <img
            src={`${group.header_image_url}?v=${group.updated_at}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Texture */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/texture.jpg')",
              }}
            />

            {/* Brand Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${brandAccentColor ?? "#1f2937"}, ${brandColor ?? "#111827"})`,
                opacity: 0.85,
              }}
            />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        {(isOwner || isAdmin) && (
          <form ref={headerFormRef} action={uploadGroupHeaderImage} className="absolute top-4 right-4 z-10">
            <input type="hidden" name="groupId" value={groupId} />
            <input
              ref={headerFileInputRef}
              type="file"
              name="file"
              accept="image/*"
              className="hidden"
              onChange={() => headerFormRef.current?.requestSubmit()}
            />
            <button
              type="button"
              onClick={() => headerFileInputRef.current?.click()}
              className="w-8 h-8 bg-white/90 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors border border-gray-200"
            >
              <i className="fa-solid fa-camera text-gray-600 text-sm"></i>
            </button>
          </form>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* CHANGE: Wrapped avatar in relative container for upload overlay */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                onClick={handleGroupAvatarClick}
              >
                {group?.avatar_url ? (
                  <img
                    src={group.avatar_url || "/placeholder.svg"}
                    alt="Group Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center rounded-full">
                    {group?.name
                      ?.split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "G"}
                  </span>
                )}
                {/* Avatar Upload Input (hidden) */}
                <input
                  type="file"
                  ref={groupAvatarInputRef}
                  accept="image/*"
                  onChange={handleGroupAvatarUpload}
                  className="hidden"
                />
              </div>
              {/* CHANGE: Added avatar upload overlay for owners/moderators */}
              {(isOwner || isAdmin) && (
                <form ref={avatarFormRef} action={uploadGroupAvatar}>
                  <input type="hidden" name="groupId" value={groupId} />
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    name="file"
                    accept="image/*"
                    className="hidden"
                    onChange={() => avatarFormRef.current?.requestSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <i className="fa-solid fa-camera text-gray-600 text-xs"></i>
                  </button>
                </form>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {group?.name || "Loading..."}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-white/90 mt-1">
                <span className="flex items-center">
                  <i className="fa-solid fa-users mr-1.5"></i>
                  {memberCount} {memberCount === 1 ? "member" : "members"}
                </span>
                <span className="flex items-center">
                  <i className="fa-solid fa-lock mr-1.5"></i>
                  {group?.visibility === "private" ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced group description section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About this group</h2>
              <div className="text-gray-700 text-base leading-7 whitespace-pre-wrap">
                <p
                  className={cx(
                    !isDescriptionExpanded && "line-clamp-4",
                  )}
                >
                  {group?.description ||
                    "A collaborative space for joint venture partnerships, business development, and strategic alliances. Connect with like-minded professionals, share opportunities, and build lasting business relationships."}
                </p>
                {group?.description && group.description.length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    {isDescriptionExpanded ? "Show Less" : "... More"}
                  </button>
                )}
              </div>
            </div>
            {/* Removed the three-dot menu entirely */}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Column - Group Feed */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feed Media Library Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Feed Media Library</h3>
                  <Link
                    href={`/members/community/groups/${groupId}/library?tab=resources`}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  {mediaCounts.feed.videoCount} Videos – {mediaCounts.feed.imageCount} Images – {mediaCounts.feed.documentCount} Documents – {mediaCounts.feed.linkCount} Links
                </div>
              </div>

              {/* Group Media Library Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Group Media Library</h3>
                  <Link
                    href={`/members/community/groups/${groupId}/library?tab=group-videos`}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
                <div className="text-sm text-gray-600">
                  {mediaCounts.featured.videoCount} Videos – {mediaCounts.featured.imageCount} Images – {mediaCounts.featured.documentCount} Documents – {mediaCounts.featured.linkCount} Links
                </div>
              </div>
            </div>

            <div
              className="bg-white rounded-lg shadow-sm p-6"
              style={brandColor ? { backgroundColor: brandColor } : undefined}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <ProfileAvatar displayName={currentUser?.display_name || "Guest"} avatarUrl={currentUser?.avatar_url} />
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <textarea
                      placeholder={currentUser ? "Share an update with the group..." : "Log in to post..."}
                      className="w-full bg-transparent p-0 border-0 resize-none focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-500"
                      rows={3}
                      disabled={!currentUser}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    ></textarea>

                    {/* Photo Input */}
                    {showPhotoInput && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fa-regular fa-image text-gray-500" />
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
                            onClick={() => document.getElementById("group-photo-upload-input")?.click()}
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
                          id="group-photo-upload-input"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {(photoUrl || photoFile) && (
                          <div className="mt-3">
                            <img
                              src={photoFilePreviewUrl || photoUrl || "/placeholder.svg"}
                              alt="Preview"
                              className="w-32 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxImage(photoFilePreviewUrl || photoUrl)}
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document Input */}
                    {showDocumentInput && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fa-regular fa-file text-gray-500" />
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
                            onClick={() => document.getElementById("group-document-upload-input")?.click()}
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
                          id="group-document-upload-input"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 mb-2"
                        />
                        <input
                          type="text"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          placeholder="Document name (optional)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
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

                    {/* Link Input */}
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
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {linkUrl && (
                          <div className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-12 bg-blue-100 rounded flex items-center justify-center">
                              <i className="fa-solid fa-link text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-700 font-medium truncate">{linkUrl}</span>
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
                          placeholder="Paste video link (YouTube, Vimeo, Loom)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        />
                        {videoUrl && (
                          <div className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-12 bg-purple-100 rounded flex items-center justify-center">
                              <i className="fa-solid fa-video text-purple-600" />
                            </div>
                            <span className="text-sm text-gray-700 font-medium truncate">{videoUrl}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap items-center gap-4">
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
                            showPhotoInput ? "bg-green-100 text-green-600" : "text-gray-600 hover:bg-gray-200",
                            !currentUser && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <i className="fa-regular fa-image mr-2"></i>
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
                            showDocumentInput ? "bg-green-100 text-green-600" : "text-gray-600 hover:bg-gray-200",
                            !currentUser && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <i className="fa-regular fa-file mr-2"></i>
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
                            showLinkInput ? "bg-green-100 text-green-600" : "text-gray-600 hover:bg-gray-200",
                            !currentUser && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <i className="fa-solid fa-link mr-2"></i>
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
                            showVideoInput ? "bg-green-100 text-green-600" : "text-gray-600 hover:bg-gray-200",
                            !currentUser && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <i className="fa-solid fa-video mr-2"></i>
                          Video
                        </button>
                      </div>
                      <button
                        onClick={handleCreatePost}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!currentUser || !postContent.trim() || isPending}
                      >
                        {isPending ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Filter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>

              <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                <button
                  onClick={() => setShowFeaturedOnly(false)}
                  className={`px-3 py-1 rounded-md ${
                    !showFeaturedOnly ? "bg-white shadow" : ""
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => setShowFeaturedOnly(true)}
                  className={`px-3 py-1 rounded-md ${
                    showFeaturedOnly ? "bg-white shadow" : ""
                  }`}
                >
                  ⭐ Featured
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                  Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                  No posts yet. Be the first to share something!
                </div>
              ) : (
                <>
                  {/* Pinned Post */}
                  {pinnedPost && !showFeaturedOnly && (
                    <article id={`post-${pinnedPost.id}`} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 relative">
                      <div className="absolute top-4 right-4 text-yellow-700 text-sm font-semibold">
                        📌 Pinned
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <ProfileAvatar
                          displayName={pinnedPost.author?.name || "Unknown User"}
                          avatarUrl={pinnedPost.author?.avatar_url}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {pinnedPost.author?.name || "Unknown User"}
                            </h3>
                            <span className="text-gray-500">-</span>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(pinnedPost.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                            {pinnedPost.body}
                          </p>
                          <button
                            onClick={() =>
                              setExpandedPinnedPostId(
                                expandedPinnedPostId === pinnedPost.id ? null : pinnedPost.id
                              )
                            }
                            className="mt-3 text-sm font-medium text-green-700 hover:text-green-800 underline"
                          >
                            {expandedPinnedPostId === pinnedPost.id ? "Hide Full Post ↑" : "Show Full Post →"}
                          </button>
                        </div>
                      </div>
                    </article>
                  )}

                  {pinnedPost && !showFeaturedOnly && expandedPinnedPostId === pinnedPost.id && (
                    <div className="mt-6">
                      <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {posts
                          .filter((p) => p.id === pinnedPost.id)
                          .map((fullPost) => (
                            <div key={fullPost.id}>
                              {(fullPost as FeedPost & { is_featured?: boolean }).is_featured && (
                                <div className="mb-2 inline-block text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                  ⭐ Featured
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row gap-4">
                                <ProfileAvatar
                                  displayName={fullPost.author?.name || "Unknown User"}
                                  avatarUrl={fullPost.author?.avatar_url}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{fullPost.author?.name || "Unknown User"}</h3>
                                    <span className="text-gray-500">-</span>
                                    <span className="text-sm text-gray-500">{formatRelativeTime(fullPost.created_at)}</span>
                                  </div>
                                  <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{fullPost.body}</p>

                                  {fullPost.image_url && (
                                    <div className="mt-3 flex justify-center">
                                      <img
                                        src={fullPost.image_url || "/placeholder.svg"}
                                        alt="Post image"
                                        className="rounded-lg max-h-[400px] w-auto max-w-[50%] object-cover cursor-pointer"
                                        onClick={() => setLightboxImage(fullPost.image_url!)}
                                      />
                                    </div>
                                  )}

                                  {fullPost.document_url && (
                                    <div
                                      className="mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() =>
                                        setDocumentViewer({
                                          url: fullPost.document_url!,
                                          name: fullPost.document_name || getFilenameFromUrl(fullPost.document_url!),
                                        })
                                      }
                                    >
                                      <div className="w-10 h-12 bg-red-100 rounded flex items-center justify-center">
                                        <i className="fa-solid fa-file-pdf text-red-600" />
                                      </div>
                                      <span className="text-sm text-gray-700 font-medium">
                                        {fullPost.document_name || getFilenameFromUrl(fullPost.document_url)}
                                      </span>
                                    </div>
                                  )}

                                  {fullPost.link_url && (
                                    <div className="mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-12 bg-blue-100 rounded flex items-center justify-center">
                                        <i className="fa-solid fa-link text-blue-600" />
                                      </div>
                                      <a
                                        href={fullPost.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium truncate"
                                      >
                                        {fullPost.link_url}
                                      </a>
                                    </div>
                                  )}

                                  {fullPost.video_url &&
                                    (() => {
                                      const embedUrl = getVideoEmbedUrl(fullPost.video_url)
                                      return embedUrl ? (
                                        <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
                                          <iframe
                                            src={embedUrl}
                                            className="h-full w-full"
                                            allowFullScreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          />
                                        </div>
                                      ) : null
                                    })()}

                                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                                    <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                                      <i className="fa-regular fa-comment" />
                                      <span>{postReplies[fullPost.id]?.length || 0} comments</span>
                                    </button>
                                    {isPending && reportTargetId === fullPost.id ? (
                                      <span className="flex items-center space-x-1 text-gray-400">
                                        <i className="fa-solid fa-spinner fa-spin" />
                                        <span>Reporting...</span>
                                      </span>
                                    ) : (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                                            <i className="fa-solid fa-ellipsis-h" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36">
                                          {currentUser && fullPost.author_id === currentUser.id && (
                                            <DropdownMenuItem
                                              className="cursor-pointer"
                                              onClick={() => handleEditComment(fullPost.id, fullPost.body)}
                                            >
                                              <i className="fa-regular fa-pen-to-square mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                          )}
                                          {canCurateMedia(fullPost) && (
                                            <DropdownMenuItem className="cursor-pointer" onClick={() => openCurateModal(fullPost)}>
                                              <i className="fa-solid fa-video mr-2 text-purple-600" />
                                              Add to Group Media
                                            </DropdownMenuItem>
                                          )}
                                          {(isOwner || isAdmin || userRole === "moderator") &&
                                            !(fullPost as FeedPost & { is_pinned?: boolean }).is_pinned && (
                                              <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => handlePinPost(fullPost.id)}
                                              >
                                                📌 Pin to Top
                                              </DropdownMenuItem>
                                            )}
                                          {(isOwner || isAdmin || userRole === "moderator") &&
                                            (fullPost as FeedPost & { is_pinned?: boolean }).is_pinned && (
                                              <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => handleUnpinPost(fullPost.id)}
                                              >
                                                Unpin
                                              </DropdownMenuItem>
                                            )}
                                          {(isOwner || isAdmin || userRole === "moderator") && (
                                            <DropdownMenuItem
                                              className="cursor-pointer"
                                              onClick={() =>
                                                handleToggleFeature(fullPost.id, (fullPost as FeedPost & { is_featured?: boolean }).is_featured ?? false)
                                              }
                                            >
                                              ⭐{(fullPost as FeedPost & { is_featured?: boolean }).is_featured
                                                ? " Remove from Featured"
                                                : " Feature Post"}
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem
                                            className="cursor-pointer text-red-600"
                                            onClick={() => openReportModal(fullPost.id)}
                                          >
                                            <i className="fa-regular fa-flag mr-2" />
                                            Report
                                          </DropdownMenuItem>
                                          {canDeletePost(fullPost) && (
                                            <DropdownMenuItem
                                              className="cursor-pointer text-red-600"
                                              onClick={() => {
                                                if (currentUser && fullPost.author_id === currentUser.id) {
                                                  handleDeleteComment(fullPost.id)
                                                } else {
                                                  handleDeletePost(fullPost.id)
                                                }
                                              }}
                                            >
                                              <i className="fa-regular fa-trash-can mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>

                                  <div className="border-t border-gray-100 pt-4 mt-4">
                                    <div className="space-y-4">
                                      {postReplies[fullPost.id]?.map((reply) => (
                                        <div key={reply.id} className="flex items-start space-x-3">
                                          <ProfileAvatar
                                            displayName={reply.author?.name || "Unknown User"}
                                            avatarUrl={reply.author?.avatar_url}
                                            size="sm"
                                          />
                                          <div className="flex-1">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <h5 className="font-medium text-gray-800 text-sm">
                                                  {reply.author?.name || "Unknown User"}
                                                </h5>
                                                <span className="text-xs text-gray-500">
                                                  {formatRelativeTime(reply.created_at)}
                                                </span>
                                              </div>
                                              <p className="text-sm text-gray-700">{reply.body}</p>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                              {reply.status === "approved" ? (
                                                <span className="text-xs text-gray-400 italic">
                                                  This comment has been approved by an admin.
                                                </span>
                                              ) : (
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <button className="hover:text-gray-700 transition-colors">
                                                      <i className="fa-solid fa-ellipsis-vertical" />
                                                    </button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="w-32">
                                                    {currentUser && reply.author_id === currentUser.id && (
                                                      <>
                                                        <DropdownMenuItem
                                                          className="cursor-pointer"
                                                          onClick={() => handleEditComment(reply.id, reply.body)}
                                                        >
                                                          <i className="fa-regular fa-pen-to-square mr-2" />
                                                          Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                          className="cursor-pointer text-red-600"
                                                          onClick={() => handleDeleteComment(reply.id)}
                                                        >
                                                          <i className="fa-regular fa-trash-can mr-2" />
                                                          Delete
                                                        </DropdownMenuItem>
                                                      </>
                                                    )}
                                                    {(!currentUser || reply.author_id !== currentUser.id) && (
                                                      <DropdownMenuItem
                                                        className="cursor-pointer text-red-600"
                                                        onClick={() => openReportModal(reply.id)}
                                                      >
                                                        <i className="fa-regular fa-flag mr-2" />
                                                        Report
                                                      </DropdownMenuItem>
                                                    )}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="flex items-start space-x-3 mt-4">
                                      <ProfileAvatar
                                        displayName={currentUser?.display_name || "Guest"}
                                        avatarUrl={currentUser?.avatar_url}
                                        size="sm"
                                      />
                                      <div className="flex-1">
                                        <textarea
                                          placeholder={currentUser ? "Write a comment..." : "Log in to comment..."}
                                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          rows={2}
                                          value={replyInputs[fullPost.id] || ""}
                                          onChange={(e) => setReplyInputs((prev) => ({ ...prev, [fullPost.id]: e.target.value }))}
                                          disabled={!currentUser}
                                        />
                                        <div className="flex items-center justify-end mt-2">
                                          <button
                                            onClick={() => handleCreateReply(fullPost.id)}
                                            disabled={!currentUser || !replyInputs[fullPost.id]?.trim() || isPending}
                                            className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            Comment
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </article>
                    </div>
                  )}

                  {/* Regular Posts */}
                  {regularPosts
                    .filter((post) => !showFeaturedOnly || (post as FeedPost & { is_featured?: boolean }).is_featured)
                    .map((post) => (
                  <article
                    id={`post-${post.id}`}
                    key={post.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    {(post as FeedPost & { is_featured?: boolean }).is_featured && (
                      <div className="mb-2 inline-block text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        ⭐ Featured
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <ProfileAvatar
                        displayName={post.author?.name || "Unknown User"}
                        avatarUrl={post.author?.avatar_url}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{post.author?.name || "Unknown User"}</h3>
                          <span className="text-gray-500">-</span>
                          <span className="text-sm text-gray-500">{formatRelativeTime(post.created_at)}</span>
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">{post.body}</p>

                        {/* Image attachment */}
                        {post.image_url && (
                          <div className="mt-3 flex justify-center">
                            <img
                              src={post.image_url || "/placeholder.svg"}
                              alt="Post image"
                              className="rounded-lg max-h-[400px] w-auto max-w-[50%] object-cover cursor-pointer"
                              onClick={() => setLightboxImage(post.image_url!)}
                            />
                          </div>
                        )}

                        {/* Document attachment */}
                        {post.document_url && (
                          <div
                            className="mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
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
                              {post.document_name || getFilenameFromUrl(post.document_url)}
                            </span>
                          </div>
                        )}

                        {/* Link attachment */}
                        {post.link_url && (
                          <div className="mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                              <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg">
                                <iframe
                                  src={embedUrl}
                                  className="h-full w-full"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              </div>
                            ) : null
                          })()}

                        {/* Reactions and actions */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                            <i className="fa-regular fa-comment" />
                            <span>{postReplies[post.id]?.length || 0} comments</span>
                          </button>
                          {isPending && reportTargetId === post.id ? (
                            <span className="flex items-center space-x-1 text-gray-400">
                              <i className="fa-solid fa-spinner fa-spin" />
                              <span>Reporting...</span>
                            </span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex items-center space-x-1 hover:text-gray-700 transition-colors">
                                  <i className="fa-solid fa-ellipsis-h" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                {currentUser && post.author_id === currentUser.id && (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleEditComment(post.id, post.body)}
                                  >
                                    <i className="fa-regular fa-pen-to-square mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canCurateMedia(post) && (
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => openCurateModal(post)}>
                                    <i className="fa-solid fa-video mr-2 text-purple-600" />
                                    Add to Group Media
                                  </DropdownMenuItem>
                                )}
                                {(isOwner || isAdmin || userRole === "moderator") &&
                                  !(post as FeedPost & { is_pinned?: boolean }).is_pinned && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handlePinPost(post.id)}
                                    >
                                      📌 Pin to Top
                                    </DropdownMenuItem>
                                  )}
                                {(isOwner || isAdmin || userRole === "moderator") &&
                                  (post as FeedPost & { is_pinned?: boolean }).is_pinned && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => handleUnpinPost(post.id)}
                                    >
                                      Unpin
                                    </DropdownMenuItem>
                                  )}
                                {(isOwner || isAdmin || userRole === "moderator") && (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleToggleFeature(post.id, (post as FeedPost & { is_featured?: boolean }).is_featured ?? false)
                                    }
                                  >
                                    ⭐{(post as FeedPost & { is_featured?: boolean }).is_featured
                                      ? " Remove from Featured"
                                      : " Feature Post"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="cursor-pointer text-red-600"
                                  onClick={() => openReportModal(post.id)}
                                >
                                  <i className="fa-regular fa-flag mr-2" />
                                  Report
                                </DropdownMenuItem>
                                {canDeletePost(post) && (
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600"
                                    onClick={() => {
                                      if (currentUser && post.author_id === currentUser.id) {
                                        handleDeleteComment(post.id)
                                      } else {
                                        handleDeletePost(post.id)
                                      }
                                    }}
                                  >
                                    <i className="fa-regular fa-trash-can mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Replies */}
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          <div className="space-y-4">
                            {postReplies[post.id]?.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <ProfileAvatar
                                  displayName={reply.author?.name || "Unknown User"}
                                  avatarUrl={reply.author?.avatar_url}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h5 className="font-medium text-gray-800 text-sm">
                                        {reply.author?.name || "Unknown User"}
                                      </h5>
                                      <span className="text-xs text-gray-500">
                                        {formatRelativeTime(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{reply.body}</p>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    {reply.status === "approved" ? (
                                      <span className="text-xs text-gray-400 italic">
                                        This comment has been approved by an admin.
                                      </span>
                                    ) : (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="hover:text-gray-700 transition-colors">
                                            <i className="fa-solid fa-ellipsis-vertical" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                          {currentUser && reply.author_id === currentUser.id && (
                                            <>
                                              <DropdownMenuItem
                                                className="cursor-pointer"
                                                onClick={() => handleEditComment(reply.id, reply.body)}
                                              >
                                                <i className="fa-regular fa-pen-to-square mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                className="cursor-pointer text-red-600"
                                                onClick={() => handleDeleteComment(reply.id)}
                                              >
                                                <i className="fa-regular fa-trash-can mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </>
                                          )}
                                          {(!currentUser || reply.author_id !== currentUser.id) && (
                                            <DropdownMenuItem
                                              className="cursor-pointer text-red-600"
                                              onClick={() => openReportModal(reply.id)}
                                            >
                                              <i className="fa-regular fa-flag mr-2" />
                                              Report
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Reply input */}
                          <div className="flex items-start space-x-3 mt-4">
                            <ProfileAvatar
                              displayName={currentUser?.display_name || "Guest"}
                              avatarUrl={currentUser?.avatar_url}
                              size="sm"
                            />
                            <div className="flex-1">
                              <textarea
                                placeholder={currentUser ? "Write a comment..." : "Log in to comment..."}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={2}
                                value={replyInputs[post.id] || ""}
                                onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                disabled={!currentUser}
                              />
                              <div className="flex items-center justify-end mt-2">
                                <button
                                  onClick={() => handleCreateReply(post.id)}
                                  disabled={!currentUser || !replyInputs[post.id]?.trim() || isPending}
                                  className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                    ))}
                </>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? "Loading..." : "Load More Posts"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Members */}
          <div className="w-full lg:w-[300px] flex-shrink-0 space-y-6">
            {(isOwner || isAdmin) && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditGroupModal(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Edit
                </button>

                <button
                  onClick={() => setGroupMessageModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Send Message
                </button>
              </div>
            )}

            {/* Members Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Members</h3>
                <span className="text-sm text-gray-500">Top 20 shown</span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {members.map((member) => {
                  const name = member.full_name ?? "Unknown Member"
                  const avatarUrl = member.avatar_url ?? null
                  const initials = name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  const isModerator = ["admin", "moderator"].includes(member.role)
                  const roleText = isModerator
                    ? "Group Moderator"
                    : `Member since ${new Date(member.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`

                  return (
                    <Link
                      key={member.user_id}
                      href={`/members/community/groups/${groupId}/members?search=${encodeURIComponent(name)}`}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl || "/placeholder.svg"}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500">{roleText}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/members/community/groups/${groupId}/members`}
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center justify-center"
                >
                  View All Members
                  <i className="fa-solid fa-arrow-right ml-2 text-xs"></i>
                </Link>
              </div>
            </div>

            {/* Events Card - shows upcoming published events */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Events</h3>
                {canManageEvents() && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEventManager("create")}
                      className="text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer"
                    >
                      Add Event
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleOpenEventManager("list")}
                      className="text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer"
                    >
                      Edit Events
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {upcomingEventsLoading ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading events...</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">No upcoming events</div>
                ) : (
                  upcomingEvents.map((event) => {
                    const colors = getEventTypeColor(event.event_type)
                    return (
                      <div key={event.id} className={`border-l-4 ${colors.border} pl-4 py-2`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900">{event.title ?? "(Untitled event)"}</h4>
                            </div>
                            <div className="flex items-center text-xs text-gray-600 mb-2">
                              <i className="fa-regular fa-calendar mr-1"></i>
                              {formatEventDate(event.start_at)}
                            </div>
                            {event.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleOpenEventDetails(event)}
                            className={`text-xs ${colors.bg} ${colors.text} px-2 py-1 rounded hover:opacity-80`}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="w-full text-center text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer py-2 hover:bg-green-50 rounded-md transition-colors"
                >
                  <i className="fa-regular fa-calendar mr-2"></i>
                  View Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Guidelines Section */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Guidelines</h2>
            <p className="text-gray-600">
              Please follow these guidelines to maintain a positive and productive community environment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-heart text-green-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Be Respectful</h3>
              <p className="text-gray-600 text-sm">
                Treat all members with respect and professionalism. No harassment, discrimination, or offensive content.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-lightbulb text-blue-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Value</h3>
              <p className="text-gray-600 text-sm">
                Post content that adds value to the community. Share insights, ask thoughtful questions, and help
                others.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-shield-halved text-purple-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay On Topic</h3>
              <p className="text-gray-600 text-sm">
                Keep discussions relevant to joint ventures, partnerships, and business development topics.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-ban text-orange-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Spam</h3>
              <p className="text-gray-600 text-sm">
                Avoid excessive self-promotion, spam, or repetitive posts. Quality over quantity.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-eye-slash text-red-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Protect Privacy</h3>
              <p className="text-gray-600 text-sm">
                Don't share personal information or confidential business details without permission.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <i className="fa-solid fa-flag text-indigo-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Issues</h3>
              <p className="text-gray-600 text-sm">
                Report any inappropriate content or behavior to group moderators immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Member Modal */}
      {selectedMember && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeMemberModal}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  {selectedMember.avatar ? (
                    <img
                      src={selectedMember.avatar || "/placeholder.svg"}
                      alt={selectedMember.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                      {selectedMember.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                    <p className="text-gray-600">{selectedMember.role}</p>
                    <p className="text-sm text-gray-500">{selectedMember.status}</p>
                  </div>
                </div>
                <button onClick={closeMemberModal} className="text-gray-400 hover:text-gray-600">
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600 text-sm">Member of JV Partner Lab community</p>
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                    <i className="fa-regular fa-envelope mr-2"></i>
                    Message
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50">
                    <i className="fa-solid fa-user-plus mr-2"></i>
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Report Content</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-times text-xl" />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="font-medium mb-2">Only report content if it:</p>
                  <ul className="space-y-1 ml-1">
                    <li>- Violates community guidelines</li>
                    <li>- Is abusive, hateful, or harassing</li>
                    <li>- Is spam or misleading</li>
                    <li>- Puts the community at risk</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600 italic">
                  False or excessive reporting may result in account review.
                </p>
              </div>

              <textarea
                placeholder="Additional details (optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-green-500 mb-4"
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />

              <p className="text-sm font-medium text-gray-800 mb-4">Are you sure you want to report this content?</p>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isPending}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Reporting..." : "Report Content"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Curate Media Modal */}
      {curateModalOpen && curatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add to Group Media</h3>
              <button
                onClick={() => setCurateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Media preview (video embed when post has video_url) */}
              {curatePost.video_url && getVideoEmbedUrl(curatePost.video_url) && (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <iframe
                    src={getVideoEmbedUrl(curatePost.video_url)!}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* Title (required for all curated media) */}
              <div>
                <label htmlFor="curate-media-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="curate-media-title"
                  type="text"
                  value={curateMediaTitle}
                  onChange={(e) => setCurateMediaTitle(e.target.value)}
                  placeholder="Enter a title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1.5 text-sm text-gray-500">This title will be shown in the Group Media Library.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setCurateModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCurateMedia}
                disabled={!curateMediaTitle.trim() || curateLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {curateLoading ? "Adding..." : "Add to Group Media"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} isOpen={!!lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      {documentViewer && (
        <DocumentViewer
          documentUrl={documentViewer.url}
          fileName={documentViewer.name}
          isOpen={!!documentViewer}
          onClose={() => setDocumentViewer(null)}
        />
      )}

      {eventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Hero Image - only shown when image exists */}
            {selectedEvent.image_url && (
              <div className="relative w-full h-48 md:h-56 flex-shrink-0">
                <img
                  src={selectedEvent.image_url || "/placeholder.svg"}
                  alt={selectedEvent.title ?? "Event image"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide broken images gracefully
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {/* Close button overlay on image */}
                <button
                  onClick={handleCloseEventModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
                {/* Draft badge on image */}
                {selectedEvent.status === "draft" && (
                  <span className="absolute top-4 left-4 text-sm bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-semibold shadow-md">
                    Draft
                  </span>
                )}
              </div>
            )}

            {/* Modal Header - shown when no image */}
            {!selectedEvent.image_url && (
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fa-regular fa-calendar text-green-600"></i>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
                    {selectedEvent.status === "draft" && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseEventModal}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            )}

            {eventDetailsError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 flex-shrink-0">
                <i className="fa-solid fa-circle-exclamation"></i>
                {eventDetailsError}
              </div>
            )}

            {/* Modal Content - scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* View mode: Header section with title, type badge, and date */}
              <div className="space-y-3">
                {/* Event Type Badge */}
                {selectedEvent.event_type && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      selectedEvent.event_type === "workshop"
                        ? "bg-purple-100 text-purple-700"
                        : selectedEvent.event_type === "webinar"
                          ? "bg-blue-100 text-blue-700"
                          : selectedEvent.event_type === "q&a"
                            ? "bg-orange-100 text-orange-700"
                            : selectedEvent.event_type === "networking"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <i
                      className={`fa-solid ${
                        selectedEvent.event_type === "workshop"
                          ? "fa-hammer"
                          : selectedEvent.event_type === "webinar"
                            ? "fa-video"
                            : selectedEvent.event_type === "q&a"
                              ? "fa-comments"
                              : selectedEvent.event_type === "networking"
                                ? "fa-users"
                                : "fa-calendar-check"
                      }`}
                    ></i>
                    {selectedEvent.event_type}
                  </span>
                )}

                {/* Event Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  {selectedEvent.title ?? "(Untitled event)"}
                </h3>

                {/* Date and Time - prominent display */}
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <i className="fa-regular fa-calendar text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedEvent.start_at
                          ? new Date(selectedEvent.start_at).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Date TBD"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <i className="fa-regular fa-clock text-blue-600 text-sm"></i>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedEvent.start_at
                          ? new Date(selectedEvent.start_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Time TBD"}
                        {selectedEvent.end_at && (
                          <span className="text-gray-500">
                            {" — "}
                            {new Date(selectedEvent.end_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              {/* Intention / Focus - highlighted block */}
              {selectedEvent.intention && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-r-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-bullseye text-green-600"></i>
                    <h4 className="font-semibold text-green-900">Intention / Focus</h4>
                  </div>
                  <p className="text-green-800 whitespace-pre-wrap">{selectedEvent.intention}</p>
                </div>
              )}

              {/* Access Details - card style */}
              {selectedEvent.access_details && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-door-open text-blue-600 text-sm"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900">How to Join</h4>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.access_details}</p>
                </div>
              )}

              {/* External Link */}
              {selectedEvent.additional_info_link && (
                <a
                  href={selectedEvent.additional_info_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <i className="fa-solid fa-arrow-up-right-from-square text-green-600"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">Additional Information</div>
                    <div className="text-sm text-green-600 truncate">{selectedEvent.additional_info_link}</div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-400"></i>
                </a>
              )}
            </div>

            {/* Modal Footer - read-only, only shows Publish for drafts */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 flex-shrink-0">
              {canManageEvents() && selectedEvent.status === "draft" && (
                <button
                  onClick={handlePublishEvent}
                  disabled={eventDetailsSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {eventDetailsSubmitting ? "Publishing..." : "Publish Event"}
                </button>
              )}
              <button
                onClick={handleCloseEventModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <i className="fa-solid fa-chevron-left text-gray-600"></i>
                </button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {formatMonthYear(calendarMonth)}
                </h2>
                <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <i className="fa-solid fa-chevron-right text-gray-600"></i>
                </button>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays(calendarMonth).map((dayInfo, index) => {
                  const dayEvents = getEventsForDate(dayInfo.date)
                  const visibleEvents = dayEvents.slice(0, 2)
                  const hiddenCount = dayEvents.length - 2

                  return (
                    <div
                      key={index}
                      className={cx(
                        "min-h-[100px] border border-gray-100 rounded-lg p-1",
                        dayInfo.isCurrentMonth ? "bg-white" : "bg-gray-50",
                        isToday(dayInfo.date) && "ring-2 ring-green-500",
                      )}
                    >
                      <div
                        className={cx(
                          "text-sm font-medium mb-1 px-1",
                          dayInfo.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                          isToday(dayInfo.date) && "text-green-600",
                        )}
                      >
                        {dayInfo.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {visibleEvents.map((event) => {
                          const colors = getEventTypeColor(event.event_type)
                          return (
                            <button
                              key={event.id}
                              onClick={() => handleCalendarEventClick(event)}
                              className={cx(
                                "w-full text-left rounded-md transition-opacity hover:opacity-80 cursor-pointer",
                                "px-2 py-1.5",
                                event.status === "draft"
                                  ? "bg-gray-100 text-gray-600 border border-dashed border-gray-300"
                                  : `${colors.bg} ${colors.text} border border-transparent`,
                              )}
                              title={event.title ?? "(Untitled event)"}
                            >
                              <div className="flex flex-col gap-0.5">
                                {event.status === "draft" && (
                                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    Draft
                                  </span>
                                )}
                                <span className="text-xs font-medium truncate leading-tight">
                                  {event.title ?? "(Untitled event)"}
                                </span>
                                <span
                                  className={cx(
                                    "text-[10px] leading-tight",
                                    event.status === "draft" ? "text-gray-500" : colors.text,
                                    "opacity-80",
                                  )}
                                >
                                  {formatEventTime(event.start_at)}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                        {hiddenCount > 0 && <div className="text-xs text-gray-500 px-1">+{hiddenCount} more</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-50 border border-purple-200 rounded"></div>
                  <span>Workshop</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Call</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-100 border border-dashed border-gray-300 rounded"></div>
                  <span>Draft</span>
                </div>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditEventsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit Events</h3>
              <button
                onClick={() => setShowEditEventsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editEventsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading events...</div>
              ) : allGroupEvents.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fa-regular fa-calendar text-4xl text-gray-300 mb-3" />
                  <p className="text-gray-500">No events yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allGroupEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {event.title ?? "(Untitled event)"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              event.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {event.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {event.start_at
                            ? new Date(event.start_at).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "No date set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditEventFromList(event)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <i className="fa-solid fa-pencil" />
                        </button>
                        {deleteConfirmEventId === event.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmEventId(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmEventId(event.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete event"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowEditEventsModal(false)}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EventManagerModal - unified modal for list/create/edit modes */}
      {showEventManager && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fa-regular fa-calendar text-green-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {eventManagerMode === "list" && "Manage Events"}
                  {eventManagerMode === "create" && "Add New Event"}
                  {eventManagerMode === "edit" && "Edit Event"}
                </h3>
              </div>
              <button
                onClick={() => setShowEventManager(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Error display */}
            {eventError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {eventError}
              </div>
            )}

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* LIST MODE */}
              {eventManagerMode === "list" && (
                <>
                  {/* Add Event button at top of list */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setEventManagerMode("create")
                        setEventForm({
                          name: "",
                          eventType: "",
                          startDate: "",
                          endDate: "",
                          description: "",
                          intention: "",
                          imageUrl: "",
                          accessDetails: "",
                          additionalInfoLink: "",
                          status: "draft",
                        })
                        setEventError(null)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <i className="fa-solid fa-plus"></i>
                      Add New Event
                    </button>
                  </div>

                  {eventManagerLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading events...</div>
                  ) : allGroupEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <i className="fa-regular fa-calendar text-4xl text-gray-300 mb-3" />
                      <p className="text-gray-500">No events yet</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add New Event" to create your first event</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allGroupEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 truncate">
                                {event.title ?? "(Untitled event)"}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === "published"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {event.status === "published" ? "Published" : "Draft"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {event.start_at
                                ? new Date(event.start_at).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : "No date set"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEventManagerSelectedEvent(event)
                                setEventManagerMode("edit")
                                setEventForm({
                                  name: event.title || "",
                                  eventType: event.event_type || "",
                                  startDate: event.start_at ? event.start_at.slice(0, 16) : "",
                                  endDate: event.end_at ? event.end_at.slice(0, 16) : "",
                                  description: event.description || "",
                                  intention: event.intention || "",
                                  imageUrl: event.image_url || "",
                                  accessDetails: event.access_details || "",
                                  additionalInfoLink: event.additional_info_link || "",
                                  status: event.status || "draft",
                                })
                                setEventError(null)
                              }}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit event"
                            >
                              <i className="fa-solid fa-pencil" />
                            </button>
                            {deleteConfirmEventId === event.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteEventFromManager(event.id)}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmEventId(null)}
                                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmEventId(event.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete event"
                              >
                                <i className="fa-solid fa-trash" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* CREATE / EDIT MODE - reuses the same form */}
              {(eventManagerMode === "create" || eventManagerMode === "edit") && (
                <div className="space-y-5">
                  {/* Back to list button */}
                  <button
                    onClick={() => {
                      setEventManagerMode("list")
                      setEventManagerSelectedEvent(null)
                      setEventError(null)
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Events List
                  </button>

                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      placeholder="Enter event name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select event type</option>
                      <option value="workshop">Workshop</option>
                      <option value="webinar">Webinar</option>
                      <option value="q&a">Q&A Session</option>
                      <option value="networking">Networking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date/Time Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={eventForm.startDate}
                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={eventForm.endDate}
                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      placeholder="Describe your event..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Intention / Focus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intention / Focus</label>
                    <textarea
                      rows={2}
                      value={eventForm.intention}
                      onChange={(e) => setEventForm({ ...eventForm, intention: e.target.value })}
                      placeholder="What's the main focus or goal of this event?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Image URL</label>
                    <input
                      type="url"
                      value={eventForm.imageUrl}
                      onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Access Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Details</label>
                    <textarea
                      rows={2}
                      value={eventForm.accessDetails}
                      onChange={(e) => setEventForm({ ...eventForm, accessDetails: e.target.value })}
                      placeholder="How can attendees join? (Zoom link, location, etc.)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Additional Info Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info Link</label>
                    <input
                      type="url"
                      value={eventForm.additionalInfoLink}
                      onChange={(e) => setEventForm({ ...eventForm, additionalInfoLink: e.target.value })}
                      placeholder="https://example.html"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              {eventManagerMode === "list" ? (
                <button
                  onClick={() => setShowEventManager(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEventManagerMode("list")
                      setEventManagerSelectedEvent(null)
                      setEventError(null)
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEventWithStatus("draft")}
                    disabled={eventSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {eventSubmitting ? "Saving..." : "Save Draft"}
                  </button>
                  <button
                    onClick={() => handleSaveEventWithStatus("published")}
                    disabled={eventSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {eventSubmitting ? "Publishing..." : "Publish"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditGroupModal && (
        <Dialog open={showEditGroupModal} onOpenChange={setShowEditGroupModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update your group settings and preferences</DialogDescription>
            </DialogHeader>

            <div>
              {/* Hidden input for groupId */}
              <input type="hidden" name="groupId" value={group?.id || ""} />

              <div className="space-y-6 py-4">
                {/* Section 1: Group Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Group Details</h3>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Group Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editGroupForm.name}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter group name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      value={editGroupForm.description}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Describe your group"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Visibility</label>
                    <select
                      name="visibility"
                      value={editGroupForm.visibility}
                      onChange={(e) => setEditGroupForm({ ...editGroupForm, visibility: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="public">Public</option>
                      <option value="request">Request</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditGroupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await updateGroup({
                        groupId: groupId as string,
                        name: editGroupForm.name,
                        description: editGroupForm.description,
                        visibility: editGroupForm.visibility as "public" | "request" | "private",
                        allow_member_posts: editGroupForm.allowMemberPosts,
                        require_post_approval: editGroupForm.requirePostApproval,
                        allow_member_events: editGroupForm.allowMemberEvents,
                        allow_member_invites: editGroupForm.allowMemberInvites,
                      })
                      // Refresh group data
                      const supabase = getSupabaseBrowserClient()
                      const { data } = await supabase
                        .from("groups")
                        .select(
                          "name, description, visibility, created_by, allow_member_posts, require_post_approval, allow_member_events, allow_member_invites, header_image_url, updated_at",
                        )
                        .eq("id", groupId)
                        .single()
                      if (data) {
                        setGroup(data)
                      }
                      setShowEditGroupModal(false)
                    } catch (error) {
                      console.error("Failed to update group:", error)
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <EditCommentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentBody={editTargetBody}
        onSave={handleSaveEdit}
        isPending={isPending}
      />

      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isPending={isPending}
      />

      {groupMessageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setGroupMessageModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Message to Group Members
              </h3>
              <button
                onClick={() => setGroupMessageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSendGroupMessage} className="p-6 space-y-4">
              <textarea
                value={groupMessageBody}
                onChange={(e) => setGroupMessageBody(e.target.value)}
                rows={5}
                placeholder="Write your message to all group members..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingGroupMessage || !groupMessageBody.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSendingGroupMessage ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
