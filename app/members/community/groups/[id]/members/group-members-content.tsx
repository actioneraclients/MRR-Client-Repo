"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getGroupMembers,
  sendDirectMessage,
  promoteGroupMember,
  removeGroupMember,
} from "./actions"
import { createBrowserClient } from "@supabase/ssr"

type Member = {
  id: string
  name: string
  avatarUrl: string | null
  businessName: string | null
  expertise: string | null
  memberSince: string
  bio: string | null
  role: "admin" | "member"
  social: {
    linkedin?: string
    twitter?: string
    website?: string
    youtube?: string
    instagram?: string
    facebook?: string
    tiktok?: string
    x?: string
  }
}

function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "?"

  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatMemberSince(dateString?: string | null): string {
  if (!dateString) return "Unknown"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Unknown"
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}/${year}`
  } catch {
    return "Unknown"
  }
}

export default function GroupMembersContent() {
  const params = useParams()
  const groupId = params.id as string
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") ?? ""

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [groupOwnerId, setGroupOwnerId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchDraft, setSearchDraft] = useState(initialSearch)
  const [totalCount, setTotalCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [brandColor, setBrandColor] = useState<string | undefined>(undefined)

  const [messageBody, setMessageBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase.auth.getUser()
      setCurrentUserId(data.user?.id ?? null)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    async function fetchGroupOwner() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data } = await supabase
        .from("groups")
        .select("created_by")
        .eq("id", groupId)
        .single()

      if (data?.created_by) {
        setGroupOwnerId(data.created_by)
      }
    }

    if (groupId) fetchGroupOwner()
  }, [groupId])

  useEffect(() => {
    async function fetchBrandColor() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase.from("site_settings").select("brand_background_color").single()
      if (data?.brand_background_color) {
        setBrandColor(data.brand_background_color)
      }
    }
    fetchBrandColor()
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setErrorMsg(null)

      const res = await getGroupMembers({
        groupId,
        page: 1,
        pageSize: 20,
        search,
      })

      if (!active) return

      if (res.error) {
        setMembers([])
        setHasMore(false)
        setErrorMsg(res.error)
        setLoading(false)
        return
      }

      setMembers(res.members)
      setTotalCount(res.totalCount)
      setIsAdmin(res.isAdmin)
      setPage(1)
      setHasMore(res.members.length === 20)
      setLoading(false)
    }

    if (groupId) load()

    return () => {
      active = false
    }
  }, [groupId, search])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchDraft), 300)
    return () => clearTimeout(t)
  }, [searchDraft])

  async function handlePromoteToAdmin(memberId: string) {
    const res = await promoteGroupMember({
      groupId,
      memberId,
    })

    if (res?.error) {
      alert(res.error)
      return
    }

    // Optimistically update UI
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: "admin" } : m)),
    )
  }

  async function handleRemoveFromGroup(memberId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the group?",
    )

    if (!confirmed) return

    const res = await removeGroupMember({
      groupId,
      memberId,
    })

    if (res?.error) {
      alert(res.error)
      return
    }

    // Remove from UI
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href={`/members/community/groups/${groupId}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Back to Group
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Group Members</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} members</p>
          </div>
          <div></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search members by name..."
            className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading members...</div>
          </div>
        ) : errorMsg ? (
          <div className="flex justify-center py-12">
            <div className="text-red-500">{errorMsg}</div>
          </div>
        ) : members.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">No members found</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="relative bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {isAdmin &&
                    member.id !== currentUserId &&
                    member.id !== groupOwnerId && (
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-gray-900"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === member.id ? null : member.id)
                          }}
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </Button>

                        {openMenuId === member.id && (
                          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            {member.role === "member" && (
                              <button
                                onClick={() => {
                                  handlePromoteToAdmin(member.id)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Promote to Admin
                              </button>
                            )}

                            <button
                              onClick={() => {
                                handleRemoveFromGroup(member.id)
                                setOpenMenuId(null)
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remove from Group
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-center mb-4">
                    <Avatar className="w-20 h-20">
                      {member.avatarUrl && (
                        <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name || "Member"} />
                      )}
                      <AvatarFallback
                        className="text-xl font-bold flex items-center justify-center"
                        style={{
                          backgroundColor: brandColor || "#e5e7eb",
                          color: "#000000",
                        }}
                      >
                        {getInitials(member.name) || "M"}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{member.name || "Member"}</h3>
                    {member.role === "admin" && (
                      <span className="inline-block mt-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                    {member.businessName && (
                      <p className="text-sm text-primary font-medium mt-0.5">{member.businessName}</p>
                    )}
                  </div>

                  <div className="space-y-2 mb-5">
                    {member.expertise && (
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <i className="fa-solid fa-briefcase w-4 mr-2 text-gray-400"></i>
                        <span>{member.expertise}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center text-sm text-gray-500">
                      <i className="fa-regular fa-clock w-4 mr-2 text-gray-400"></i>
                      <span>Member since {formatMemberSince(member.memberSince)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full text-black hover:opacity-90"
                    onClick={() => setSelectedMember(member)}
                    style={brandColor ? { backgroundColor: brandColor } : undefined}
                  >
                    View Profile
                  </Button>
                </div>
              ))}
            </div>

            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={async () => {
                    setLoadingMore(true)
                    const nextPage = page + 1

                    const res = await getGroupMembers({
                      groupId,
                      page: nextPage,
                      pageSize: 20,
                      search,
                    })

                    if (!res.error) {
                      setMembers((prev) => [...prev, ...res.members])
                      setPage(nextPage)
                      setHasMore(res.members.length === 20)
                    }

                    setLoadingMore(false)
                  }}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={!!selectedMember}
        onOpenChange={() => {
          setSelectedMember(null)
          setMessageBody("")
          setSendSuccess(false)
          setSendError(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Member Profile</DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <>
              <div className="flex-1 overflow-y-auto pt-2">
              <div className="flex justify-center mb-4">
                <Avatar className="w-24 h-24">
                  {selectedMember.avatarUrl && (
                    <AvatarImage
                      src={selectedMember.avatarUrl || "/placeholder.svg"}
                      alt={selectedMember.name || "Member"}
                    />
                  )}
                  <AvatarFallback
                    className="text-2xl font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: brandColor || "#e5e7eb",
                      color: "#000000",
                    }}
                  >
                    {getInitials(selectedMember.name) || "M"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedMember.name || "Member"}</h2>
                {selectedMember.businessName && (
                  <p className="text-primary font-medium mt-0.5">{selectedMember.businessName}</p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
                <p className="whitespace-pre-line text-gray-700 leading-relaxed">{selectedMember.bio || "No bio available"}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {selectedMember.social?.linkedin && (
                  <a
                    href={selectedMember.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-linkedin mr-2"></i>
                    LinkedIn
                  </a>
                )}
                {selectedMember.social?.youtube && (
                  <a
                    href={selectedMember.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-youtube mr-2"></i>
                    YouTube
                  </a>
                )}
                {selectedMember.social?.instagram && (
                  <a
                    href={selectedMember.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-instagram mr-2"></i>
                    Instagram
                  </a>
                )}
                {selectedMember.social?.facebook && (
                  <a
                    href={selectedMember.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-facebook mr-2"></i>
                    Facebook
                  </a>
                )}
                {selectedMember.social?.tiktok && (
                  <a
                    href={selectedMember.social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-tiktok mr-2"></i>
                    TikTok
                  </a>
                )}
                {(selectedMember.social?.twitter || selectedMember.social?.x) && (
                  <a
                    href={selectedMember.social.twitter || selectedMember.social.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <i className="fa-brands fa-x-twitter mr-2"></i>X
                  </a>
                )}
                {selectedMember.social?.website && (
                  <a
                    href={selectedMember.social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <i className="fa-solid fa-globe mr-2"></i>
                    Website
                  </a>
                )}
              </div>

              <div className="text-center text-sm text-gray-500">
                <i className="fa-regular fa-clock mr-1"></i>
                Member since {formatMemberSince(selectedMember.memberSince)}
              </div>
              </div>

              <div className="border-t bg-white p-4 sticky bottom-0 shrink-0">
                <label htmlFor="message-body" className="block text-sm font-semibold text-gray-700 mb-2">
                  Send a Message
                </label>
                <textarea
                  id="message-body"
                  rows={3}
                  placeholder="Write a message…"
                  value={messageBody}
                  onChange={(e) => {
                    setMessageBody(e.target.value)
                    setSendSuccess(false)
                    setSendError(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {sendSuccess && <span className="text-sm text-green-600">Message sent</span>}
                    {sendError && <span className="text-sm text-red-600">{sendError}</span>}
                  </div>
                  <Button
                    disabled={!messageBody.trim() || isSending}
                    onClick={async () => {
                      setIsSending(true)
                      setSendSuccess(false)
                      setSendError(null)

                      const result = await sendDirectMessage({
                        recipientId: selectedMember.id,
                        body: messageBody.trim(),
                      })

                      setIsSending(false)

                      if (result.error) {
                        setSendError(result.error)
                      } else {
                        setMessageBody("")
                        setSendSuccess(true)
                      }
                    }}
                    style={brandColor ? { backgroundColor: brandColor } : undefined}
                    className="text-black hover:opacity-90"
                  >
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
