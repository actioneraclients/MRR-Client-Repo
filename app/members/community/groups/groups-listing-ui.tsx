"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, Search, Plus, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createGroup, type CreateGroupInput, type GroupForListing } from "./actions"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GroupCategory } from "./actions/get-group-categories"
import { joinGroup } from "./actions/join-group"
import { leaveGroup } from "./actions/leave-group"
import { UpgradeRequiredModal } from "./upgrade-required-modal"
import { RequestToJoinModal } from "./components/request-to-join-modal"
import { AdminJoinRequestsList } from "./components/admin-join-requests-list"
import { requestToJoinGroup, getMyGroupJoinRequestStatuses } from "./actions/group-join-requests"
import { ContactAdminModal } from "./components/contact-admin-modal"
import type { JoinRequestRow } from "./actions/get-admin-join-requests" // Import JoinRequestRow
import { joinGroupByInviteCode } from "./actions/join-by-invite-code" // Import the server action for joining by invite code

// Utility function for class names
function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

// Role badge component
function RoleBadge({ role }: { role: string }) {
  const roleStyles: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    member: "bg-gray-100 text-gray-800",
  }

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role] || roleStyles.member}`}>
      {roleLabels[role] || "Member"}
    </span>
  )
}

// Group card component
function GroupCard({
  group,
  onJoinClick,
  onContactAdminClick,
  onViewDetailsClick,
  onLeaveClick,
  activeTab,
  requestStatus,
  brandAccentColor,
  brandBackgroundColor,
}: {
  group: GroupForListing
  onJoinClick: (group: GroupForListing) => void
  onContactAdminClick: (group: GroupForListing) => void
  onViewDetailsClick: (group: GroupForListing) => void
  onLeaveClick: (group: GroupForListing) => void
  activeTab: "all" | "joined" | "moderating"
  requestStatus?: "pending" | "rejected"
  brandAccentColor: string
  brandBackgroundColor: string
}) {
  const router = useRouter()
  const isMember = group.role !== "none"

  const handleCardClick = () => {
    if (isMember) {
      router.push(`/members/community/groups/${group.id}`)
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMember) {
      router.push(`/members/community/groups/${group.id}`)
    } else {
      onJoinClick(group)
    }
  }

  const handleContactAdminClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onContactAdminClick(group)
  }

  const getButtonConfig = () => {
    // 1. Membership check first - if member, show Access button
    if (isMember) {
      return { text: "Access", className: "bg-blue-600 text-white hover:bg-blue-700", disabled: false }
    }
    // 2. Open join policy - show Join button
    if (group.joinPolicy === "open") {
      return { text: "Join", className: "bg-green-600 text-white hover:bg-green-700", disabled: false }
    }
    // 3. Check request status
    if (requestStatus === "pending") {
      return { text: "Request Pending", className: "bg-gray-400 text-white cursor-not-allowed", disabled: true }
    }
    if (requestStatus === "rejected") {
      return { text: "Denied", className: "bg-red-400 text-white cursor-not-allowed", disabled: true }
    }
    // 4. No request - show Request to Join
    return { text: "Request to Join", className: "bg-amber-600 text-white hover:bg-amber-700", disabled: false }
  }

  const buttonConfig = getButtonConfig()

  return (
    <div
      onClick={handleCardClick}
      className={cx(
        "bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full",
        isMember ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" : "cursor-default",
      )}
    >
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100">
        {group.listingImageUrl ? (
          <Image
            className="w-full h-full object-cover object-center"
            src={group.listingImageUrl || "/placeholder.svg"}
            alt={group.name}
            width={1200}
            height={400}
          />
        ) : (
          <div className="relative w-full h-full overflow-hidden">
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
                background: `linear-gradient(135deg, ${brandAccentColor}, ${brandBackgroundColor})`,
                opacity: 0.85,
              }}
            />

            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Title */}
            <div className="relative z-10 flex items-center justify-center h-full px-4 text-center">
              <span className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-2 drop-shadow-md">
                {group.name}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{group.name}</h3>
          {isMember && <RoleBadge role={group.role} />}
        </div>

        {group.createdByName && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {group.createdByAvatarUrl ? (
              <img
                src={group.createdByAvatarUrl}
                alt={group.createdByName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            )}
            <span>Created by {group.createdByName}</span>
          </div>
        )}

        {group.description && (
          <p className="text-gray-600 text-base leading-relaxed line-clamp-2">{group.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4">
          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
            {(group.memberCount ?? 0) === 1 ? "1 Member" : `${group.memberCount ?? 0} Members`}
          </span>

          <div className="flex flex-wrap gap-2">
            {requestStatus === "rejected" && (
              <Button
                onClick={handleContactAdminClick}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                Contact Admin
              </Button>
            )}
            {activeTab !== "joined" && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetailsClick(group)
                }}
              >
                View Details
              </Button>
            )}
            {activeTab === "joined" && group.role === "member" && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onLeaveClick(group)
                }}
                className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
              >
                Leave Group
              </Button>
            )}
            <Button onClick={handleButtonClick} className={buttonConfig.className} disabled={buttonConfig.disabled}>
              {buttonConfig.text}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Groups toolbar component
function GroupsToolbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  onCreateGroup,
  categories,
  onJoinWithInvite,
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTopic: string
  onTopicChange: (topic: string) => void
  onCreateGroup: () => void
  categories: { id: string; name: string }[]
  onJoinWithInvite: () => void
}) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Tabs */}
        <div className="flex flex-wrap gap-2">
          {["all", "joined", "moderating"].map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cx(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {tab === "all" ? "All" : tab === "joined" ? "Joined" : "Moderating"}
            </button>
          ))}
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Category dropdown */}
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="appearance-none bg-gray-100 text-gray-700 px-4 py-2 pr-10 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="">All Categories</option>
              {(categories ?? []).filter(Boolean).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-56 lg:w-64 bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Join with Invite Code button */}
          <Button
            onClick={onJoinWithInvite}
            variant="outline"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-transparent"
          >
            Join with Invite Code
          </Button>

          {/* Create Group button */}
          <Button
            onClick={onCreateGroup}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Create Group Modal component
function CreateGroupModal({
  open,
  onClose,
  onSuccess,
  categories,
  canCreatePrivateGroup,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  categories: GroupCategory[]
  canCreatePrivateGroup: boolean
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isCreated, setIsCreated] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [visibility, setVisibility] = useState<"public" | "request" | "private">("public")
  const [inviteCode, setInviteCode] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [listingImage, setListingImage] = useState<File | null>(null)
  const [headerImage, setHeaderImage] = useState<File | null>(null)
  const [avatarImage, setAvatarImage] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      setCategoryId("")
    }
  }, [open])

  useEffect(() => {
    if (!canCreatePrivateGroup && visibility === "private") {
      setVisibility("public")
    }
  }, [canCreatePrivateGroup, visibility])

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugManuallyEdited) {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
      setSlug(generatedSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setSlug(value)
  }

  const resetForm = () => {
    setName("")
    setSlug("")
    setSlugManuallyEdited(false)
    setVisibility("public")
    setInviteCode("")
    setDescription("")
    setCategoryId("")
    setListingImage(null)
    setHeaderImage(null)
    setAvatarImage(null)
    setError(null)
    setIsCreated(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Group name is required")
      return
    }
    if (!slug.trim()) {
      setError("Slug is required")
      return
    }
    if (visibility === "private" && !inviteCode.trim()) {
      setError("Invite code is required for private groups")
      return
    }

    setIsPending(true)
    ;(async () => {
      try {
        let listing_image_url: string | undefined
        let header_image_url: string | undefined
        let avatar_url: string | undefined

        const supabase = getSupabaseBrowserClient()

        if (supabase) {
          const tempId = crypto.randomUUID()

          if (listingImage) {
            const path = `${tempId}/listing.jpg`
            const { error: uploadError } = await supabase.storage
              .from("groups")
              .upload(path, listingImage, { upsert: true, contentType: listingImage.type })

            if (uploadError) {
              setError(`Failed to upload listing image: ${uploadError.message}`)
              return
            }

            const { data } = supabase.storage.from("groups").getPublicUrl(path)
            listing_image_url = data.publicUrl
          }

          if (headerImage) {
            const path = `${tempId}/header.jpg`
            const { error: uploadError } = await supabase.storage
              .from("groups")
              .upload(path, headerImage, { upsert: true, contentType: headerImage.type })

            if (uploadError) {
              setError(`Failed to upload header image: ${uploadError.message}`)
              return
            }

            const { data } = supabase.storage.from("groups").getPublicUrl(path)
            header_image_url = data.publicUrl
          }

          if (avatarImage) {
            const path = `${tempId}/avatar.jpg`
            const { error: uploadError } = await supabase.storage
              .from("groups")
              .upload(path, avatarImage, { upsert: true, contentType: avatarImage.type })

            if (uploadError) {
              setError(`Failed to upload avatar image: ${uploadError.message}`)
              return
            }

            const { data } = supabase.storage.from("groups").getPublicUrl(path)
            avatar_url = data.publicUrl
          }
        }

        const input: CreateGroupInput = {
          name: name.trim(),
          slug: slug.trim(),
          visibility,
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          listing_image_url,
          header_image_url,
          avatar_url,
          invite_code: visibility === "private" ? inviteCode.trim() : undefined,
        }

        const result = await createGroup(input)
        if (result.success) {
          setIsCreated(true)
          return
        } else {
          setError(result.error || "Failed to create group")
        }
      } finally {
        setIsPending(false)
      }
    })()
  }

  const handleClose = () => {
    if (!isPending) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        {isCreated ? (
          <>
            <div className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Group Created</h3>
              <p className="text-gray-600 mb-6">
                Your group has been created successfully.
                <br />
                <br />
                Please refresh the page to see it listed and to access it.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create Group</DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <form id="create-group-form" onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Core Info Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                    Core Info
                  </h3>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Real Estate Investors"
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="my-awesome-group"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Visibility <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="visibility"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "public" | "request" | "private")}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isPending}
                    >
                      <option value="public">Public - Anyone can see and join</option>
                      <option value="request">Request - Anyone can see, must request to join</option>
                      {canCreatePrivateGroup && (
                        <option value="private">Private Group - Access Through Invite Code</option>
                      )}
                    </select>
                  </div>

                  {visibility === "private" && (
                    <div>
                      <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Invite Code <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="inviteCode"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter invite code"
                        disabled={isPending}
                      />
                      <p className="mt-1.5 text-sm text-gray-500">
                        Required for private groups. Members will use this code to join.
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="What is this group about?"
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category
                    </label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isPending}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Images Section */}
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">
                    Images
                  </h3>

                  <div>
                    <label htmlFor="listingImage" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Listing Image
                    </label>
                    <Input
                      id="listingImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setListingImage(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isPending}
                    />
                    <p className="text-sm text-gray-500 mt-1.5">
                      Displayed on the groups listing page (recommended: 1200×400)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="headerImage" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Header Image
                    </label>
                    <Input
                      id="headerImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setHeaderImage(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isPending}
                    />
                    <p className="text-sm text-gray-500 mt-1.5">Large banner displayed at the top of the group page</p>
                  </div>

                  <div>
                    <label htmlFor="avatarImage" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Avatar Image
                    </label>
                    <Input
                      id="avatarImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarImage(e.target.files?.[0] || null)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isPending}
                    />
                    <p className="text-sm text-gray-500 mt-1.5">Square icon used as the group avatar</p>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-900 font-medium">Important Note</p>
                  <p className="mt-1 text-sm text-amber-800">
                    After you create this group, please refresh the page you are on to see the group listed and to
                    access and start working in it.
                  </p>
                </div>
              </form>
            </div>

            {/* Use DialogFooter for consistency */}
            <DialogFooter className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" form="create-group-form" disabled={isPending || !name.trim() || !slug.trim()}>
                {isPending ? "Creating group…" : "Create Group"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Leave Group Modal component
function LeaveGroupModal({
  group,
  open,
  onClose,
  onConfirm,
}: {
  group: GroupForListing | null
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
        </DialogHeader>

        <div className="py-4 text-gray-600">
          You are about to leave this group, which will remove you as a member
          from the group.
          <br /><br />
          Confirm below.
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Group Details Modal component
function GroupDetailsModal({
  group,
  open,
  onClose,
  onJoinClick,
  requestStatus,
  brandAccentColor,
  brandBackgroundColor,
}: {
  group: GroupForListing | null
  open: boolean
  onClose: () => void
  onJoinClick: (group: GroupForListing) => void
  requestStatus?: "pending" | "rejected"
  brandAccentColor: string
  brandBackgroundColor: string
}) {
  const router = useRouter()

  if (!group) return null

  const isMember = group.role !== "none"
  const headerImageUrl = (group as { header_image_url?: string }).header_image_url || group.listingImageUrl

  const getActionButtonConfig = () => {
    if (isMember) {
      return {
        text: "Access",
        onClick: () => {
          router.push(`/members/community/groups/${group.id}`)
          onClose()
        },
        disabled: false,
        className: "bg-blue-600 text-white hover:bg-blue-700",
      }
    }
    if (group.joinPolicy === "open") {
      return {
        text: "Join",
        onClick: () => {
          onJoinClick(group)
          onClose()
        },
        disabled: false,
        className: "bg-green-600 text-white hover:bg-green-700",
      }
    }
    if (requestStatus === "pending") {
      return { text: "Request Pending", onClick: () => {}, disabled: true, className: "bg-gray-400 text-white cursor-not-allowed" }
    }
    if (requestStatus === "rejected") {
      return { text: "Denied", onClick: () => {}, disabled: true, className: "bg-red-400 text-white cursor-not-allowed" }
    }
    return {
      text: "Request to Join",
      onClick: () => {
        onJoinClick(group)
        onClose()
      },
      disabled: false,
      className: "bg-amber-600 text-white hover:bg-amber-700",
    }
  }

  const buttonConfig = getActionButtonConfig()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {headerImageUrl ? (
          <div className="w-full h-40 flex-shrink-0 overflow-hidden bg-gray-100">
            <Image
              className="w-full h-full object-cover object-center"
              src={headerImageUrl}
              alt={group.name}
              width={600}
              height={160}
            />
          </div>
        ) : (
          <div className="relative w-full h-40 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/texture.jpg')",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${brandAccentColor}, ${brandBackgroundColor})`,
                opacity: 0.85,
              }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 flex items-center justify-center h-full px-4 text-center">
              <span className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
                {group.name}
              </span>
            </div>
          </div>
        )}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{group.name}</DialogTitle>
          </DialogHeader>
          {group.createdByName && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {group.createdByAvatarUrl ? (
                <img
                  src={group.createdByAvatarUrl}
                  alt={group.createdByName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <span>Created by {group.createdByName}</span>
            </div>
          )}
          <div className="text-sm text-gray-600">
            {(group.memberCount ?? 0) === 1 ? "1 Member" : `${group.memberCount ?? 0} Members`}
          </div>
          {group.description && (
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{group.description}</p>
          )}
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={buttonConfig.onClick} disabled={buttonConfig.disabled} className={buttonConfig.className}>
              {buttonConfig.text}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Join Group Modal component
function JoinGroupModal({
  group,
  open,
  onClose,
  onSuccess,
}: {
  group: GroupForListing | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useState(false)

  const handleProceed = () => {
    if (!group) return

    startTransition(async () => {
      const result = await joinGroup(group.id)
      if (result.success) {
        onClose()
        onSuccess()
      } else {
        alert(result.error || "Failed to join group")
      }
    })
  }

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-gray-600">
            You are about to join the "{group.name}" group.
            <br />
            Click Proceed to continue.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleProceed} disabled={isPending}>
            {isPending ? "Joining..." : "Proceed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GroupsListingUI({
  initialGroups,
  canCreateGroups,
  canCreatePrivateGroup,
  categories,
  adminJoinRequests,
  upgradeLink,
}: {
  initialGroups: GroupForListing[]
  canCreateGroups: boolean
  canCreatePrivateGroup: boolean
  categories: GroupCategory[]
  adminJoinRequests: JoinRequestRow[]
  upgradeLink: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupSlug = searchParams.get("group")

  const [groups, setGroups] = useState<GroupForListing[]>(initialGroups ?? [])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [joinModalGroup, setJoinModalGroup] = useState<GroupForListing | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"all" | "joined" | "moderating">("all")
  const [moderatingSubTab, setModeratingSubTab] = useState<"groups" | "requests">("groups")
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [requestStatuses, setRequestStatuses] = useState<Record<string, "pending" | "rejected">>({})
  const [requestModalGroup, setRequestModalGroup] = useState<GroupForListing | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [contactAdminGroup, setContactAdminGroup] = useState<GroupForListing | null>(null)
  const [isContactAdminModalOpen, setIsContactAdminModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [detailsGroup, setDetailsGroup] = useState<GroupForListing | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [leaveGroupTarget, setLeaveGroupTarget] = useState<GroupForListing | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState("Discover Groups")
  const [brandAccentColor, setBrandAccentColor] = useState<string>("#1f2937")
  const [brandBackgroundColor, setBrandBackgroundColor] = useState<string>("#111827")

  const didPrefillRef = useRef<boolean>(false)

  useEffect(() => {
    async function fetchPageTitle() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase
          .from("site_settings")
          .select("member_navigation, brand_accent_color, brand_background_color")
          .single()

        if (data?.brand_accent_color) {
          setBrandAccentColor(data.brand_accent_color)
        }
        if (data?.brand_background_color) {
          setBrandBackgroundColor(data.brand_background_color)
        }
        if (data?.member_navigation) {
          const navItems =
            typeof data.member_navigation === "string" ? JSON.parse(data.member_navigation) : data.member_navigation
          const communityNav = navItems.find((item: { id?: string }) => item.id === "community")

          if (communityNav?.children && Array.isArray(communityNav.children)) {
            const groupsChild = communityNav.children.find((c: { id?: string; label?: string }) => c.id === "community_groups")
            if (groupsChild?.label) {
              setPageTitle(`Discover ${groupsChild.label}`)
            }
          }
        }
      } catch {
        // Keep default title
      }
    }
    fetchPageTitle()
  }, [])

  useEffect(() => {
    console.log("[Groups] canCreateGroups =", canCreateGroups)
  }, [])

  useEffect(() => {
    if (groupSlug === null) return
    if (didPrefillRef.current === true) return

    const foundGroup = groups.find((group) => group.slug === groupSlug)
    if (!foundGroup) return

    setSearchTerm(foundGroup.name)
    setSelectedTab("all")
    didPrefillRef.current = true
  }, [groupSlug, groups])

  useEffect(() => {
    async function fetchRequestStatuses() {
      const result = await getMyGroupJoinRequestStatuses()
      if (result.success && result.statuses) {
        setRequestStatuses(result.statuses)
      }
    }
    fetchRequestStatuses()
  }, [])

  useEffect(() => {
    setGroups(initialGroups ?? [])
  }, [initialGroups])

  useEffect(() => {
    if (groups && groups.length > 0) {
      console.log("[Groups Debug] Sample group object:", groups[0])
    }
  }, [groups])

  const filteredGroups = useMemo(() => {
    let result = groups ?? []

    result = (result ?? []).filter(Boolean)
    result = result.filter((g) => g.status === "active" && g.deleted_at == null)

    if (selectedTab === "joined") {
      result = result.filter((g) => g.role === "member" || g.role === "admin")
    }
    if (selectedTab === "moderating") {
      result = result.filter((g) => g.role === "admin")
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase()
      result = result.filter(
        (g) => g.name.toLowerCase().includes(query) || (g.description && g.description.toLowerCase().includes(query)),
      )
    }

    if (selectedTopic) {
      result = result.filter((g) => g.categoryIds?.includes(selectedTopic) ?? false)
    }

    return result ?? []
  }, [groups, searchTerm, selectedTopic, selectedTab])

  const handleJoinClick = (group: GroupForListing) => {
    if (group.joinPolicy === "open") {
      setJoinModalGroup(group)
      setIsJoinModalOpen(true)
    } else {
      setRequestModalGroup(group)
      setIsRequestModalOpen(true)
    }
  }

  const handleJoinSuccess = () => {
    router.refresh()
  }

  const handleCreateGroupClick = () => {
    if (canCreateGroups) {
      setIsCreateModalOpen(true)
    } else {
      setIsUpgradeModalOpen(true)
    }
  }

  const handleRequestConfirm = async () => {
    if (!requestModalGroup) return

    const result = await requestToJoinGroup(requestModalGroup.id)

    if (result.success) {
      setRequestStatuses((prev) => ({ ...prev, [requestModalGroup.id]: "pending" }))
    } else if (result.error) {
      alert(result.error)
    }

    setIsRequestModalOpen(false)
    setRequestModalGroup(null)
  }

  const handleContactAdminClick = (group: GroupForListing) => {
    setContactAdminGroup(group)
    setIsContactAdminModalOpen(true)
  }

  const handleViewDetails = (group: GroupForListing) => {
    setDetailsGroup(group)
    setIsDetailsModalOpen(true)
  }

  const handleLeaveClick = (group: GroupForListing) => {
    setLeaveGroupTarget(group)
    setIsLeaveModalOpen(true)
  }

  const handleLeaveConfirm = async () => {
    if (!leaveGroupTarget) return

    const result = await leaveGroup(leaveGroupTarget.id)

    if (result.success) {
      setIsLeaveModalOpen(false)
      setLeaveGroupTarget(null)
      router.refresh()
    } else {
      alert(result.error || "Failed to leave group")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GroupsToolbar
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        selectedTopic={selectedTopic}
        onTopicChange={(topic) => setSelectedTopic(topic)}
        onCreateGroup={handleCreateGroupClick}
        categories={categories}
        onJoinWithInvite={() => setIsInviteModalOpen(true)}
      />

      {/* Page header */}
      <section className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{pageTitle}</h2>
        <p className="text-base text-gray-600">Connect with members by interest. Join open groups or request access.</p>
      </section>

      {selectedTab === "moderating" && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setModeratingSubTab("groups")}
              className={cx(
                "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                moderatingSubTab === "groups"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              Groups
            </button>
            <button
              onClick={() => setModeratingSubTab("requests")}
              className={cx(
                "pb-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                moderatingSubTab === "requests"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              Requests
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <section id="groups-grid" className="px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        {selectedTab === "moderating" && moderatingSubTab === "requests" ? (
          <AdminJoinRequestsList requests={adminJoinRequests} />
        ) : (filteredGroups?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredGroups ?? []).filter(Boolean).map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                activeTab={selectedTab}
                onJoinClick={handleJoinClick}
                onContactAdminClick={handleContactAdminClick}
                onViewDetailsClick={handleViewDetails}
                onLeaveClick={handleLeaveClick}
                requestStatus={requestStatuses[g.id]}
                brandAccentColor={brandAccentColor}
                brandBackgroundColor={brandBackgroundColor}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">{searchTerm || "No groups yet"}</h3>
            <p className="text-gray-600 text-base max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search or filters."
                : "You haven't joined any groups yet. Explore and join groups to connect with other members."}
            </p>
          </div>
        )}
      </section>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {}}
        categories={categories}
        canCreatePrivateGroup={canCreatePrivateGroup}
      />

      {/* Join Group Modal */}
      <JoinGroupModal
        group={joinModalGroup}
        open={isJoinModalOpen}
        onClose={() => {
          setIsJoinModalOpen(false)
          setJoinModalGroup(null)
        }}
        onSuccess={handleJoinSuccess}
      />

      {/* Request to Join Modal */}
      <RequestToJoinModal
        group={requestModalGroup}
        open={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false)
          setRequestModalGroup(null)
        }}
        onConfirm={handleRequestConfirm}
      />

      {/* Upgrade Required Modal */}
      <UpgradeRequiredModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} context="groups" upgradeLink={upgradeLink} />

      {contactAdminGroup && (
        <ContactAdminModal
          open={isContactAdminModalOpen}
          onClose={() => {
            setIsContactAdminModalOpen(false)
            setContactAdminGroup(null)
          }}
          groupId={contactAdminGroup.id}
          groupName={contactAdminGroup.name}
        />
      )}

      <GroupDetailsModal
        group={detailsGroup}
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setDetailsGroup(null)
        }}
        onJoinClick={handleJoinClick}
        requestStatus={detailsGroup ? requestStatuses[detailsGroup.id] : undefined}
        brandAccentColor={brandAccentColor}
        brandBackgroundColor={brandBackgroundColor}
      />

      <LeaveGroupModal
        group={leaveGroupTarget}
        open={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false)
          setLeaveGroupTarget(null)
        }}
        onConfirm={handleLeaveConfirm}
      />

      {/* Invite Code Modal */}
      <Dialog
        open={isInviteModalOpen}
        onOpenChange={(open) => {
          setIsInviteModalOpen(open)
          if (!open) setInviteCode("")
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join Private Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">Enter the invite code you received to join a private group.</p>
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 mb-1.5">
                Invite Code
              </label>
              <Input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsInviteModalOpen(false)
                setInviteCode("")
              }}
            >
              Cancel
            </Button>
            <form action={joinGroupByInviteCode.bind(null, inviteCode)}>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inviteCode}
              >
                Join Group
              </button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GroupsListingUI
