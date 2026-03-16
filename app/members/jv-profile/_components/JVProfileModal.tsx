"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface SocialProfile {
  platform: string
  url: string
}

interface SocialMetric {
  platform: string
  followers: number
}

interface JVProfile {
  id?: string
  full_name: string
  business_name: string
  headline: string
  bio: string
  email: string
  website_url: string
  booking_url: string
  timezone: string
  profile_visibility: string
  collaboration_preference: string
  directory_opt_in: boolean
  match_notify_opt_in: boolean
  // Media
  photo_url: string
  logo_url: string
  // Contact
  phone_country: string
  phone: string
  show_contact_info: boolean
  // Audience & Reach
  list_size: string
  social_total: number
  audience_desc: string
  promo_reel_url: string
  // Business/Positioning
  industry: string
  years_in_business: string
  profile_role: string
  availability_status: string
  // Social profiles (JSONB)
  socials: SocialProfile[]
  social_metrics: SocialMetric[]
}

interface JVProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JVProfileModal({ open, onOpenChange }: JVProfileModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState<JVProfile>({
    full_name: "",
    business_name: "",
    headline: "",
    bio: "",
    email: "",
    website_url: "",
    booking_url: "",
    timezone: "",
    profile_visibility: "public",
    collaboration_preference: "open",
    directory_opt_in: true,
    match_notify_opt_in: true,
    photo_url: "",
    logo_url: "",
    phone_country: "+1",
    phone: "",
    show_contact_info: false,
    list_size: "",
    social_total: 0,
    audience_desc: "",
    promo_reel_url: "",
    industry: "",
    years_in_business: "",
    profile_role: "",
    availability_status: "open",
    socials: [],
    social_metrics: [],
  })

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open])

  const fetchProfile = async () => {
    setFetching(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Get current user
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

      setUserId(user.id)

      // Query for existing profile
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
          full_name: profile.full_name || "",
          business_name: profile.business_name || "",
          headline: profile.headline || "",
          bio: profile.bio || "",
          email: profile.email || "",
          website_url: profile.website_url || "",
          booking_url: profile.booking_url || profile.calendly_url || "",
          timezone: profile.timezone || "",
          profile_visibility: profile.profile_visibility || "public",
          collaboration_preference: profile.collaboration_preference || "open",
          directory_opt_in: profile.directory_opt_in ?? true,
          match_notify_opt_in: profile.match_notify_opt_in ?? true,
          photo_url: profile.photo_url || "",
          logo_url: profile.logo_url || "",
          phone_country: profile.phone_country || "+1",
          phone: profile.phone || "",
          show_contact_info: profile.show_contact_info ?? false,
          list_size: profile.list_size || "",
          social_total: profile.social_total || 0,
          audience_desc: profile.audience_desc || "",
          promo_reel_url: profile.promo_reel_url || "",
          industry: profile.industry || "",
          years_in_business: profile.years_in_business || "",
          profile_role: profile.profile_role || "",
          availability_status: profile.availability_status || "open",
          socials: profile.socials || [],
          social_metrics: profile.social_metrics || [],
        })
      }
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        return
      }

      const profileData = {
        full_name: formData.full_name,
        business_name: formData.business_name,
        headline: formData.headline,
        bio: formData.bio,
        email: formData.email,
        website_url: formData.website_url || null,
        booking_url: formData.booking_url || null,
        timezone: formData.timezone,
        profile_visibility: formData.profile_visibility,
        collaboration_preference: formData.collaboration_preference,
        directory_opt_in: formData.directory_opt_in,
        match_notify_opt_in: formData.match_notify_opt_in,
        photo_url: formData.photo_url || null,
        logo_url: formData.logo_url || null,
        phone_country: formData.phone_country,
        phone: formData.phone || null,
        show_contact_info: formData.show_contact_info,
        list_size: formData.list_size || null,
        social_total: formData.social_total || 0,
        audience_desc: formData.audience_desc || null,
        promo_reel_url: formData.promo_reel_url || null,
        industry: formData.industry || null,
        years_in_business: formData.years_in_business || null,
        profile_role: formData.profile_role || null,
        availability_status: formData.availability_status,
        socials: formData.socials,
        social_metrics: formData.social_metrics,
        status: "draft",
      }

      if (existingProfileId) {
        // UPDATE existing profile
        const { error } = await supabase
          .from("jv_profiles")
          .update(profileData)
          .eq("id", existingProfileId)
          .eq("owner_id", user.id)

        if (error) {
          console.error("[v0] Update error:", error)
          toast({
            title: "Error",
            description: "Failed to update profile. Please try again.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "Your JV profile has been updated.",
        })
      } else {
        // INSERT new profile
        const { error } = await supabase.from("jv_profiles").insert({
          ...profileData,
          owner_id: user.id,
        })

        if (error) {
          console.error("[v0] Insert error:", error)
          toast({
            title: "Error",
            description: "Failed to create profile. Please try again.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "Your JV profile has been created.",
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addSocialProfile = () => {
    setFormData({
      ...formData,
      socials: [...formData.socials, { platform: "website", url: "" }],
    })
  }

  const updateSocialProfile = (index: number, field: keyof SocialProfile, value: string) => {
    const updated = [...formData.socials]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, socials: updated })
  }

  const removeSocialProfile = (index: number) => {
    setFormData({
      ...formData,
      socials: formData.socials.filter((_, i) => i !== index),
    })
  }

  const addSocialMetric = () => {
    setFormData({
      ...formData,
      social_metrics: [...formData.social_metrics, { platform: "website", followers: 0 }],
    })
  }

  const updateSocialMetric = (index: number, field: keyof SocialMetric, value: string | number) => {
    const updated = [...formData.social_metrics]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, social_metrics: updated })
  }

  const removeSocialMetric = (index: number) => {
    setFormData({
      ...formData,
      social_metrics: formData.social_metrics.filter((_, i) => i !== index),
    })
  }

  const supabase = getSupabaseBrowserClient()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 bg-transparent"
        style={{ maxWidth: "72rem" }}
      >
        <div className="flex h-full max-h-[85vh] flex-col bg-white rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">JV Profile Settings</h2>
                <p className="text-sm text-slate-500 mt-1">
                  This information is used across Directory, Deals, and JV Ready. Keep it current.
                </p>
              </div>
              {existingProfileId && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                  Profile Active
                </Badge>
              )}
            </div>
          </div>

          {fetching ? (
            <div className="py-8 text-center text-slate-500">Loading profile...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="bg-[#ebebeb] rounded-xl p-4 space-y-5 md:space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6">
                    <h3 className="text-base font-semibold text-slate-900">Profile Visibility & Directory</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Control how your profile appears to others</p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile_visibility" className="text-sm text-slate-700">
                            Profile Visibility
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
                          <Label htmlFor="collaboration_preference" className="text-sm text-slate-700">
                            Collaboration Preference
                          </Label>
                          <select
                            id="collaboration_preference"
                            value={formData.collaboration_preference}
                            onChange={(e) => setFormData({ ...formData, collaboration_preference: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          >
                            <option value="open">Open to All</option>
                            <option value="selective">Selective</option>
                            <option value="closed">Not Accepting</option>
                          </select>
                        </div>
                      </div>

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
                              Show in JV Directory
                            </Label>
                            <p className="text-xs text-slate-500 mt-1">
                              Make your profile discoverable to other members
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
                              Notify about matches
                            </Label>
                            <p className="text-xs text-slate-500 mt-1">
                              Receive notifications when potential partners match your criteria
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6">
                    <h3 className="text-base font-semibold text-slate-900">Your Role & Positioning</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Define your business identity and expertise</p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-sm text-slate-700">
                            Full Name *
                          </Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="business_name" className="text-sm text-slate-700">
                            Business Name *
                          </Label>
                          <Input
                            id="business_name"
                            value={formData.business_name}
                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="headline" className="text-sm text-slate-700">
                          Headline *
                        </Label>
                        <Input
                          id="headline"
                          value={formData.headline}
                          onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                          placeholder="e.g., Digital Marketing Expert | Course Creator"
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-sm text-slate-700">
                          Bio *
                        </Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell potential partners about yourself and your expertise..."
                          rows={10}
                          required
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile_role" className="text-sm text-slate-700">
                            Profile Role
                          </Label>
                          <select
                            id="profile_role"
                            value={formData.profile_role}
                            onChange={(e) => setFormData({ ...formData, profile_role: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          >
                            <option value="">Select Role</option>
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
                          <Label htmlFor="availability_status" className="text-sm text-slate-700">
                            Availability Status
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
                          <Label htmlFor="industry" className="text-sm text-slate-700">
                            Industry
                          </Label>
                          <Input
                            id="industry"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            placeholder="e.g., Digital Marketing"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="years_in_business" className="text-sm text-slate-700">
                            Years in Business
                          </Label>
                          <Input
                            id="years_in_business"
                            value={formData.years_in_business}
                            onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
                            placeholder="e.g., 5+"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="photo_url" className="text-sm text-slate-700">
                            Profile Photo URL
                          </Label>
                          <Input
                            id="photo_url"
                            type="url"
                            value={formData.photo_url}
                            onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                            placeholder="https://example.com/photo.jpg"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="logo_url" className="text-sm text-slate-700">
                            Logo URL
                          </Label>
                          <Input
                            id="logo_url"
                            type="url"
                            value={formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            placeholder="https://example.com/logo.jpg"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6">
                    <h3 className="text-base font-semibold text-slate-900">Contact & Links</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">How partners can reach you</p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm text-slate-700">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone" className="text-sm text-slate-700">
                            Timezone *
                          </Label>
                          <Input
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            placeholder="e.g., America/New_York"
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website_url" className="text-sm text-slate-700">
                            Website URL
                          </Label>
                          <Input
                            id="website_url"
                            type="url"
                            value={formData.website_url}
                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="booking_url" className="text-sm text-slate-700">
                            Booking URL
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
                          <Label htmlFor="phone_country" className="text-sm text-slate-700">
                            Phone Country Code
                          </Label>
                          <Input
                            id="phone_country"
                            value={formData.phone_country}
                            onChange={(e) => setFormData({ ...formData, phone_country: e.target.value })}
                            placeholder="+1"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm text-slate-700">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="555-123-4567"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="show_contact_info"
                          checked={formData.show_contact_info}
                          onChange={(e) => setFormData({ ...formData, show_contact_info: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <Label
                            htmlFor="show_contact_info"
                            className="text-sm text-slate-700 leading-tight cursor-pointer"
                          >
                            Show my contact info to members
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Allow other members to see your phone number</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6">
                    <h3 className="text-base font-semibold text-slate-900">Audience / Channels</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4">Your reach and audience details</p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="list_size" className="text-sm text-slate-700">
                            List Size
                          </Label>
                          <Input
                            id="list_size"
                            value={formData.list_size}
                            onChange={(e) => setFormData({ ...formData, list_size: e.target.value })}
                            placeholder="e.g., 10,000+"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="social_total" className="text-sm text-slate-700">
                            Total Social Followers
                          </Label>
                          <Input
                            id="social_total"
                            type="number"
                            value={formData.social_total}
                            onChange={(e) =>
                              setFormData({ ...formData, social_total: Number.parseInt(e.target.value) || 0 })
                            }
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="promo_reel_url" className="text-sm text-slate-700">
                            Promo Reel URL
                          </Label>
                          <Input
                            id="promo_reel_url"
                            type="url"
                            value={formData.promo_reel_url}
                            onChange={(e) => setFormData({ ...formData, promo_reel_url: e.target.value })}
                            placeholder="https://youtube.com/..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience_desc" className="text-sm text-slate-700">
                          Audience Description
                        </Label>
                        <Textarea
                          id="audience_desc"
                          value={formData.audience_desc}
                          onChange={(e) => setFormData({ ...formData, audience_desc: e.target.value })}
                          placeholder="Describe your audience demographics, interests, and engagement..."
                          rows={4}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm text-slate-700 mb-3 block">Social Profiles</Label>
                        <div className="space-y-3">
                          {formData.socials.map((social, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="flex-1 space-y-2">
                                <select
                                  value={social.platform}
                                  onChange={(e) => updateSocialProfile(index, "platform", e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                                >
                                  <option value="website">Website</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="tiktok">TikTok</option>
                                  <option value="twitter">Twitter/X</option>
                                </select>
                              </div>
                              <div className="flex-[2] space-y-2">
                                <Input
                                  type="url"
                                  value={social.url}
                                  onChange={(e) => updateSocialProfile(index, "url", e.target.value)}
                                  placeholder="https://..."
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => removeSocialProfile(index)}
                                className="mb-0"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addSocialProfile}
                            className="hover:bg-[#2f91cf]/10 bg-transparent"
                          >
                            + Add Social Profile
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-slate-700 mb-3 block">Social Metrics (Optional)</Label>
                        <div className="space-y-3">
                          {formData.social_metrics.map((metric, index) => (
                            <div key={index} className="flex gap-2 items-end">
                              <div className="flex-1 space-y-2">
                                <select
                                  value={metric.platform}
                                  onChange={(e) => updateSocialMetric(index, "platform", e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                                >
                                  <option value="website">Website</option>
                                  <option value="linkedin">LinkedIn</option>
                                  <option value="instagram">Instagram</option>
                                  <option value="facebook">Facebook</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="tiktok">TikTok</option>
                                  <option value="twitter">Twitter/X</option>
                                </select>
                              </div>
                              <div className="flex-1 space-y-2">
                                <Input
                                  type="number"
                                  value={metric.followers}
                                  onChange={(e) =>
                                    updateSocialMetric(index, "followers", Number.parseInt(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => removeSocialMetric(index)}
                                className="mb-0"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addSocialMetric}
                            className="hover:bg-[#2f91cf]/10 bg-transparent"
                          >
                            + Add Social Metric
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t bg-white/90 backdrop-blur px-6 py-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-[#2f91cf] hover:bg-[#2f91cf]/90 text-white">
                  {loading ? "Saving..." : "Save JV Profile"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
