"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getDirectoryMembers } from "./actions"
import { getModerationProfile } from "../groups/actions/get-moderation-profile"
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

interface DirectoryProfileModalProps {
  userId: string
  open: boolean
  onClose: () => void
  mode?: "directory" | "moderation"
}

export function DirectoryProfileModal({ userId, open, onClose, mode = "directory" }: DirectoryProfileModalProps) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [brandColor, setBrandColor] = useState<string | undefined>(undefined)
  const [messageBody, setMessageBody] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

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
    if (!open || !userId) {
      setMember(null)
      setLoading(true)
      setMessageBody("")
      setSendSuccess(false)
      setSendError(null)
      return
    }

    async function fetchMember() {
      setLoading(true)

      if (mode === "moderation") {
        const res = await getModerationProfile(userId)
        if (!res.error && res.profile) {
          const profile = res.profile
          setMember({
            id: profile.id,
            name: profile.full_name || "Unknown User",
            avatarUrl: profile.avatar_url || null,
            businessName: profile.company || null,
            expertise: profile.job_title || null,
            memberSince: profile.id || "",
            bio: profile.bio || null,
            social: (profile.social_links as Member["social"]) || {},
          })
        }
      } else {
        const res = await getDirectoryMembers({ page: 1, pageSize: 1000 })
        if (!res.error) {
          const found = res.members.find((m) => m.id === userId)
          if (found) {
            setMember(found)
          }
        }
      }

      setLoading(false)
    }

    fetchMember()
  }, [userId, open, mode])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Member Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">Loading profile...</div>
          </div>
        ) : !member ? (
          <div className="flex justify-center py-12">
            <div className="text-red-500">Profile not found</div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pt-2">
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24">
                {member.avatarUrl && (
                  <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name || "Member"} />
                )}
                <AvatarFallback
                  className="text-2xl font-bold flex items-center justify-center"
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
              <h2 className="text-xl font-bold text-gray-900">{member.name || "Member"}</h2>
              {member.businessName && <p className="text-primary font-medium mt-0.5">{member.businessName}</p>}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">About</h3>
              <p className="whitespace-pre-line text-gray-700 leading-relaxed">{member.bio || "No bio available"}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {member.social?.linkedin && (
                <a
                  href={member.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-linkedin mr-2"></i>
                  LinkedIn
                </a>
              )}
              {member.social?.youtube && (
                <a
                  href={member.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-youtube mr-2"></i>
                  YouTube
                </a>
              )}
              {member.social?.instagram && (
                <a
                  href={member.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-instagram mr-2"></i>
                  Instagram
                </a>
              )}
              {member.social?.facebook && (
                <a
                  href={member.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-facebook mr-2"></i>
                  Facebook
                </a>
              )}
              {member.social?.tiktok && (
                <a
                  href={member.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-tiktok mr-2"></i>
                  TikTok
                </a>
              )}
              {(member.social?.twitter || member.social?.x) && (
                <a
                  href={member.social.twitter || member.social.x || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <i className="fa-brands fa-x-twitter mr-2"></i>X
                </a>
              )}
              {member.social?.website && (
                <a
                  href={member.social.website}
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
              Member since {formatMemberSince(member.memberSince)}
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
                      recipientId: member.id,
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
  )
}
