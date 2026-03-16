"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface TagCatOption {
  id: string
  slug: string
  label: string
  kind: string
  sort_order: number
  is_active: boolean
}

interface DirectoryListing {
  id?: string
  directory_opt_in: boolean
  is_public: boolean
  profile_visibility: string
  availability_status: string
  profile_role: string
  industry: string
  match_notify_opt_in: boolean
  slug: string
  booking_url: string
  jv_ready_url: string
  has_newsletter: boolean
  has_podcast: boolean
  has_youtube: boolean
  has_social: boolean
  has_stage: boolean
  tags: string[]
  categories: string[]
}

interface DirectoryListingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DirectoryListingModal({ open, onOpenChange }: DirectoryListingModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null)
  const [slugError, setSlugError] = useState<string>("")
  const [availableTags, setAvailableTags] = useState<TagCatOption[]>([])
  const [availableCategories, setAvailableCategories] = useState<TagCatOption[]>([])
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false)
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false)
  const [formData, setFormData] = useState<DirectoryListing>({
    directory_opt_in: true,
    is_public: false,
    profile_visibility: "public",
    availability_status: "open",
    profile_role: "Author",
    industry: "",
    match_notify_opt_in: true,
    slug: "",
    booking_url: "",
    jv_ready_url: "",
    has_newsletter: false,
    has_podcast: false,
    has_youtube: false,
    has_social: false,
    has_stage: false,
    tags: [],
    categories: [],
  })

  useEffect(() => {
    if (open) {
      fetchTagsAndCategories()
      fetchProfile()
    }
  }, [open])

  const fetchTagsAndCategories = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      const { data: tagsData, error: tagsError } = await supabase
        .from("tags_cat")
        .select("*")
        .eq("kind", "tag")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })

      if (tagsError) {
        console.error("[v0] Tags fetch error:", tagsError)
      } else {
        setAvailableTags(tagsData || [])
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("tags_cat")
        .select("*")
        .eq("kind", "category")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })

      if (categoriesError) {
        console.error("[v0] Categories fetch error:", categoriesError)
      } else {
        setAvailableCategories(categoriesData || [])
      }
    } catch (error) {
      console.error("[v0] Unexpected error fetching tags/categories:", error)
    }
  }

  const fetchProfile = async () => {
    setFetching(true)
    try {
      const supabase = getSupabaseBrowserClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("[v0] Auth error:", authError)
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        onOpenChange(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("jv_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Profile fetch error:", profileError)
      }

      if (profile) {
        setExistingProfileId(profile.id)
        setFormData({
          directory_opt_in: profile.directory_opt_in ?? true,
          is_public: profile.is_public ?? false,
          profile_visibility: profile.profile_visibility || "public",
          availability_status: profile.availability_status || "open",
          profile_role: profile.profile_role || "Author",
          industry: profile.industry || "",
          match_notify_opt_in: profile.match_notify_opt_in ?? true,
          slug: profile.slug || "",
          booking_url: profile.booking_url || profile.calendly_url || "",
          jv_ready_url: profile.jv_ready_url || "",
          has_newsletter: profile.has_newsletter ?? false,
          has_podcast: profile.has_podcast ?? false,
          has_youtube: profile.has_youtube ?? false,
          has_social: profile.has_social ?? false,
          has_stage: profile.has_stage ?? false,
          tags: profile.tags || [],
          categories: profile.categories || [],
        })
      }
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
    } finally {
      setFetching(false)
    }
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugError("")
      return true
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return false

      const { data, error } = await supabase
        .from("jv_profiles")
        .select("id")
        .eq("slug", slug)
        .neq("owner_id", user.id)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("[v0] Slug check error:", error)
        return false
      }

      if (data) {
        setSlugError("This slug is already taken. Please choose another.")
        return false
      }

      setSlugError("")
      return true
    } catch (error) {
      console.error("[v0] Slug check error:", error)
      return false
    }
  }

  const handleSlugBlur = async () => {
    await checkSlugAvailability(formData.slug)
  }

  const toggleTag = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(slug) ? prev.tags.filter((t) => t !== slug) : [...prev.tags, slug],
    }))
  }

  const removeTag = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== slug),
    }))
  }

  const toggleCategory = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug],
    }))
  }

  const removeCategory = (slug: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== slug),
    }))
  }

  const getTagLabel = (slug: string) => {
    const tag = availableTags.find((t) => t.slug === slug)
    return tag ? tag.label : slug
  }

  const getCategoryLabel = (slug: string) => {
    const category = availableCategories.find((c) => c.slug === slug)
    return category ? category.label : slug
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] DirectoryListingModal: Starting form submission")
    setLoading(true)

    try {
      // Validate slug first
      const isSlugValid = await checkSlugAvailability(formData.slug)
      if (!isSlugValid && formData.slug) {
        console.log("[v0] DirectoryListingModal: Slug validation failed")
        setLoading(false)
        return
      }

      const supabase = getSupabaseBrowserClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("[v0] DirectoryListingModal: Auth error:", authError)
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      console.log("[v0] DirectoryListingModal: User authenticated:", user.id)

      // Calculate is_public based on directory_opt_in and profile_visibility
      const autoIsPublic = formData.directory_opt_in && formData.profile_visibility === "public"

      const directoryData = {
        directory_opt_in: formData.directory_opt_in,
        is_public: autoIsPublic,
        profile_visibility: formData.profile_visibility,
        availability_status: formData.availability_status,
        profile_role: formData.profile_role,
        industry: formData.industry || null,
        match_notify_opt_in: formData.match_notify_opt_in,
        slug: formData.slug || null,
        booking_url: formData.booking_url || null,
        jv_ready_url: formData.jv_ready_url || null,
        has_newsletter: formData.has_newsletter,
        has_podcast: formData.has_podcast,
        has_youtube: formData.has_youtube,
        has_social: formData.has_social,
        has_stage: formData.has_stage,
        tags: formData.tags,
        categories: formData.categories,
      }

      console.log("[v0] DirectoryListingModal: Directory data prepared:", directoryData)

      if (existingProfileId) {
        console.log("[v0] DirectoryListingModal: Updating existing profile:", existingProfileId)

        const { error } = await supabase
          .from("jv_profiles")
          .update(directoryData)
          .eq("id", existingProfileId)
          .eq("owner_id", user.id)

        if (error) {
          console.error("[v0] DirectoryListingModal: Update error:", error)
          toast({
            title: "Error",
            description: `Failed to update directory settings: ${error.message}`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        console.log("[v0] DirectoryListingModal: Update successful")
        toast({
          title: "Success",
          description: "Your directory settings have been updated.",
        })
      } else {
        console.log("[v0] DirectoryListingModal: Creating new profile")

        const { error } = await supabase.from("jv_profiles").insert({
          ...directoryData,
          owner_id: user.id,
          status: "draft",
        })

        if (error) {
          console.error("[v0] DirectoryListingModal: Insert error:", error)
          toast({
            title: "Error",
            description: `Failed to save directory settings: ${error.message}`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        console.log("[v0] DirectoryListingModal: Insert successful")
        toast({
          title: "Success",
          description: "Your directory settings have been saved.",
        })
      }

      console.log("[v0] DirectoryListingModal: Closing modal")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] DirectoryListingModal: Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 bg-transparent"
        style={{ maxWidth: "72rem" }}
      >
        <div className="flex h-full max-h-[85vh] flex-col bg-white rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
            <h2 className="text-xl font-semibold text-slate-900">Manage Directory Listing</h2>
            <p className="text-sm text-slate-500 mt-1">
              Control how partners find and contact you inside the directory.
            </p>
          </div>

          {fetching ? (
            <div className="py-8 text-center text-slate-500">Loading directory settings...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#ebebeb]">
                <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Directory Visibility & Audience</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Control who can see your profile and how you appear in search results
                    </p>
                  </div>

                  {!formData.directory_opt_in && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                      <i className="fa-solid fa-info-circle mr-2"></i>
                      Your listing is currently hidden. Turn on &quot;Show me in the JV Directory&quot; to make it
                      visible.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="directory_opt_in"
                        checked={formData.directory_opt_in}
                        onChange={(e) => setFormData({ ...formData, directory_opt_in: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <Label
                          htmlFor="directory_opt_in"
                          className="text-sm text-slate-700 leading-tight cursor-pointer"
                        >
                          Show me in the JV Directory
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">Make your profile discoverable to other members</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <Label htmlFor="is_public" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          Allow public view
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Anyone can see my directory card, even non-members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="match_notify_opt_in"
                        checked={formData.match_notify_opt_in}
                        onChange={(e) => setFormData({ ...formData, match_notify_opt_in: e.target.checked })}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <Label
                          htmlFor="match_notify_opt_in"
                          className="text-sm text-slate-700 leading-tight cursor-pointer"
                        >
                          Email me when someone matches or invites me
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">
                          Get notified about potential partnership opportunities
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile_visibility" className="text-sm font-medium text-slate-700">
                        Who can view my profile?
                      </Label>
                      <select
                        id="profile_visibility"
                        value={formData.profile_visibility}
                        onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      >
                        <option value="public">Public</option>
                        <option value="members">Members Only</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability_status" className="text-sm font-medium text-slate-700">
                        My current availability for JVs
                      </Label>
                      <select
                        id="availability_status"
                        value={formData.availability_status}
                        onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      >
                        <option value="open">Open</option>
                        <option value="limited">Limited</option>
                        <option value="booked">Booked</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile_role" className="text-sm font-medium text-slate-700">
                        How should we label you in the directory?
                      </Label>
                      <select
                        id="profile_role"
                        value={formData.profile_role}
                        onChange={(e) => setFormData({ ...formData, profile_role: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      >
                        <option value="Author">Author</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Coach">Coach</option>
                        <option value="Expert">Expert</option>
                        <option value="SaaS">SaaS</option>
                        <option value="Agency">Agency</option>
                        <option value="Event Host">Event Host</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium text-slate-700">
                        Primary niche / industry
                      </Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Digital Marketing, Health & Wellness"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                      Profile URL / slug
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      onBlur={handleSlugBlur}
                      placeholder="your-name-or-brand"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                    />
                    {slugError && <p className="text-sm text-red-600">{slugError}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">
                      Channels to show as badges on my directory card
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="has_newsletter"
                          checked={formData.has_newsletter}
                          onChange={(e) => setFormData({ ...formData, has_newsletter: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <Label htmlFor="has_newsletter" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          Newsletter
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="has_podcast"
                          checked={formData.has_podcast}
                          onChange={(e) => setFormData({ ...formData, has_podcast: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <Label htmlFor="has_podcast" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          Podcast
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="has_youtube"
                          checked={formData.has_youtube}
                          onChange={(e) => setFormData({ ...formData, has_youtube: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <Label htmlFor="has_youtube" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          YouTube
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="has_social"
                          checked={formData.has_social}
                          onChange={(e) => setFormData({ ...formData, has_social: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <Label htmlFor="has_social" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          Social Media
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="has_stage"
                          checked={formData.has_stage}
                          onChange={(e) => setFormData({ ...formData, has_stage: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <Label htmlFor="has_stage" className="text-sm text-slate-700 leading-tight cursor-pointer">
                          Stage/Events
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Contact / Booking Links</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Add links to make it easy for partners to connect with you
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="booking_url" className="text-sm font-medium text-slate-700">
                        Book a call link (optional)
                      </Label>
                      <Input
                        id="booking_url"
                        type="url"
                        value={formData.booking_url}
                        onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                        placeholder="https://calendly.com/yourname"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jv_ready_url" className="text-sm font-medium text-slate-700">
                        JV Ready URL (optional)
                      </Label>
                      <Input
                        id="jv_ready_url"
                        type="url"
                        value={formData.jv_ready_url}
                        onChange={(e) => setFormData({ ...formData, jv_ready_url: e.target.value })}
                        placeholder="https://yoursite.com/jv-ready"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Tags & Categories</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Help partners find you by selecting relevant tags and categories
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Tags (used for search)</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        >
                          <span className="text-slate-500">
                            {formData.tags.length > 0 ? `${formData.tags.length} selected` : "Select tags..."}
                          </span>
                          <i
                            className={`fa-solid fa-chevron-down transition-transform ${tagsDropdownOpen ? "rotate-180" : ""}`}
                          ></i>
                        </button>
                        {tagsDropdownOpen && (
                          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                            {availableTags.length === 0 ? (
                              <div className="p-3 text-sm text-slate-500">No tags available</div>
                            ) : (
                              availableTags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                                  onClick={() => toggleTag(tag.slug)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.tags.includes(tag.slug)}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                  <span className="text-sm text-slate-700">{tag.label}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tagSlug) => (
                            <Badge key={tagSlug} variant="secondary" className="gap-1">
                              {getTagLabel(tagSlug)}
                              <button
                                type="button"
                                onClick={() => removeTag(tagSlug)}
                                className="ml-1 hover:text-red-600"
                              >
                                <i className="fa-solid fa-times text-xs"></i>
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Categories (curated or custom)</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        >
                          <span className="text-slate-500">
                            {formData.categories.length > 0
                              ? `${formData.categories.length} selected`
                              : "Select categories..."}
                          </span>
                          <i
                            className={`fa-solid fa-chevron-down transition-transform ${categoriesDropdownOpen ? "rotate-180" : ""}`}
                          ></i>
                        </button>
                        {categoriesDropdownOpen && (
                          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                            {availableCategories.length === 0 ? (
                              <div className="p-3 text-sm text-slate-500">No categories available</div>
                            ) : (
                              availableCategories.map((category) => (
                                <div
                                  key={category.id}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                                  onClick={() => toggleCategory(category.slug)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.categories.includes(category.slug)}
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                  <span className="text-sm text-slate-700">{category.label}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {formData.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.categories.map((categorySlug) => (
                            <Badge key={categorySlug} variant="secondary" className="gap-1">
                              {getCategoryLabel(categorySlug)}
                              <button
                                type="button"
                                onClick={() => removeCategory(categorySlug)}
                                className="ml-1 hover:text-red-600"
                              >
                                <i className="fa-solid fa-times text-xs"></i>
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur px-6 py-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !!slugError}
                  className="bg-[#2f91cf] hover:bg-[#2f91cf]/90 text-white"
                >
                  {loading ? "Saving..." : "Save Directory Settings"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
