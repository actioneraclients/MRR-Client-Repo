"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { updateMemberStatus } from "@/app/admin/members/actions"

type CommentStatus = "approved" | "deleted" | "reported"
type ContextType = "member_feed" | "group_feed"

interface Comment {
  id: string
  memberName: string
  avatar: string
  email: string
  joined: string
  comment: string
  createdAt: string
  status: CommentStatus
  hasImage: boolean
  hasLink: boolean
  hasVideo: boolean
  videoUrl?: string
  videoTitle?: string
  hasExternalLink: boolean
  externalLinkUrl?: string
  contextType: ContextType
  contextLabel: string
  reportReason?: string // Report details submitted by the member
  imageUrl?: string // URL for image attachments
  documentUrl?: string // URL for document attachments
  documentName?: string // Optional document name
  userId: string // Added for member actions
  reportedById?: string
  reportedByName?: string
  reportedByEmail?: string
  reportCount?: number
}

function getContextLabel(type: string): string {
  switch (type) {
    case "member_feed":
      return "Member Feed"
    case "group_feed":
      return "Group"
    case "tool":
      return "Tool"
    case "course":
      return "Course"
    default:
      return "Unknown"
  }
}

function resolveAuthorName(profile: { full_name?: string; first_name?: string; display_name?: string } | null): string {
  if (!profile) return "Unknown"
  return profile.full_name || profile.first_name || profile.display_name || "Unknown"
}

function getContextBadge(contextType: ContextType, contextLabel: string) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
  switch (contextType) {
    case "member_feed":
      return <span className={`${base} bg-blue-100 text-blue-800`}>{contextLabel}</span>
    case "group_feed":
      return <span className={`${base} bg-purple-100 text-purple-800`}>Group: {contextLabel}</span>
    case "tool":
      return <span className={`${base} bg-green-100 text-green-800`}>Tool: {contextLabel}</span>
    case "course":
      return <span className={`${base} bg-orange-100 text-orange-800`}>Course: {contextLabel}</span>
    default:
      return <span className={`${base} bg-gray-100 text-gray-800`}>{contextLabel}</span>
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<CommentStatus>("reported")
  const [contextFilter, setContextFilter] = useState<"all" | ContextType>("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // dropdown/menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)

  // modals
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [guidelinesModalOpen, setGuidelinesModalOpen] = useState(false)
  const [suspendMemberModalOpen, setSuspendMemberModalOpen] = useState(false)
  const [currentComment, setCurrentComment] = useState<Comment | null>(null)

  // toast
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [toastOk, setToastOk] = useState(true)

  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")

  const [guidelines, setGuidelines] = useState("")
  const [guidelinesLoading, setGuidelinesLoading] = useState(false)

  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from("comments")
        .select(
          `
          id,
          body,
          status,
          context_type,
          context_id,
          attachment_type,
          attachment_url,
          image_url,
          document_url,
          document_name,
          video_url,
          video_title,
          link_url,
          created_at,
          author_id,
          report_reason,
          reported_by,
          profiles:author_id (
            id,
            full_name,
            first_name,
            display_name,
            avatar_url,
            email,
            created_at
          ),
          reporter:reported_by (
            id,
            full_name,
            first_name,
            display_name,
            email
          )
        `,
          { count: "exact" },
        )
        .in("status", ["reported", "approved", "deleted"])
        .eq("status", statusFilter)

      if (contextFilter !== "all") {
        query = query.eq("context_type", contextFilter)
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        console.error("Error fetching comments:", error)
        showToast("Failed to load comments", false)
        return
      }

      setTotalCount(count || 0)

      const rows = data || []

      // Collect unique group IDs
      const groupIds = [
        ...new Set(
          rows
            .filter((r: any) => r.context_type === "group_feed" && r.context_id)
            .map((r: any) => r.context_id),
        ),
      ]

      // Fetch group names in one query
      let groupMap: Record<string, string> = {}

      if (groupIds.length > 0) {
        const { data: groups } = await supabase
          .from("groups")
          .select("id, name")
          .in("id", groupIds)

        groupMap =
          groups?.reduce((acc: any, g: any) => {
            acc[g.id] = g.name
            return acc
          }, {}) || {}
      }

      const mapped: Comment[] = rows.map((row: any) => ({
        id: row.id,
        memberName: resolveAuthorName(row.profiles),
        avatar: row.profiles?.avatar_url || "",
        email: row.profiles?.email || "",
        joined: row.profiles?.created_at ? formatDate(row.profiles.created_at) : "Unknown",
        comment: row.body || "",
        createdAt: formatDate(row.created_at),
        status: row.status as CommentStatus,
        hasImage: !!row.image_url,
        hasVideo: !!row.video_url,
        hasExternalLink: !!row.link_url,
        hasLink: !!row.document_url,
        imageUrl: row.image_url || undefined,
        videoUrl: row.video_url || undefined,
        videoTitle: row.video_title || undefined,
        externalLinkUrl: row.link_url || undefined,
        documentUrl: row.document_url || undefined,
        documentName: row.document_name || undefined,
        contextType: (row.context_type || "member_feed") as ContextType,
        contextLabel:
          row.context_type === "group_feed"
            ? groupMap[row.context_id] || "Group"
            : getContextLabel(row.context_type || "member_feed"),
        reportReason: row.report_reason || "",
        reportedById: row.reported_by || undefined,
        reportedByName: resolveAuthorName(row.reporter),
        reportedByEmail: row.reporter?.email || undefined,
        userId: row.author_id,
      }))

      setComments(mapped)
    } catch (err) {
      console.error("Error:", err)
      showToast("Failed to load comments", false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, contextFilter])

  const fetchGuidelines = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    try {
      const { data, error } = await supabase.from("site_settings").select("community_guidelines").eq("id", 1).single()

      if (error) {
        console.error("Error fetching guidelines:", error)
        return
      }

      if (data?.community_guidelines) {
        setGuidelines(data.community_guidelines)
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }, [])

  const fetchReportCount = useCallback(async (reporterId: string) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return 0

    const { count, error } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("reported_by", reporterId)

    if (error) {
      console.error("Error fetching report count:", error)
      return 0
    }

    return count || 0
  }, [])

  useEffect(() => {
    fetchComments()
    fetchGuidelines()
  }, [fetchComments, fetchGuidelines, page, statusFilter, contextFilter])


  // Close menus on outside click (but not when clicking the menu itself or its button)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest(".comment-action-btn") && !target.closest(".comment-action-menu")) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // ESC closes any open modal
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCommentModalOpen(false)
        setMemberModalOpen(false)
        setContactModalOpen(false)
        setDeleteModalOpen(false)
        setGuidelinesModalOpen(false)
        setOpenMenuId(null)
        // closing new modals on ESC
        setSuspendMemberModalOpen(false)
        // Removed closing deleteMemberModalModal on ESC
      }
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [])

  function getStatusBadge(status: CommentStatus) {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    if (status === "approved") return <span className={`${base} bg-green-100 text-green-800`}>Approved</span>
    if (status === "reported") return <span className={`${base} bg-red-100 text-red-800`}>Reported</span>
    if (status === "active") return <span className={`${base} bg-blue-100 text-blue-800`}>Active</span>
    if (status === "deleted") return <span className={`${base} bg-gray-100 text-gray-800`}>Deleted</span>
    return null
  }

  async function approveComment(id: string) {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      showToast("Supabase not connected", false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .update({ status: "approved" })
        .eq("id", id)
        .select("status")
        .single()

      if (error) {
        console.error("Supabase error approving comment:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        showToast(`Failed to approve comment: ${error.message}`, false)
        return
      }

      if (data) {
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status: data.status as CommentStatus } : c)))
      }
      setOpenMenuId(null)
      showToast("Comment approved and restored to the community.", true)
    } catch (err) {
      console.error("Unexpected error approving comment:", err)
      showToast("Failed to approve comment. Please try again.", false)
    }
  }

  function openDelete(id: string) {
    const c = comments.find((x) => x.id === id)
    if (!c) return
    setCurrentComment(c)
    setDeleteModalOpen(true)
  }

  async function doDelete() {
    if (!currentComment) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      showToast("Unable to delete comment. Please try again.", false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .update({ status: "deleted" })
        .eq("id", currentComment.id)
        .select("status")
        .single()

      if (error) {
        console.error("Supabase error deleting comment:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        showToast(`Unable to delete comment: ${error.message}`, false)
        return
      }

      if (data) {
        setComments((prev) =>
          prev.map((c) => (c.id === currentComment.id ? { ...c, status: data.status as CommentStatus } : c)),
        )
      }
      setDeleteModalOpen(false)
      setCurrentComment(null)
      showToast("Comment deleted.", true)
    } catch (err) {
      console.error("Unexpected error deleting comment:", err)
      showToast("Unable to delete comment. Please try again.", false)
    } finally {
      setGuidelinesLoading(false)
    }
  }

  function openMember(id: string) {
    const c = comments.find((x) => x.id === id)
    if (!c) return
    setCurrentComment(c)
    setMemberModalOpen(true)
  }

  async function handleSuspendMember() {
    if (!currentComment) return

    const result = await updateMemberStatus(currentComment.userId, false)

    if (!result.success) {
      showToast(`Failed to suspend member: ${result.error}`, false)
      return
    }

    setSuspendMemberModalOpen(false)
    setMemberModalOpen(false)
    showToast("Member suspended successfully.", true)
  }

  function showContactModal() {
    const c = comments.find((x) => x.id === currentComment!.id)
    if (!c) return
    setCurrentComment(c) // This line might be redundant if currentComment is already set
    setMessageSubject("")
    setMessageBody("")
    setContactModalOpen(true)
  }

  async function saveGuidelines() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      showToast("Supabase not connected", false)
      return
    }

    setGuidelinesLoading(true)
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          community_guidelines: guidelines,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (error) {
        console.error("Error saving guidelines:", error)
        showToast("Failed to save guidelines", false)
        return
      }

      setGuidelinesModalOpen(false)
      showToast("Community guidelines saved successfully", true)
    } catch (err) {
      console.error("Error:", err)
      showToast("Failed to save guidelines", false)
    } finally {
      setGuidelinesLoading(false)
    }
  }

  function showToast(msg: string, ok = true) {
    setToastMsg(msg)
    setToastOk(ok)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const getFilenameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split("/").pop() || "document"
      return filename
    } catch {
      return "document"
    }
  }

  function getYouTubeEmbedUrl(url: string): string | null {
    try {
      const parsed = new URL(url)

      // youtube.com/watch?v=VIDEO_ID
      if (parsed.hostname.includes("youtube.com")) {
        const videoId = parsed.searchParams.get("v")
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }

      // youtu.be/VIDEO_ID
      if (parsed.hostname.includes("youtu.be")) {
        const videoId = parsed.pathname.replace("/", "")
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`
        }
      }

      return null
    } catch {
      return null
    }
  }

  // Placeholder for sendMessage function - this was the missing part
  async function sendMessage() {
    const supabase = getSupabaseBrowserClient()
    if (!supabase || !currentComment) {
      showToast("Failed to send message. Please try again.", false)
      return
    }

    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: JSON.stringify({
          to: currentComment.email,
          subject: messageSubject,
          body: messageBody,
        }),
      })

      if (error) {
        console.error("Error sending message:", error)
        showToast(`Failed to send message: ${error.message}`, false)
        return
      }

      setContactModalOpen(false)
      showToast("Message sent successfully", true)
    } catch (err) {
      console.error("Unexpected error sending message:", err)
      showToast("Failed to send message. Please try again.", false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header - Added Edit Community Guidelines button */}
          <section className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Comments</h1>
                <p className="text-gray-600">Review any reported comments to decide action.</p>
              </div>
              <button
                onClick={() => setGuidelinesModalOpen(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Edit Community Guidelines
              </button>
            </div>
          </section>

          {/* Filters - Added context filter dropdown */}
          <section className="mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search comments or members..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as CommentStatus)
                      setPage(1)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="reported">Reported</option>
                    <option value="approved">Approved</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
                <div className="sm:w-48">
                  <select
                    value={contextFilter}
                    onChange={(e) => {
                      setContextFilter(e.target.value as any)
                      setPage(1)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Contexts</option>
                    <option value="member_feed">Member Feed</option>
                    <option value="group_feed">Groups</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("reported")
                    setContextFilter("all")
                    setPage(1)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </section>

          {/* Comments Table - Added Context column */}
          <section>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Reported Comments</h2>
              </div>
              <div ref={tableRef}>
                {loading ? (
                  <div className="px-6 py-12 text-center text-gray-500">Loading comments...</div>
                ) : comments.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">No reported comments found.</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comment
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doc
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Video
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Context
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {comments.map((c) => {
                        const preview = c.comment.length > 80 ? c.comment.slice(0, 80) + "..." : c.comment
                        return (
                          <tr
                            key={c.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={async () => {
                              if (c.status === "reported" && c.reportedById) {
                                const count = await fetchReportCount(c.reportedById)
                                setCurrentComment({ ...c, reportCount: count })
                              } else {
                                setCurrentComment(c)
                              }
                              setCommentModalOpen(true)
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src={c.avatar || "/placeholder.svg?height=32&width=32&query=avatar"}
                                  alt={c.memberName}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                                <div className="font-medium text-gray-900">{c.memberName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-md">{preview}</div>
                            </td>
                            <td className="px-3 py-4 text-center text-sm">
                              {c.hasImage ? (
                                <i className="fa-solid fa-image text-green-600" title="Has image" />
                              ) : (
                                <i className="fa-solid fa-minus text-gray-300" />
                              )}
                            </td>
                            <td className="px-3 py-4 text-center text-sm">
                              {c.hasLink ? (
                                <i className="fa-solid fa-file-lines text-green-600" title="Has document" />
                              ) : (
                                <i className="fa-solid fa-minus text-gray-300" />
                              )}
                            </td>
                            <td className="px-3 py-4 text-center text-sm">
                              {c.hasVideo ? (
                                <i className="fa-solid fa-video text-green-600" title="Has video" />
                              ) : (
                                <i className="fa-solid fa-minus text-gray-300" />
                              )}
                            </td>
                            <td className="px-3 py-4 text-center text-sm">
                              {c.hasExternalLink ? (
                                <i className="fa-solid fa-link text-green-600" title="Has external link" />
                              ) : (
                                <i className="fa-solid fa-minus text-gray-300" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getContextBadge(c.contextType, c.contextLabel)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.createdAt}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(c.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative inline-block">
                                <button
                                  className="comment-action-btn p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setOpenMenuId((prev) => (prev === c.id ? null : c.id))
                                  }}
                                  aria-haspopup="true"
                                  aria-expanded={openMenuId === c.id}
                                  title="Actions"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle cx="12" cy="5" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="19" r="2" />
                                  </svg>
                                </button>

                                {/* 3-dot dropdown */}
                                {openMenuId === c.id && (
                                  <div className="comment-action-menu absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <span
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openMember(c.id)
                                        setOpenMenuId(null)
                                      }}
                                    >
                                      View Member
                                    </span>
                                    <span
                                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        showContactModal() // Changed from openContact
                                        setOpenMenuId(null)
                                      }}
                                    >
                                      Contact Member
                                    </span>
                                    <span
                                      className="block px-4 py-2 text-sm text-green-700 hover:bg-gray-50 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        approveComment(c.id)
                                      }}
                                    >
                                      Approve Comment
                                    </span>
                                    <span
                                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDelete(c.id)
                                        setOpenMenuId(null)
                                      }}
                                    >
                                      Delete Comment
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, totalCount)} of {totalCount}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button
                    disabled={page * pageSize >= totalCount}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Comment Details Modal - Added context section */}
        {commentModalOpen && currentComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setCommentModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Reported Comment</h2>
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Context</span>
                  <div className="mt-1">
                    {currentComment.contextType === "member_feed" ? (
                      <span className="text-sm text-gray-900">{currentComment.contextLabel}</span>
                    ) : (
                      <span className="text-sm text-gray-900">
                        {currentComment.contextType === "group_feed" && "Group"}
                        {currentComment.contextType === "tool" && "Tool"}
                        {currentComment.contextType === "course" && "Course"}
                        {" → "}
                        {currentComment.contextLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  <img
                    src={currentComment.avatar || "/placeholder.svg?height=48&width=48&query=avatar"}
                    alt={currentComment.memberName}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentComment.memberName}</h3>
                    <p className="text-sm text-gray-500">{currentComment.createdAt}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Reported Comment</h3>
                  <div className="text-gray-900 whitespace-pre-wrap">{currentComment.comment}</div>
                </div>

                {currentComment.imageUrl && (
                  <div className="mb-6">
                    <img
                      className="max-w-[200px] max-h-[200px] object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                      src={currentComment.imageUrl || "/placeholder.svg"}
                      alt="Comment attachment"
                      onClick={() => setLightboxImage(currentComment.imageUrl!)}
                    />
                  </div>
                )}

                {currentComment.videoUrl && (
                  <div className="mb-6">
                    {currentComment.videoTitle && (
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {currentComment.videoTitle}
                      </div>
                    )}

                    {(() => {
                      const embedUrl = getYouTubeEmbedUrl(currentComment.videoUrl)

                      if (embedUrl) {
                        return (
                          <div className="aspect-video max-w-[400px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <iframe
                              src={embedUrl}
                              title="YouTube video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        )
                      }

                      // Fallback for direct video files
                      return (
                        <video
                          controls
                          className="max-w-[400px] rounded-lg border border-gray-200 shadow-sm"
                          src={currentComment.videoUrl}
                        />
                      )
                    })()}
                  </div>
                )}

                {currentComment.documentUrl && (
                  <div className="mb-6">
                    <a
                      href={currentComment.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-12 bg-red-100 rounded flex items-center justify-center">
                        <i className="fa-solid fa-file-pdf text-red-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attached Document
                        </span>
                        <span className="text-sm text-gray-700 font-medium">
                          {currentComment.documentName || "View Document"}
                        </span>
                      </div>
                    </a>
                  </div>
                )}

                {currentComment.externalLinkUrl && (
                  <div className="mb-6">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      External Link
                    </span>
                    <a
                      href={currentComment.externalLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-1 text-blue-600 underline break-all"
                    >
                      {currentComment.externalLinkUrl}
                    </a>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Report Details (submitted by member)</h3>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {currentComment.reportReason && currentComment.reportReason.trim() ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentComment.reportReason}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No additional details were provided.</p>
                    )}
                    {currentComment.status === "reported" && currentComment.reportedByName && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-xs font-medium text-yellow-700 uppercase tracking-wider">
                          Reported By
                        </span>
                        <div className="mt-1 text-sm text-yellow-900">
                          {currentComment.reportedByName}
                          {currentComment.reportedByEmail && (
                            <span className="block text-xs text-yellow-700">
                              {currentComment.reportedByEmail}
                            </span>
                          )}
                        </div>

                        {typeof currentComment.reportCount === "number" && (
                          <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-900">
                            Reports submitted: {currentComment.reportCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    approveComment(currentComment.id)
                    setCommentModalOpen(false)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <i className="fa-solid fa-check mr-2" />
                  Approve Comment
                </button>
                <button
                  onClick={() => {
                    setCommentModalOpen(false)
                    openDelete(currentComment.id)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i className="fa-solid fa-trash mr-2" />
                  Delete Comment
                </button>
                <button
                  onClick={() => openMember(currentComment.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fa-solid fa-user mr-2" />
                  View Member
                </button>
                <button
                  onClick={() => {
                    setCommentModalOpen(false)
                    showContactModal() // Changed from openContact
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <i className="fa-solid fa-envelope mr-2" />
                  Contact Member
                </button>
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Modal */}
        {memberModalOpen && currentComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setMemberModalOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Member Details</h2>
                <button
                  onClick={() => setMemberModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center mb-6">
                  <img
                    src={currentComment.avatar || "/placeholder.svg?height=64&width=64&query=avatar"}
                    alt={currentComment.memberName}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{currentComment.memberName}</h3>
                    <p className="text-gray-600">{currentComment.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium text-gray-900">{currentComment.joined}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setSuspendMemberModalOpen(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i className="fa-solid fa-ban mr-2" />
                  Suspend Member
                </button>
                <button
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {suspendMemberModalOpen && currentComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setSuspendMemberModalOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Suspend Member?</h2>
                <button
                  onClick={() => setSuspendMemberModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-600">This will remove the member&apos;s access to the platform.</p>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={handleSuspendMember}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i className="fa-solid fa-ban mr-2" />
                  Suspend
                </button>
                <button
                  onClick={() => setSuspendMemberModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {contactModalOpen && currentComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setContactModalOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Message to {currentComment.memberName}</h2>
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="messageSubject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      id="messageSubject"
                      type="text"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter subject"
                    />
                  </div>
                  <div>
                    <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="messageContent"
                      rows={5}
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your message"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fa-solid fa-paper-plane mr-2" />
                  Send Message
                </button>
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModalOpen && currentComment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setDeleteModalOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Delete Comment?</h2>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-600">
                  Clicking delete will remove this comment from the community feed. You will still have access to it in
                  the admin area in case you need it for support reasons or want to change its status later.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={doDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i className="fa-solid fa-trash mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {guidelinesModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setGuidelinesModalOpen(false)}
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-100 relative">
                <h2 className="text-xl font-semibold text-gray-900">Community Guidelines</h2>
                <button
                  onClick={() => setGuidelinesModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>
              <div className="px-6 py-6">
                <p className="text-sm text-gray-500 mb-4">
                  These guidelines are shown to members in the Member Feed and define acceptable behavior.
                </p>
                <textarea
                  rows={12}
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Enter your community guidelines here..."
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={saveGuidelines}
                  disabled={guidelinesLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {guidelinesLoading ? "Saving..." : "Save Guidelines"}
                </button>
                <button
                  onClick={() => setGuidelinesModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastVisible && (
          <div className="fixed top-20 right-4 z-[60] flex items-center px-6 py-4 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="mr-3">
                {toastOk ? (
                  <i className="fa-solid fa-check-circle text-green-500" />
                ) : (
                  <i className="fa-solid fa-exclamation-circle text-red-500" />
                )}
              </div>
              <span className="text-gray-900">{toastMsg}</span>
            </div>
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage || "/placeholder.svg"}
              alt="Full size preview"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
