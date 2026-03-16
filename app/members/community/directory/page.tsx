"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDirectoryMembers } from "./actions"
import { sendDirectMessage } from "../groups/[id]/members/actions"
import { createBrowserClient } from "@supabase/ssr"

type Member = {
  id: string
  name: string
  avatarUrl: string | null
  businessName: string | null
  expertise: string | null
  memberSince: string
  bio: string | null
  social: {
    linkedin?: string | null
    twitter?: string | null
    website?: string | null
    youtube?: string | null
    instagram?: string | null
    facebook?: string | null
    tiktok?: string | null
    x?: string | null
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

// tiny classnames helper
function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ")
}

export default function DirectoryPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [brandColor, setBrandColor] = useState<string | undefined>(undefined)
  const [brandAccentColor, setBrandAccentColor] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState("Member Directory")

  // Filter states
  const [nameDraft, setNameDraft] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [cityDraft, setCityDraft] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("")

  // Message modal states
  const [messageBody, setMessageBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrandColorAndTitle() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
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
            typeof data.member_navigation === "string" ? JSON.parse(data.member_navigation) : data.member_navigation
          const communityNav = navItems.find((item: { id?: string }) => item.id === "community")

          if (communityNav?.children && Array.isArray(communityNav.children)) {
            const directoryChild = communityNav.children.find((c: { id?: string; label?: string }) => c.id === "community_directory")
            if (directoryChild?.label) {
              setPageTitle(directoryChild.label)
            }
          }
        } catch (e) {
          // Keep default title on parse error
        }
      }
    }
    fetchBrandColorAndTitle()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setNameFilter(nameDraft), 300)
    return () => clearTimeout(t)
  }, [nameDraft])

  useEffect(() => {
    const t = setTimeout(() => setCityFilter(cityDraft), 300)
    return () => clearTimeout(t)
  }, [cityDraft])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setErrorMsg(null)

      const res = await getDirectoryMembers({
        page: 1,
        pageSize: 20,
        name: nameFilter,
        city: cityFilter,
        country: countryFilter,
      })

      console.log("DIRECTORY DEBUG:", res)

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
      setPage(1)
      setHasMore(res.members.length === 20)
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [nameFilter, cityFilter, countryFilter])

  const clearFilters = () => {
    setNameDraft("")
    setNameFilter("")
    setCityDraft("")
    setCityFilter("")
    setCountryFilter("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-muted/40">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} members</p>
          </div>
          <div></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                placeholder="Search by city..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
                >
                  <option value="">All Countries</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Brazil">Brazil</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{members.length}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> members
            </div>
            <button onClick={clearFilters} className="text-primary hover:text-primary/80 font-medium text-sm">
              <i className="fa-solid fa-filter-circle-xmark mr-1"></i>
              Clear filters
            </button>
          </div>
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
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
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

                    const res = await getDirectoryMembers({
                      page: nextPage,
                      pageSize: 20,
                      name: nameFilter,
                      city: cityFilter,
                      country: countryFilter,
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
                    href={selectedMember.social.twitter || selectedMember.social.x || ""}
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
                <div className="mt-3 flex items-center justify-between">
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
