"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  updateSalesPageHero,
  updateSalesPageCommunityVision,
  updateSalesPageEducationSection,
  updateSalesPageVisibility,
  updateSalesPagePlans,
  uploadSalesPageImage,
  updateFoundersAvailability,
  updateFoundersInviteSection,
  updateFoundersComparisonSection,
  updateFoundersClaimSection,
  updateFoundersFaq,
  type SalesPageType,
  type ActivePlanForSalesPage,
  type SalesPageRow,
} from "./sales-page-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SECTION_HEADERS: Record<"main" | "founders", string> = {
  main: "Main Sales Page Settings",
  founders: "Founders Sales Page Settings",
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function SalesPageForm({
  pageType,
  salesPage,
  orderedPlans = [],
}: {
  pageType: SalesPageType
  salesPage: SalesPageRow | null
  orderedPlans?: ActivePlanForSalesPage[]
}) {
  const [heroLogoUrl, setHeroLogoUrl] = useState("")
  const [heroHeadline, setHeroHeadline] = useState("")
  const [heroIntroText, setHeroIntroText] = useState("")
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [heroVideoUrl, setHeroVideoUrl] = useState("")
  const [communityVisionHeadline, setCommunityVisionHeadline] = useState("")
  const [communityVisionImageUrl, setCommunityVisionImageUrl] = useState("")
  const [communityVisionBody, setCommunityVisionBody] = useState("")
  const [communityVisionBullets, setCommunityVisionBullets] = useState<string[]>([])
  const [educationSectionHeadline, setEducationSectionHeadline] = useState("")
  const [showCoursesSection, setShowCoursesSection] = useState(true)
  const [showMarketplaceSection, setShowMarketplaceSection] = useState(true)
  const [showAiMentorsSection, setShowAiMentorsSection] = useState(true)
  const [showFoundersCtaSection, setShowFoundersCtaSection] = useState(true)
  const [membershipHeadline, setMembershipHeadline] = useState("")
  const [membershipIntro, setMembershipIntro] = useState("")
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([])
  const [activePlans, setActivePlans] = useState<ActivePlanForSalesPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingCommunityVision, setIsSavingCommunityVision] = useState(false)
  const [isSavingEducationSection, setIsSavingEducationSection] = useState(false)
  const [isSavingVisibility, setIsSavingVisibility] = useState(false)
  const [isSavingPlans, setIsSavingPlans] = useState(false)
  const [foundersSpotsAvailable, setFoundersSpotsAvailable] = useState<number | "">("")
  const [foundersInviteHeadline, setFoundersInviteHeadline] = useState("")
  const [foundersInviteBody, setFoundersInviteBody] = useState("")
  const [foundersInviteMediaUrl, setFoundersInviteMediaUrl] = useState("")
  const [foundersInviteMediaType, setFoundersInviteMediaType] = useState<"image" | "video">("image")
  const [foundersComparisonHeadline, setFoundersComparisonHeadline] = useState("")
  const [foundersComparisonSubhead, setFoundersComparisonSubhead] = useState("")
  const [foundersPriceLifetime, setFoundersPriceLifetime] = useState<number | "">("")
  const [foundersPriceComparisonMonthly, setFoundersPriceComparisonMonthly] = useState<number | "">("")
  const [foundersClaimHeadline, setFoundersClaimHeadline] = useState("")
  const [foundersClaimBody, setFoundersClaimBody] = useState("")
  const [foundersFaq, setFoundersFaq] = useState<{ question: string; answer: string }[]>([])
  const [isSavingFoundersAvailability, setIsSavingFoundersAvailability] = useState(false)
  const [isSavingFoundersInvite, setIsSavingFoundersInvite] = useState(false)
  const [isSavingFoundersComparison, setIsSavingFoundersComparison] = useState(false)
  const [isSavingFoundersClaim, setIsSavingFoundersClaim] = useState(false)
  const [isSavingFoundersFaq, setIsSavingFoundersFaq] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false)
  const [isUploadingCommunityVisionImage, setIsUploadingCommunityVisionImage] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroImageInputRef = useRef<HTMLInputElement>(null)
  const communityVisionImageInputRef = useRef<HTMLInputElement>(null)

  /** Hydrate all form state from the fetched row (or defaults when no row). Call after data loads. */
  const hydrateFormFromRow = (row: SalesPageRow | null) => {
    if (!row) {
      setHeroLogoUrl("")
      setHeroHeadline("")
      setHeroIntroText("")
      setHeroImageUrl("")
      setHeroVideoUrl("")
      setCommunityVisionHeadline("")
      setCommunityVisionImageUrl("")
      setCommunityVisionBody("")
      setCommunityVisionBullets([])
      setEducationSectionHeadline("")
      setShowCoursesSection(true)
      setShowMarketplaceSection(true)
      setShowAiMentorsSection(true)
      setShowFoundersCtaSection(true)
      setMembershipHeadline("")
      setMembershipIntro("")
      setSelectedPlanIds([])
      setFoundersSpotsAvailable("")
      setFoundersInviteHeadline("")
      setFoundersInviteBody("")
      setFoundersInviteMediaUrl("")
      setFoundersInviteMediaType("image")
      setFoundersComparisonHeadline("")
      setFoundersComparisonSubhead("")
      setFoundersPriceLifetime("")
      setFoundersPriceComparisonMonthly("")
      setFoundersClaimHeadline("")
      setFoundersClaimBody("")
      setFoundersFaq([])
      return
    }
    setHeroLogoUrl(row.logo_url ?? "")
    setHeroHeadline(row.hero_headline ?? "")
    setHeroIntroText(row.hero_intro_text ?? "")
    setHeroImageUrl(row.hero_image_url ?? "")
    setHeroVideoUrl(row.hero_video_url ?? "")
    setCommunityVisionHeadline(row.vision_headline ?? "")
    setCommunityVisionImageUrl(row.vision_image_url ?? "")
    setCommunityVisionBody(row.vision_body_text ?? "")
    setCommunityVisionBullets(Array.isArray(row.vision_who_for_bullets) ? row.vision_who_for_bullets : [])
    setEducationSectionHeadline(row.education_headline ?? "")
    setShowCoursesSection(row.show_courses ?? true)
    setShowMarketplaceSection(row.show_marketplace ?? true)
    setShowAiMentorsSection(row.show_ai_mentors ?? true)
    setShowFoundersCtaSection(row.show_founders_bridge ?? true)
    setMembershipHeadline(row.membership_headline ?? "")
    setMembershipIntro(row.membership_intro ?? "")
    setSelectedPlanIds(Array.isArray(row.selected_plan_ids) ? row.selected_plan_ids : [])
    setFoundersSpotsAvailable(row.founders_spots_available ?? "")
    setFoundersInviteHeadline(row.founders_invite_headline ?? "")
    setFoundersInviteBody(row.founders_invite_body ?? "")
    setFoundersInviteMediaUrl(row.founders_invite_media_url ?? "")
    setFoundersInviteMediaType(row.founders_invite_media_type === "video" ? "video" : "image")
    setFoundersComparisonHeadline(row.founders_comparison_headline ?? "")
    setFoundersComparisonSubhead(row.founders_comparison_subhead ?? "")
    setFoundersPriceLifetime(row.founders_price_lifetime ?? "")
    setFoundersPriceComparisonMonthly(row.founders_price_comparison_monthly ?? "")
    setFoundersClaimHeadline(row.founders_claim_headline ?? "")
    setFoundersClaimBody(row.founders_claim_body ?? "")
    setFoundersFaq(
      Array.isArray(row.founders_faq) && row.founders_faq.every((x) => x && typeof x.question === "string" && typeof x.answer === "string")
        ? row.founders_faq
        : []
    )
  }

  useEffect(() => {
    hydrateFormFromRow(salesPage ?? null)
    setActivePlans(orderedPlans ?? [])
    setIsLoading(false)
  }, [salesPage, orderedPlans])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "logo" | "hero" | "community-vision",
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast("Please upload a JPG, PNG, or WebP image.", "error")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showToast("Image must be less than 5MB.", "error")
      return
    }

    if (kind === "logo") setIsUploadingLogo(true)
    else if (kind === "hero") setIsUploadingHeroImage(true)
    else setIsUploadingCommunityVisionImage(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("kind", kind)

    const result = await uploadSalesPageImage(pageType, formData)

    if (kind === "logo") setIsUploadingLogo(false)
    else if (kind === "hero") setIsUploadingHeroImage(false)
    else setIsUploadingCommunityVisionImage(false)

    if (!result.success) {
      showToast(result.error ?? "Upload failed.", "error")
      return
    }
    if (result.url) {
      if (kind === "logo") {
        setHeroLogoUrl(result.url)
        logoInputRef.current && (logoInputRef.current.value = "")
      } else if (kind === "hero") {
        setHeroImageUrl(result.url)
        heroImageInputRef.current && (heroImageInputRef.current.value = "")
      } else {
        setCommunityVisionImageUrl(result.url)
        communityVisionImageInputRef.current && (communityVisionImageInputRef.current.value = "")
      }
      const label = kind === "logo" ? "Logo" : kind === "hero" ? "Hero image" : "Community Vision image"
      showToast(`${label} uploaded.`, "success")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateSalesPageHero(pageType, {
      logo_url: heroLogoUrl || null,
      hero_headline: heroHeadline || null,
      hero_intro_text: heroIntroText || null,
      hero_image_url: heroImageUrl || null,
      hero_video_url: heroVideoUrl || null,
    })
    if (result.success) {
      showToast("Hero section saved.", "success")
    } else {
      showToast(result.error ?? "Failed to save.", "error")
    }
    setIsSaving(false)
  }

  const handleSaveCommunityVision = async () => {
    setIsSavingCommunityVision(true)
    const result = await updateSalesPageCommunityVision(pageType, {
      vision_headline: communityVisionHeadline || null,
      vision_body_text: communityVisionBody ?? null,
      vision_image_url: communityVisionImageUrl || null,
      vision_who_for_bullets: communityVisionBullets.length ? communityVisionBullets : null,
    })
    if (result.success) {
      showToast("Community Vision saved.", "success")
    } else {
      showToast(result.error ?? "Failed to save.", "error")
    }
    setIsSavingCommunityVision(false)
  }

  const addBullet = () => setCommunityVisionBullets((prev) => [...prev, ""])
  const removeBullet = (index: number) =>
    setCommunityVisionBullets((prev) => prev.filter((_, i) => i !== index))
  const setBullet = (index: number, value: string) =>
    setCommunityVisionBullets((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })

  const handleSaveEducationSection = async () => {
    setIsSavingEducationSection(true)
    const result = await updateSalesPageEducationSection(pageType, {
      education_headline: educationSectionHeadline || null,
    })
    if (result.success) {
      showToast("Education section saved.", "success")
    } else {
      showToast(result.error ?? "Failed to save.", "error")
    }
    setIsSavingEducationSection(false)
  }

  const handleSaveVisibility = async () => {
    setIsSavingVisibility(true)
    const result = await updateSalesPageVisibility(pageType, {
      show_courses: showCoursesSection,
      show_marketplace: showMarketplaceSection,
      show_ai_mentors: showAiMentorsSection,
      show_founders_bridge: showFoundersCtaSection,
    })
    if (result.success) {
      showToast("Section visibility saved.", "success")
    } else {
      showToast(result.error ?? "Failed to save.", "error")
    }
    setIsSavingVisibility(false)
  }

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId],
    )
  }

  const handleSavePlans = async () => {
    setIsSavingPlans(true)
    const result = await updateSalesPagePlans(pageType, {
      selected_plan_ids: selectedPlanIds,
      membership_headline: membershipHeadline || null,
      membership_intro: membershipIntro || null,
    })
    if (result.success) {
      showToast("Plans saved.", "success")
    } else {
      showToast(result.error ?? "Failed to save.", "error")
    }
    setIsSavingPlans(false)
  }

  const handleSaveFoundersAvailability = async () => {
    setIsSavingFoundersAvailability(true)
    const result = await updateFoundersAvailability({
      founders_spots_available: foundersSpotsAvailable === "" ? null : Number(foundersSpotsAvailable),
    })
    if (result.success) showToast("Founders availability saved.", "success")
    else showToast(result.error ?? "Failed to save.", "error")
    setIsSavingFoundersAvailability(false)
  }

  const handleSaveFoundersInvite = async () => {
    setIsSavingFoundersInvite(true)
    const result = await updateFoundersInviteSection({
      founders_invite_headline: foundersInviteHeadline || null,
      founders_invite_body: foundersInviteBody || null,
      founders_invite_media_url: foundersInviteMediaUrl || null,
      founders_invite_media_type: foundersInviteMediaType,
    })
    if (result.success) showToast("Founders invite section saved.", "success")
    else showToast(result.error ?? "Failed to save.", "error")
    setIsSavingFoundersInvite(false)
  }

  const handleSaveFoundersComparison = async () => {
    setIsSavingFoundersComparison(true)
    const result = await updateFoundersComparisonSection({
      founders_comparison_headline: foundersComparisonHeadline || null,
      founders_comparison_subhead: foundersComparisonSubhead || null,
      founders_price_lifetime: foundersPriceLifetime === "" ? null : Number(foundersPriceLifetime),
      founders_price_comparison_monthly: foundersPriceComparisonMonthly === "" ? null : Number(foundersPriceComparisonMonthly),
    })
    if (result.success) showToast("Founders comparison section saved.", "success")
    else showToast(result.error ?? "Failed to save.", "error")
    setIsSavingFoundersComparison(false)
  }

  const handleSaveFoundersClaim = async () => {
    setIsSavingFoundersClaim(true)
    const result = await updateFoundersClaimSection({
      founders_claim_headline: foundersClaimHeadline || null,
      founders_claim_body: foundersClaimBody || null,
    })
    if (result.success) showToast("Founders claim section saved.", "success")
    else showToast(result.error ?? "Failed to save.", "error")
    setIsSavingFoundersClaim(false)
  }

  const handleSaveFoundersFaq = async () => {
    setIsSavingFoundersFaq(true)
    const result = await updateFoundersFaq({ founders_faq: foundersFaq.length ? foundersFaq : null })
    if (result.success) showToast("Founders FAQ saved.", "success")
    else showToast(result.error ?? "Failed to save.", "error")
    setIsSavingFoundersFaq(false)
  }

  const addFoundersFaqItem = () => setFoundersFaq((prev) => [...prev, { question: "", answer: "" }])
  const removeFoundersFaqItem = (index: number) =>
    setFoundersFaq((prev) => prev.filter((_, i) => i !== index))
  const setFoundersFaqItem = (index: number, field: "question" | "answer", value: string) =>
    setFoundersFaq((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], [field]: value }
      return next
    })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{SECTION_HEADERS[pageType]}</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsPreviewOpen(true)}
        >
          View Page
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto flex flex-col"
          showCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle>Sales Page Preview</DialogTitle>
            <DialogDescription>
              Full sales page as rendered on the public &quot;{pageType === "founders" ? "/founders" : "/"}&quot; route.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto w-full -mx-6 px-6">
            <iframe
              src={pageType === "founders" ? "/founders" : "/"}
              title="Sales page preview"
              className="w-full min-h-[80vh] border-0 rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h3>

        <div className="space-y-6">
          {/* Logo image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo image</label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {heroLogoUrl ? (
                  <img
                    src={heroLogoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-1">No logo</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={(e) => handleImageUpload(e, "logo")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isUploadingLogo ? "Uploading…" : "Upload logo"}
                </button>
              </div>
            </div>
          </div>

          {/* Hero headline */}
          <div>
            <label htmlFor="hero-headline" className="block text-sm font-medium text-gray-700 mb-2">
              Hero headline
            </label>
            <input
              type="text"
              id="hero-headline"
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              placeholder="Enter headline"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Hero intro text */}
          <div>
            <label htmlFor="hero-intro" className="block text-sm font-medium text-gray-700 mb-2">
              Hero intro text
            </label>
            <textarea
              id="hero-intro"
              rows={4}
              value={heroIntroText}
              onChange={(e) => setHeroIntroText(e.target.value)}
              placeholder="Enter intro text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Hero image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero image</label>
            <div className="flex items-start gap-4">
              <div className="w-40 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-1">No image</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  ref={heroImageInputRef}
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={(e) => handleImageUpload(e, "hero")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => heroImageInputRef.current?.click()}
                  disabled={isUploadingHeroImage}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isUploadingHeroImage ? "Uploading…" : "Upload hero image"}
                </button>
              </div>
            </div>
          </div>

          {/* Hero Video URL */}
          <div>
            <label htmlFor="hero-video-url" className="block text-sm font-medium text-gray-700 mb-2">
              Hero Video URL
            </label>
            <p className="text-xs text-gray-500 mb-2">
              If a video URL is provided, it will be shown instead of the image. You can use one or the other.
            </p>
            <input
              type="text"
              id="hero-video-url"
              value={heroVideoUrl}
              onChange={(e) => setHeroVideoUrl(e.target.value)}
              placeholder="https://youtube.com/… or https://vimeo.com/… or direct .mp4 URL"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving…" : "Save Hero Section"}
          </button>
        </div>
      </section>

      {/* Community Vision */}
      <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Vision</h3>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="community-vision-headline"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Section headline
            </label>
            <input
              type="text"
              id="community-vision-headline"
              value={communityVisionHeadline}
              onChange={(e) => setCommunityVisionHeadline(e.target.value)}
              placeholder="Enter section headline"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional image override
            </label>
            <p className="text-xs text-gray-500 mb-2">
              If no image is set, the frontend will use its default image.
            </p>
            <div className="flex items-start gap-4">
              <div className="w-40 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {communityVisionImageUrl ? (
                  <img
                    src={communityVisionImageUrl}
                    alt="Community Vision preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-1">No image</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  ref={communityVisionImageInputRef}
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={(e) => handleImageUpload(e, "community-vision")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => communityVisionImageInputRef.current?.click()}
                  disabled={isUploadingCommunityVisionImage}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isUploadingCommunityVisionImage ? "Uploading…" : "Upload image"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="vision_body_text"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Vision Body Text
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Supports formatting (bold, italics, paragraphs).
            </p>
            <textarea
              id="vision_body_text"
              name="vision_body_text"
              rows={6}
              value={communityVisionBody}
              onChange={(e) => setCommunityVisionBody(e.target.value)}
              placeholder="Enter body text (line breaks and spacing are preserved)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] whitespace-pre-wrap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who It&apos;s For</label>
            <p className="text-xs text-gray-500 mb-2">Editable list of bullet items.</p>
            <div className="space-y-2">
              {communityVisionBullets.map((bullet, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => setBullet(index, e.target.value)}
                    placeholder={`Bullet ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(index)}
                    className="px-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 text-sm font-medium"
                    title="Remove bullet"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBullet}
                className="px-4 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
              >
                Add bullet
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveCommunityVision}
            disabled={isSavingCommunityVision}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingCommunityVision ? "Saving…" : "Save Community Vision"}
          </button>
        </div>
      </section>

      {/* Education Section */}
      <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Section</h3>
        <div>
          <label
            htmlFor="education-section-headline"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Education Section Headline
          </label>
          <input
            type="text"
            id="education-section-headline"
            value={educationSectionHeadline}
            onChange={(e) => setEducationSectionHeadline(e.target.value)}
            placeholder="Enter education section headline"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveEducationSection}
            disabled={isSavingEducationSection}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEducationSection ? "Saving…" : "Save Education Section"}
          </button>
        </div>
      </section>

      {/* Section Visibility */}
      <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Visibility</h3>
        <p className="text-sm text-gray-500 mb-4">
          Control which sections appear on this sales page. Toggles apply per page.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Show Courses Section</p>
              <p className="text-xs text-gray-500 mt-0.5">Display the courses/education block on the page.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showCoursesSection}
              onClick={() => setShowCoursesSection((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showCoursesSection ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showCoursesSection ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Show Marketplace / Offers Section</p>
              <p className="text-xs text-gray-500 mt-0.5">Display products and offers on the page.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showMarketplaceSection}
              onClick={() => setShowMarketplaceSection((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showMarketplaceSection ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showMarketplaceSection ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Show AI Mentors Section</p>
              <p className="text-xs text-gray-500 mt-0.5">Display the AI mentors block on the page.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showAiMentorsSection}
              onClick={() => setShowAiMentorsSection((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showAiMentorsSection ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showAiMentorsSection ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {pageType !== "founders" && (
            <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Show Founders CTA Section</p>
                <p className="text-xs text-gray-500 mt-0.5">Display the founders call-to-action block on the page.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showFoundersCtaSection}
                onClick={() => setShowFoundersCtaSection((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showFoundersCtaSection ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showFoundersCtaSection ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
        <div className="pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSaveVisibility}
            disabled={isSavingVisibility}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingVisibility ? "Saving…" : "Save Section Visibility"}
          </button>
        </div>
      </section>

      {/* Plans Displayed on This Page */}
      <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans Displayed on This Page</h3>

        <div className="space-y-4 pb-6 border-b border-gray-200">
          <div>
            <label
              htmlFor="membership-headline"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Membership Section Headline
            </label>
            <input
              type="text"
              id="membership-headline"
              value={membershipHeadline}
              onChange={(e) => setMembershipHeadline(e.target.value)}
              placeholder="e.g. Start Free. Upgrade When It Makes Sense."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="membership-intro"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Membership Section Intro
            </label>
            <textarea
              id="membership-intro"
              name="membership_intro"
              rows={4}
              value={membershipIntro}
              onChange={(e) => setMembershipIntro(e.target.value)}
              placeholder="Short paragraph shown above the plan cards. Line breaks are preserved."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px] whitespace-pre-wrap"
            />
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Choose which plans appear on this sales page. Order reflects selection order.
        </p>
        <div className="space-y-2">
          {(() => {
            const selectedFirst = selectedPlanIds
              .map((id) => activePlans.find((p) => p.id === id))
              .filter((p): p is ActivePlanForSalesPage => p != null)
            const unselected = activePlans.filter((p) => !selectedPlanIds.includes(p.id))
            const orderedPlans = [...selectedFirst, ...unselected]
            return orderedPlans.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No active plans. Create plans in Admin → Plans.</p>
            ) : (
              orderedPlans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlanIds.includes(plan.id)}
                    onChange={() => togglePlanSelection(plan.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{plan.name}</span>
                      {plan.most_popular && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {plan.price != null && plan.currency != null
                        ? `${plan.currency} ${plan.price}`
                        : plan.price != null
                          ? String(plan.price)
                          : "—"}
                      {plan.billing ? ` / ${plan.billing}` : ""}
                    </div>
                  </div>
                </label>
              ))
            )
          })()}
        </div>
        <div className="pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSavePlans}
            disabled={isSavingPlans}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingPlans ? "Saving…" : "Save Plans"}
          </button>
        </div>
      </section>

      {pageType === "founders" && (
        <>
          {/* Founders Availability */}
          <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders Availability</h3>
            <div>
              <label
                htmlFor="founders-spots-available"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Spots available
              </label>
              <input
                type="number"
                id="founders-spots-available"
                min={0}
                value={foundersSpotsAvailable === "" ? "" : foundersSpotsAvailable}
                onChange={(e) =>
                  setFoundersSpotsAvailable(e.target.value === "" ? "" : parseInt(e.target.value, 10) || "")
                }
                placeholder="e.g. 50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveFoundersAvailability}
                disabled={isSavingFoundersAvailability}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingFoundersAvailability ? "Saving…" : "Save Availability"}
              </button>
            </div>
          </section>

          {/* Founders Invite Section */}
          <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders Invite Section</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="founders-invite-headline" className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  id="founders-invite-headline"
                  value={foundersInviteHeadline}
                  onChange={(e) => setFoundersInviteHeadline(e.target.value)}
                  placeholder="Invite headline"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="founders-invite-body" className="block text-sm font-medium text-gray-700 mb-2">
                  Body
                </label>
                <textarea
                  id="founders-invite-body"
                  rows={4}
                  value={foundersInviteBody}
                  onChange={(e) => setFoundersInviteBody(e.target.value)}
                  placeholder="Invite body text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media type</label>
                <select
                  value={foundersInviteMediaType}
                  onChange={(e) => setFoundersInviteMediaType(e.target.value as "image" | "video")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label htmlFor="founders-invite-media-url" className="block text-sm font-medium text-gray-700 mb-2">
                  Media URL
                </label>
                <input
                  type="text"
                  id="founders-invite-media-url"
                  value={foundersInviteMediaUrl}
                  onChange={(e) => setFoundersInviteMediaUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveFoundersInvite}
                disabled={isSavingFoundersInvite}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingFoundersInvite ? "Saving…" : "Save Invite Section"}
              </button>
            </div>
          </section>

          {/* Founders Comparison Section */}
          <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders Comparison Section</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="founders-comparison-headline" className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  id="founders-comparison-headline"
                  value={foundersComparisonHeadline}
                  onChange={(e) => setFoundersComparisonHeadline(e.target.value)}
                  placeholder="Comparison headline"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="founders-comparison-subhead" className="block text-sm font-medium text-gray-700 mb-2">
                  Subhead
                </label>
                <input
                  type="text"
                  id="founders-comparison-subhead"
                  value={foundersComparisonSubhead}
                  onChange={(e) => setFoundersComparisonSubhead(e.target.value)}
                  placeholder="Comparison subhead"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="founders-price-lifetime" className="block text-sm font-medium text-gray-700 mb-2">
                  Lifetime price
                </label>
                <input
                  type="number"
                  id="founders-price-lifetime"
                  min={0}
                  step={0.01}
                  value={foundersPriceLifetime === "" ? "" : foundersPriceLifetime}
                  onChange={(e) =>
                    setFoundersPriceLifetime(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                  }
                  placeholder="e.g. 999"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="founders-price-comparison-monthly" className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly comparison price
                </label>
                <input
                  type="number"
                  id="founders-price-comparison-monthly"
                  min={0}
                  step={0.01}
                  value={foundersPriceComparisonMonthly === "" ? "" : foundersPriceComparisonMonthly}
                  onChange={(e) =>
                    setFoundersPriceComparisonMonthly(e.target.value === "" ? "" : parseFloat(e.target.value) || "")
                  }
                  placeholder="e.g. 29"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveFoundersComparison}
                disabled={isSavingFoundersComparison}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingFoundersComparison ? "Saving…" : "Save Comparison Section"}
              </button>
            </div>
          </section>

          {/* Founders Claim Section */}
          <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders Claim Section</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="founders-claim-headline" className="block text-sm font-medium text-gray-700 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  id="founders-claim-headline"
                  value={foundersClaimHeadline}
                  onChange={(e) => setFoundersClaimHeadline(e.target.value)}
                  placeholder="Claim headline"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="founders-claim-body" className="block text-sm font-medium text-gray-700 mb-2">
                  Body
                </label>
                <textarea
                  id="founders-claim-body"
                  rows={4}
                  value={foundersClaimBody}
                  onChange={(e) => setFoundersClaimBody(e.target.value)}
                  placeholder="Claim body text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveFoundersClaim}
                disabled={isSavingFoundersClaim}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingFoundersClaim ? "Saving…" : "Save Claim Section"}
              </button>
            </div>
          </section>

          {/* Founders FAQ */}
          <section className="mt-10 pt-10 border-t border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders FAQ</h3>
            <p className="text-sm text-gray-500 mb-4">Editable list of FAQ items. Add or remove items, then save.</p>
            <div className="space-y-4">
              {foundersFaq.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => setFoundersFaqItem(index, "question", e.target.value)}
                    placeholder="Question"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => setFoundersFaqItem(index, "answer", e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFoundersFaqItem(index)}
                    className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFoundersFaqItem}
                className="px-4 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
              >
                Add FAQ item
              </button>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveFoundersFaq}
                disabled={isSavingFoundersFaq}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingFoundersFaq ? "Saving…" : "Save FAQ"}
              </button>
            </div>
          </section>
        </>
      )}

      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
