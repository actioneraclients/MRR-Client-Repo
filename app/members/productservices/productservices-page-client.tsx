"use client"

import { useState, startTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Search,
  ExternalLink,
  Plus,
  Store,
  Briefcase,
  Package,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Youtube,
  MoreVertical,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createBrowserClient } from "@supabase/ssr"
import { createBusiness, updateBusiness, deleteBusiness } from "./actions-businesses"
import { createService, updateService, deleteService } from "./actions-services"
import { createProduct, updateProduct, deleteProduct } from "./actions-products"
import { type MyBusinessOption, getBusinessById, getBusinessBySlug, getServiceById, getProductById } from "./actions"
import { UpgradeRequiredModal } from "../community/groups/upgrade-required-modal"
import { SponsoredSpotlightCard } from "@/components/ui/SponsoredSpotlightCard"

type TabType = "businesses" | "services" | "products"

type SocialLink = { platform: string; url: string }
type MockProduct = { id: string; name: string; description?: string }
type MockService = { id: string; name: string; description?: string }

/** Product listing item (from server). */
type ProductOfferItem = {
  id: string
  owner_id: string | null
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  business_id: string
  product_format: string
  price_text: string | null
  who_its_for: string
  benefits: string[]
  business: { id: string; name: string; logo_url: string | null }
  is_sponsored?: boolean
}

/** Service listing item (from server). */
type ServiceOfferItem = {
  id: string
  owner_id: string | null
  name: string
  short_description: string
  long_description: string
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  business_id: string
  engagement_type: string
  delivery_format: string
  who_its_for: string
  benefits: string[]
  business: { id: string; name: string; logo_url: string | null }
  price_label?: string | null
  tags?: string[]
  is_sponsored?: boolean
}

/** Business list item (from server). */
type MockBusiness = {
  id: string
  owner_id?: string | null
  name: string
  slug: string
  logo_url: string | null
  description: string
  category: string
  website_url: string | null
  social_links?: Record<string, string> | string | null
  products: MockProduct[]
  services: MockService[]
  is_sponsored?: boolean
}

function SocialIcon({ platform }: { platform: string }) {
  const className = "w-5 h-5 text-gray-600"
  switch (platform.toLowerCase()) {
    case "linkedin":
      return <Linkedin className={className} />
    case "twitter":
      return <Twitter className={className} />
    case "facebook":
      return <Facebook className={className} />
    case "instagram":
      return <Instagram className={className} />
    default:
      return <Globe className={className} />
  }
}

const inputClassName =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
const labelClassName = "block text-sm font-medium text-gray-700 mb-1.5"

const SOCIAL_PLATFORMS = [
  { key: "website", label: "Additional Website" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "X / Twitter" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
] as const

function socialLinksObjectToArray(obj: Record<string, string> | null | undefined): { platform: string; url: string }[] {
  if (!obj || typeof obj !== "object") return []
  return SOCIAL_PLATFORMS.filter((p) => obj[p.key])
    .map((p) => ({ platform: p.key, url: obj[p.key] }))
}

function AddBusinessModal({
  open,
  onClose,
  onSuccess,
  expertTags,
  editingBusinessId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  expertTags: { id: string; name: string }[]
  editingBusinessId?: string | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [selectedExpertTagIds, setSelectedExpertTagIds] = useState<string[]>([])
  const [editData, setEditData] = useState<Awaited<ReturnType<typeof getBusinessById>> | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([])
  const [addingSocial, setAddingSocial] = useState(false)
  const [editingSocialIndex, setEditingSocialIndex] = useState<number | null>(null)
  const [newSocialPlatform, setNewSocialPlatform] = useState("website")
  const [newSocialUrl, setNewSocialUrl] = useState("")

  const isEditMode = !!editingBusinessId

  useEffect(() => {
    if (open && editingBusinessId) {
      setIsLoadingEdit(true)
      getBusinessById(editingBusinessId).then((data) => {
        setEditData(data)
        if (data) {
          setLogoUrl(data.logo_url || "")
          setSelectedExpertTagIds(data.tag_ids || [])
          setSocialLinks(socialLinksObjectToArray(data.social_links ? { ...data.social_links } : null))
        }
        setIsLoadingEdit(false)
      })
    } else {
      setEditData(null)
      if (!open || !editingBusinessId) {
        setLogoUrl("")
        setSelectedExpertTagIds([])
        setSocialLinks([])
        setAddingSocial(false)
        setEditingSocialIndex(null)
      }
    }
  }, [open, editingBusinessId])

  const handleExpertTagToggle = (tagId: string) => {
    setSelectedExpertTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const usedPlatforms = socialLinks.map((s) => s.platform)

  const handleAddSocial = () => {
    if (!newSocialUrl.trim()) return
    const alreadyUsed = socialLinks.some((s) => s.platform === newSocialPlatform)
    if (alreadyUsed && editingSocialIndex === null) return
    if (editingSocialIndex !== null) {
      setSocialLinks((prev) => prev.map((item, i) => (i === editingSocialIndex ? { platform: newSocialPlatform, url: newSocialUrl.trim() } : item)))
      setEditingSocialIndex(null)
    } else {
      setSocialLinks((prev) => [...prev, { platform: newSocialPlatform, url: newSocialUrl.trim() }])
      setAddingSocial(false)
    }
    setNewSocialPlatform("website")
    setNewSocialUrl("")
  }

  const handleRemoveSocial = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index))
    if (editingSocialIndex === index) {
      setEditingSocialIndex(null)
      setNewSocialUrl("")
    } else if (editingSocialIndex !== null && editingSocialIndex > index) {
      setEditingSocialIndex(editingSocialIndex - 1)
    }
  }

  const handleStartEditSocial = (index: number) => {
    const item = socialLinks[index]
    setEditingSocialIndex(index)
    setNewSocialPlatform(item.platform)
    setNewSocialUrl(item.url)
    setAddingSocial(false)
  }

  const handleCancelAddEditSocial = () => {
    setAddingSocial(false)
    setEditingSocialIndex(null)
    setNewSocialPlatform("website")
    setNewSocialUrl("")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const ext = file.name.split(".").pop() || "jpg"
      const path = `businesses/${crypto.randomUUID()}/logo.${ext}`
      const { error } = await supabase.storage.from("marketplace").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
      if (error) throw error
      const { data } = supabase.storage.from("marketplace").getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    } catch (err) {
      console.error(err)
      alert("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const form = e.currentTarget
    const get = (name: string) => (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "").trim()
    const social_links: { website?: string; linkedin?: string; instagram?: string; facebook?: string; twitter?: string; tiktok?: string; youtube?: string } = {}
    socialLinks.forEach(({ platform, url }) => {
      if (url.trim()) (social_links as Record<string, string>)[platform] = url.trim()
    })

    startTransition(async () => {
      const payload = {
        name: get("name"),
        short_description: get("short_description"),
        description: get("description") || null,
        logo_url: logoUrl || null,
        website_url: get("website_url") || null,
        social_links: Object.keys(social_links).length > 0 ? social_links : null,
        cta_text: get("cta_text") || null,
        cta_url: get("cta_url") || null,
        tag_ids: selectedExpertTagIds.length > 0 ? selectedExpertTagIds : undefined,
      }
      const result = isEditMode && editingBusinessId
        ? await updateBusiness({ id: editingBusinessId, ...payload })
        : await createBusiness(payload)
      setIsSubmitting(false)
      if (result.success) {
        onClose()
        onSuccess()
      } else {
        setError(result.error ?? (isEditMode ? "Failed to update business" : "Failed to create business"))
      }
    })
  }
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <form key={editData?.id ?? "new"} onSubmit={handleSubmit} className="flex min-h-0 flex-col h-full">
          <input type="hidden" name="logo_url" value={logoUrl} />
          <div className="shrink-0 border-b border-gray-200 px-5 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Business" : "Add Your Business"}</h2>
            {isEditMode && isLoadingEdit && <p className="text-sm text-gray-500 mt-1">Loading…</p>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">{error}</p>
            )}
            {isEditMode && !isLoadingEdit && !editData && <p className="text-sm text-red-500">Business not found.</p>}
            {(!isEditMode || editData) && (
              <>
            <div>
              <label className={labelClassName}>Business Name <span className="text-red-500">*</span></label>
              <Input name="name" className={inputClassName} placeholder="Business name" required defaultValue={editData?.name} />
            </div>
            <div>
              <label className={labelClassName}>Short Description <span className="text-red-500">*</span></label>
              <Input name="short_description" className={inputClassName} placeholder="Brief tagline for cards and previews" required defaultValue={editData?.short_description} />
              <p className="text-sm text-gray-500 mt-1">Shown on business cards and previews</p>
            </div>
            <div>
              <label className={labelClassName}>About the Business</label>
              <textarea name="description" rows={3} className={inputClassName + " resize-none"} placeholder="Full description" defaultValue={editData?.description ?? undefined} />
            </div>
            <div>
              <label className={labelClassName}>Expert Tags</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white">
                {expertTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No expert tags available</p>
                ) : (
                  expertTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleExpertTagToggle(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedExpertTagIds.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Select areas of expertise associated with this business</p>
            </div>
            <div>
              <label className={labelClassName}>Logo</label>
              {isEditMode && logoUrl && <p className="text-sm text-gray-500 mb-1">Current logo: <img src={logoUrl} alt="" className="inline h-8 w-8 object-contain align-middle" /></p>}
              <input
                type="file"
                accept="image/*"
                className={inputClassName}
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />
              {uploadingLogo && <p className="text-sm text-gray-500 mt-1">Uploading…</p>}
            </div>
            <div>
              <label className={labelClassName}>Website URL</label>
              <Input name="website_url" type="url" className={inputClassName} placeholder="https://..." defaultValue={editData?.website_url ?? undefined} />
            </div>
            <div>
              <label className={labelClassName}>Social Links</label>
              <div className="space-y-3">
                {socialLinks.length > 0 && (
                  <ul className="space-y-2">
                    {socialLinks.map((link, index) => (
                      <li key={`${link.platform}-${index}`} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <span className="text-sm font-medium text-gray-700 capitalize shrink-0">
                          {SOCIAL_PLATFORMS.find((p) => p.key === link.platform)?.label ?? link.platform}
                        </span>
                        <span className="flex-1 min-w-0 truncate text-sm text-gray-600" title={link.url}>{link.url}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-gray-600" onClick={() => handleStartEditSocial(index)}>Edit</Button>
                          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:text-red-700" onClick={() => handleRemoveSocial(index)}>Remove</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {(addingSocial || editingSocialIndex !== null) && (
                  <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                      <select
                        value={newSocialPlatform}
                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                        className={inputClassName + " py-2"}
                        disabled={editingSocialIndex !== null}
                      >
                        {(editingSocialIndex !== null ? SOCIAL_PLATFORMS : SOCIAL_PLATFORMS.filter((p) => !usedPlatforms.includes(p.key))).map((p) => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                      <Input type="url" value={newSocialUrl} onChange={(e) => setNewSocialUrl(e.target.value)} placeholder="https://..." className={inputClassName} />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddSocial} disabled={!newSocialUrl.trim()}>Save</Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelAddEditSocial}>Cancel</Button>
                  </div>
                )}
                {!addingSocial && editingSocialIndex === null && usedPlatforms.length < SOCIAL_PLATFORMS.length && (
                  <Button type="button" variant="outline" size="sm" onClick={() => { setAddingSocial(true); setNewSocialPlatform(SOCIAL_PLATFORMS.find((p) => !usedPlatforms.includes(p.key))?.key ?? "website"); setNewSocialUrl("") }} className="text-gray-700">
                    <Plus className="w-4 h-4 mr-1.5 inline" />
                    Add Social
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Add links to your website and social profiles</p>
            </div>
            <div>
              <label className={labelClassName}>CTA Text</label>
              <Input name="cta_text" className={inputClassName} placeholder="e.g. Visit site" defaultValue={editData?.cta_text ?? undefined} />
            </div>
            <div>
              <label className={labelClassName}>CTA URL</label>
              <Input name="cta_url" type="url" className={inputClassName} placeholder="https://..." defaultValue={editData?.cta_url ?? undefined} />
            </div>
              </>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-200 px-5 md:px-8 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || uploadingLogo}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploadingLogo || (isEditMode && isLoadingEdit)}>{isSubmitting ? (isEditMode ? "Updating…" : "Creating…") : (isEditMode ? "Update Business" : "Create Business")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddServiceModal({
  open,
  onClose,
  onSuccess,
  myBusinesses,
  serviceTags,
  editingServiceId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  myBusinesses: MyBusinessOption[]
  serviceTags: { id: string; name: string }[]
  editingServiceId?: string | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [editData, setEditData] = useState<Awaited<ReturnType<typeof getServiceById>> | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isEditMode = !!editingServiceId

  useEffect(() => {
    if (open && editingServiceId) {
      setIsLoadingEdit(true)
      getServiceById(editingServiceId).then((data) => {
        setEditData(data)
        if (data) {
          setSelectedBusinessId(data.business_id)
          setImageUrl(data.image_url || "")
          setSelectedTagIds(data.tag_ids || [])
        }
        setIsLoadingEdit(false)
      })
    } else {
      setEditData(null)
      if (!open || !editingServiceId) {
        setImageUrl("")
        setSelectedTagIds([])
      }
    }
  }, [open, editingServiceId])

  const selectedBusiness = myBusinesses.find((b) => b.id === selectedBusinessId)

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const ext = file.name.split(".").pop() || "jpg"
      const path = `services/${crypto.randomUUID()}/cover.${ext}`
      const { error } = await supabase.storage.from("marketplace").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
      if (error) throw error
      const { data } = supabase.storage.from("marketplace").getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } catch (err) {
      console.error(err)
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const isValidUrl = (s: string) => {
    if (!s.trim()) return true
    try {
      new URL(s.trim())
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const get = (name: string) => (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "").trim()
    const ctaUrl = get("cta_url")
    if (ctaUrl && !isValidUrl(ctaUrl)) {
      setError("CTA URL must be a valid URL.")
      return
    }
    setIsSubmitting(true)
    startTransition(async () => {
      const payload = {
        business_id: get("business_id"),
        name: get("name"),
        short_description: get("short_description"),
        description: get("description") || null,
        image_url: imageUrl || null,
        price_label: get("price_label") || null,
        delivery_type: get("delivery_type") || null,
        cta_text: get("cta_text") || null,
        cta_url: ctaUrl || null,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }
      const result = isEditMode && editingServiceId
        ? await updateService({ id: editingServiceId, ...payload })
        : await createService(payload)
      setIsSubmitting(false)
      if (result.success) {
        onClose()
        onSuccess()
      } else {
        setError(result.error ?? (isEditMode ? "Failed to update service" : "Failed to create service"))
      }
    })
  }
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <form key={editData?.id ?? "new"} onSubmit={handleSubmit} className="flex min-h-0 flex-col h-full">
          <input type="hidden" name="image_url" value={imageUrl} />
          <div className="shrink-0 border-b border-gray-200 px-5 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Service" : "Add Service"}</h2>
            {isEditMode && isLoadingEdit && <p className="text-sm text-gray-500 mt-1">Loading…</p>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">{error}</p>
            )}
            {isEditMode && !isLoadingEdit && !editData && <p className="text-sm text-red-500">Service not found.</p>}
            {(!isEditMode || editData) && (
              <>
            <div>
              <label className={labelClassName}>Business <span className="text-red-500">*</span></label>
              <select
                name="business_id"
                className={inputClassName + " appearance-none"}
                required
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                disabled={isEditMode}
              >
                <option value="">Select a business</option>
                {myBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {myBusinesses.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">Create a business first to add services.</p>
              )}
              {selectedBusiness && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Offered by</span>
                  {selectedBusiness.logo_url ? (
                    <Image
                      src={selectedBusiness.logo_url}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{selectedBusiness.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className={labelClassName}>Service Name <span className="text-red-500">*</span></label>
              <Input name="name" className={inputClassName} placeholder="Service name" required defaultValue={editData?.name} />
            </div>

            <div>
              <label className={labelClassName}>Short Description <span className="text-red-500">*</span></label>
              <Input name="short_description" className={inputClassName} placeholder="Brief tagline for the service card" required defaultValue={editData?.short_description} />
              <p className="text-sm text-gray-500 mt-1">Shown on the service card preview</p>
            </div>

            <div>
              <label className={labelClassName}>About This Service</label>
              <textarea name="description" rows={4} className={inputClassName + " resize-none"} placeholder="Full description for the service details view" defaultValue={editData?.description ?? undefined} />
              <p className="text-sm text-gray-500 mt-1">Shown when someone opens the service details</p>
            </div>

            <div>
              <label className={labelClassName}>Image</label>
              {isEditMode && imageUrl && <p className="text-sm text-gray-500 mb-1">Current image: <img src={imageUrl} alt="" className="inline h-12 w-auto object-contain align-middle rounded" /></p>}
              <input
                type="file"
                accept="image/*"
                className={inputClassName}
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading…</p>}
            </div>

            <div>
              <label className={labelClassName}>Price Label</label>
              <Input name="price_label" className={inputClassName} placeholder="e.g. $99, Free, Starting at $500" defaultValue={editData?.price_label ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>Delivery Type</label>
              <Input name="delivery_type" className={inputClassName} placeholder="e.g. Virtual, In-person, Hybrid" defaultValue={editData?.delivery_type ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>Tags</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white">
                {serviceTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available</p>
                ) : (
                  serviceTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className={labelClassName}>CTA Text</label>
              <Input name="cta_text" className={inputClassName} placeholder="e.g. Book now" defaultValue={editData?.cta_text ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>CTA URL</label>
              <Input name="cta_url" type="url" className={inputClassName} placeholder="https://..." defaultValue={editData?.cta_url ?? undefined} />
              <p className="text-sm text-gray-500 mt-1">Links off-platform</p>
            </div>
              </>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-200 px-5 md:px-8 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || uploadingImage}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage || (isEditMode && isLoadingEdit) || myBusinesses.length === 0}>{isSubmitting ? (isEditMode ? "Updating…" : "Creating…") : (isEditMode ? "Update Service" : "Create Service")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddProductModal({
  open,
  onClose,
  onSuccess,
  myBusinesses,
  productTags,
  editingProductId,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  myBusinesses: MyBusinessOption[]
  productTags: { id: string; name: string }[]
  editingProductId?: string | null
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [editData, setEditData] = useState<Awaited<ReturnType<typeof getProductById>> | null>(null)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)

  const isEditMode = !!editingProductId

  useEffect(() => {
    if (open && editingProductId) {
      setIsLoadingEdit(true)
      getProductById(editingProductId).then((data) => {
        setEditData(data)
        if (data) {
          setSelectedBusinessId(data.business_id)
          setImageUrl(data.image_url || "")
          setSelectedTagIds(data.tag_ids || [])
        }
        setIsLoadingEdit(false)
      })
    } else {
      setEditData(null)
      if (!open || !editingProductId) {
        setImageUrl("")
        setSelectedTagIds([])
      }
    }
  }, [open, editingProductId])

  const selectedBusiness = myBusinesses.find((b) => b.id === selectedBusinessId)

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const ext = file.name.split(".").pop() || "jpg"
      const path = `products/${crypto.randomUUID()}/cover.${ext}`
      const { error } = await supabase.storage.from("marketplace").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
      if (error) throw error
      const { data } = supabase.storage.from("marketplace").getPublicUrl(path)
      setImageUrl(data.publicUrl)
    } catch (err) {
      console.error(err)
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const isValidUrl = (s: string) => {
    if (!s.trim()) return true
    try {
      new URL(s.trim())
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const get = (name: string) => (form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? "").trim()
    const ctaUrl = get("cta_url")
    if (ctaUrl && !isValidUrl(ctaUrl)) {
      setError("CTA URL must be a valid URL.")
      return
    }
    const benefitsText = get("benefits")
    const benefits = benefitsText ? benefitsText.split("\n").map((s) => s.trim()).filter(Boolean) : []

    setIsSubmitting(true)
    startTransition(async () => {
      const payload = {
        business_id: get("business_id"),
        name: get("name"),
        short_description: get("short_description"),
        description: get("description") || null,
        image_url: imageUrl || null,
        product_format: get("product_format") || null,
        who_its_for: get("who_its_for") || null,
        benefits: benefits.length > 0 ? benefits : undefined,
        price_label: get("price_label") || null,
        cta_text: get("cta_text") || null,
        cta_url: ctaUrl || null,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }
      const result = isEditMode && editingProductId
        ? await updateProduct({ id: editingProductId, ...payload })
        : await createProduct(payload)
      setIsSubmitting(false)
      if (result.success) {
        onClose()
        onSuccess()
      } else {
        setError(result.error ?? (isEditMode ? "Failed to update product" : "Failed to create product"))
      }
    })
  }
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <form key={editData?.id ?? "new"} onSubmit={handleSubmit} className="flex min-h-0 flex-col h-full">
          <input type="hidden" name="image_url" value={imageUrl} />
          <div className="shrink-0 border-b border-gray-200 px-5 md:px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">{isEditMode ? "Edit Product" : "Add Product"}</h2>
            {isEditMode && isLoadingEdit && <p className="text-sm text-gray-500 mt-1">Loading…</p>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-8 py-6 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2" role="alert">{error}</p>
            )}
            {isEditMode && !isLoadingEdit && !editData && <p className="text-sm text-red-500">Product not found.</p>}
            {(!isEditMode || editData) && (
              <>
            <div>
              <label className={labelClassName}>Business <span className="text-red-500">*</span></label>
              <select
                name="business_id"
                className={inputClassName + " appearance-none"}
                required
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                disabled={isEditMode}
              >
                <option value="">Select a business</option>
                {myBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {myBusinesses.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">Create a business first to add products.</p>
              )}
              {selectedBusiness && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium text-gray-500">Offered by</span>
                  {selectedBusiness.logo_url ? (
                    <Image
                      src={selectedBusiness.logo_url}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">{selectedBusiness.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className={labelClassName}>Product Name <span className="text-red-500">*</span></label>
              <Input name="name" className={inputClassName} placeholder="Product name" required defaultValue={editData?.name} />
            </div>

            <div>
              <label className={labelClassName}>Short Description <span className="text-red-500">*</span></label>
              <Input name="short_description" className={inputClassName} placeholder="Brief tagline for the product card" required defaultValue={editData?.short_description} />
              <p className="text-sm text-gray-500 mt-1">Shown on the product card preview</p>
            </div>

            <div>
              <label className={labelClassName}>About This Product</label>
              <textarea name="description" rows={4} className={inputClassName + " resize-none"} placeholder="Full description for the product details view" defaultValue={editData?.description ?? undefined} />
              <p className="text-sm text-gray-500 mt-1">Shown when someone opens the product details</p>
            </div>

            <div>
              <label className={labelClassName}>Image</label>
              {isEditMode && imageUrl && <p className="text-sm text-gray-500 mb-1">Current image: <img src={imageUrl} alt="" className="inline h-12 w-auto object-contain align-middle rounded" /></p>}
              <input
                type="file"
                accept="image/*"
                className={inputClassName}
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading…</p>}
            </div>

            <div>
              <label className={labelClassName}>Product Format</label>
              <Input name="product_format" className={inputClassName} placeholder="e.g. Digital, Physical, Hybrid" defaultValue={editData?.product_format ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>Who This Is For</label>
              <textarea name="who_its_for" rows={3} className={inputClassName + " resize-none"} placeholder="Who is this product best suited for?" defaultValue={editData?.who_its_for ?? undefined} />
              <p className="text-sm text-gray-500 mt-1">Who is this product best suited for?</p>
            </div>

            <div>
              <label className={labelClassName}>Key Benefits</label>
              <textarea name="benefits" rows={4} className={inputClassName + " resize-none"} placeholder="One benefit per line" defaultValue={editData?.benefits?.length ? editData.benefits.join("\n") : undefined} />
              <p className="text-sm text-gray-500 mt-1">What outcomes or results does this product help deliver? (One per line)</p>
            </div>

            <div>
              <label className={labelClassName}>Price Label</label>
              <Input name="price_label" className={inputClassName} placeholder="e.g. $49, Free, Starting at $99" defaultValue={editData?.price_label ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>Tags</label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white">
                {productTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available</p>
                ) : (
                  productTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className={labelClassName}>CTA Text</label>
              <Input name="cta_text" className={inputClassName} placeholder="e.g. Get it" defaultValue={editData?.cta_text ?? undefined} />
            </div>

            <div>
              <label className={labelClassName}>CTA URL</label>
              <Input name="cta_url" type="url" className={inputClassName} placeholder="https://..." defaultValue={editData?.cta_url ?? undefined} />
              <p className="text-sm text-gray-500 mt-1">Links off-platform</p>
            </div>
              </>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-200 px-5 md:px-8 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || uploadingImage}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || uploadingImage || (isEditMode && isLoadingEdit) || myBusinesses.length === 0}>{isSubmitting ? (isEditMode ? "Updating…" : "Creating…") : (isEditMode ? "Update Product" : "Create Product")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BusinessProfileModal({
  business,
  onClose,
  onSelectService,
  onSelectProduct,
}: {
  business: MockBusiness | null
  onClose: () => void
  onSelectService?: (serviceId: string) => void
  onSelectProduct?: (productId: string) => void
}) {
  if (!business) return null

  const socialLabels: Record<string, string> = {
    website: "Additional Website",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "X / Twitter",
    tiktok: "TikTok",
    youtube: "YouTube",
  }
  const socialPillStyles: Record<string, string> = {
    website: "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200",
    linkedin: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    instagram: "bg-pink-50 border-pink-200 text-pink-800 hover:bg-pink-100",
    facebook: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    twitter: "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200",
    tiktok: "bg-slate-900 border-slate-700 text-white hover:bg-slate-800",
    youtube: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  }
  const defaultPillStyle = "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200"

  const getLabel = (platform: string) => socialLabels[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
  const getStyle = (platform: string) => socialPillStyles[platform] ?? defaultPillStyle

  let normalizedSocialLinks: Record<string, string> = {}
  const rawSocialLinks = business.social_links
  if (rawSocialLinks != null) {
    if (typeof rawSocialLinks === "string") {
      try {
        const parsed = JSON.parse(rawSocialLinks)
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
          normalizedSocialLinks = parsed as Record<string, string>
        }
      } catch {
        normalizedSocialLinks = {}
      }
    } else if (typeof rawSocialLinks === "object" && !Array.isArray(rawSocialLinks)) {
      normalizedSocialLinks = rawSocialLinks as Record<string, string>
    }
  }

  const links: { platform: string; url: string; label: string }[] = []
  for (const [key, value] of Object.entries(normalizedSocialLinks)) {
    const url = typeof value === "string" ? value.trim() : ""
    if (!url) continue
    const platform = key.toLowerCase()
    links.push({ platform, url, label: getLabel(platform) })
  }

  const SocialPillIcon = ({ platform }: { platform: string }) => {
    const c = "w-4 h-4 shrink-0"
    switch (platform) {
      case "linkedin": return <Linkedin className={c} />
      case "instagram": return <Instagram className={c} />
      case "facebook": return <Facebook className={c} />
      case "twitter": return <Twitter className={c} />
      case "tiktok": return <Music className={c} />
      case "youtube": return <Youtube className={c} />
      default: return <Globe className={c} />
    }
  }

  return (
    <Dialog open={!!business} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Hero / Header */}
          <div className="relative">
            <div className="w-full h-64 md:h-80 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center p-5 md:p-8">
              <Image
                src={business.logo_url || "/placeholder.svg?height=200&width=200&text=Logo"}
                alt={business.name}
                width={200}
                height={200}
                className="max-h-48 w-auto object-contain"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-5 md:px-8 pb-8 pt-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-sm">{business.name}</h2>
              <p className="text-lg text-white/90">{business.category}</p>
            </div>
          </div>

          <div className="p-5 md:p-8 lg:p-10 space-y-12">
            {/* About */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{business.description}</p>
            </section>

            {/* Primary Website — business.website_url only; not part of social_links */}
            {business.website_url?.trim() && (
              <section className="text-center">
                <a
                  href={business.website_url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-5 h-5 shrink-0 text-gray-600" />
                  <span className="underline decoration-gray-300 hover:decoration-blue-500">{business.website_url.trim()}</span>
                </a>
              </section>
            )}

            {/* Social Links — pill badges from business.social_links only */}
            {links.length > 0 && (
              <section>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {links.map((link) => (
                    <a
                      key={`${link.platform}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors ${getStyle(link.platform)}`}
                    >
                      <SocialPillIcon platform={link.platform} />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
              {business.products.length > 0 ? (
                <div className="space-y-3">
                  {business.products.map((item) => {
                    const productWithImage = item as { id: string; name: string; description?: string; image_url?: string | null }
                    const thumbUrl = productWithImage.image_url
                    return (
                      <div
                        key={item.id}
                        role={onSelectProduct ? "button" : undefined}
                        onClick={onSelectProduct ? () => onSelectProduct(item.id) : undefined}
                        className={`rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 ${onSelectProduct ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors" : ""}`}
                      >
                        <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {thumbUrl ? (
                            <Image src={thumbUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No products listed yet.</p>
              )}
            </section>

            {/* Services */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
              {business.services.length > 0 ? (
                <div className="space-y-3">
                  {business.services.map((item) => {
                    const serviceWithImage = item as { id: string; name: string; description?: string; image_url?: string | null }
                    const thumbUrl = serviceWithImage.image_url
                    return (
                      <div
                        key={item.id}
                        role={onSelectService ? "button" : undefined}
                        onClick={onSelectService ? () => onSelectService(item.id) : undefined}
                        className={`rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 ${onSelectService ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors" : ""}`}
                      >
                        <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                          {thumbUrl ? (
                            <Image src={thumbUrl} alt="" width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <Briefcase className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No services listed yet.</p>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Product detail modal — header, format/price, who it's for, description, benefits, CTA. */
function ProductModal({
  product,
  onClose,
  sourceBusiness,
  onBackToBusiness,
  brandAccentColor = "#2563eb",
}: {
  product: ProductOfferItem | null
  onClose: () => void
  sourceBusiness?: { id: string; name: string; slug: string } | null
  onBackToBusiness?: () => void
  brandAccentColor?: string
}) {
  if (!product) return null

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          {sourceBusiness && onBackToBusiness && (
            <button
              onClick={onBackToBusiness}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
            >
              ← Back to {sourceBusiness.name}
            </button>
          )}
          {/* 1. Header: product image, title, Offered by */}
          {product.image_url && (
            <div className="w-full overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={product.image_url}
                alt={product.name}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[220px] md:max-h-[320px] object-cover"
                priority
              />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium text-gray-500">Offered by</span>
            <Image
              src={product.business.logo_url || "/placeholder.svg?height=32&width=32"}
              alt={product.business.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-contain bg-gray-100 border border-gray-200"
            />
            <span className="font-medium text-gray-900">{product.business.name}</span>
          </div>

          {/* 2. Quick context: product format, optional price */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {product.product_format}
            </span>
            {product.price_text && (
              <span className="text-sm font-medium text-gray-700">{product.price_text}</span>
            )}
          </div>

          {/* 3. Who this is for */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Who this is for</h3>
            <p className="text-gray-700 leading-relaxed">{product.who_its_for}</p>
          </div>

          {/* 4. Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{product.long_description}</p>
          </div>

          {/* 5. Key benefits / outcomes */}
          {product.benefits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key benefits</h3>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700">
                {product.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. CTA section */}
          {product.cta_text && product.cta_url && (
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <Button
                onClick={() => window.open(product.cta_url, "_blank")}
                className="w-full text-white text-lg py-6"
                style={{ backgroundColor: brandAccentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <ExternalLink className="w-5 h-5 mr-2 inline" />
                {product.cta_text}
              </Button>
              <p className="text-xs text-gray-500 text-center">You&apos;ll be redirected to their site.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Service detail modal — matches Service data model: image, name, tagline, price/delivery badges, tags, description, CTA. */
function ServiceModal({
  service,
  onClose,
  sourceBusiness,
  onBackToBusiness,
  brandAccentColor = "#2563eb",
}: {
  service: ServiceOfferItem | null
  onClose: () => void
  sourceBusiness?: { id: string; name: string; slug: string } | null
  onBackToBusiness?: () => void
  brandAccentColor?: string
}) {
  if (!service) return null

  const hasCta = !!(service.cta_text && service.cta_url)

  return (
    <Dialog open={!!service} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Sticky header: back link, image, name, short description */}
        <div className="shrink-0 flex flex-col">
          <div className="p-5 md:p-8 pb-0">
            {sourceBusiness && onBackToBusiness && (
              <button
                onClick={onBackToBusiness}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
              >
                ← Back to {sourceBusiness.name}
              </button>
            )}
          </div>
          {service.image_url && (
            <div className="w-full overflow-hidden bg-gray-100">
              <Image
                src={service.image_url}
                alt={service.name}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[220px] md:max-h-[320px] object-cover"
                priority
              />
            </div>
          )}
          <div className="p-5 md:p-8 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            {service.short_description && (
              <p className="text-gray-600 mt-1">{service.short_description}</p>
            )}
            {/* Meta row: price label, delivery type */}
            <div className="flex flex-wrap gap-2 items-center mt-4">
              {service.price_label && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {service.price_label}
                </span>
              )}
              {service.delivery_format && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {service.delivery_format}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable body: tags, about */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 pt-0 space-y-6">
          {service.tags && service.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About This Service</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{service.long_description || ""}</p>
          </div>
        </div>

        {/* Sticky footer CTA */}
        {hasCta && (
          <div className="shrink-0 border-t border-gray-200 p-5 md:p-8 bg-white">
            <Button
              onClick={() => window.open(service.cta_url!, "_blank")}
              className="w-full text-white text-lg py-6"
              style={{ backgroundColor: brandAccentColor }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <ExternalLink className="w-5 h-5 mr-2 inline" />
              {service.cta_text}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">You&apos;ll be redirected to their site.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BusinessCard({
  business,
  onClick,
  brandAccentColor = "#2563eb",
  isOwner = false,
  onEdit,
  onDelete,
}: {
  business: MockBusiness
  onClick: () => void
  brandAccentColor?: string
  isOwner?: boolean
  onEdit?: (b: MockBusiness) => void
  onDelete?: (b: MockBusiness) => void
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer relative"
      onClick={onClick}
    >
      {isOwner && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/90 hover:bg-gray-100 shadow">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={() => onEdit(business)}>Edit</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(business)} className="text-red-600">Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center p-6">
        <Image
          className="w-full h-full object-contain object-center"
          src={business.logo_url || "/placeholder.svg?height=200&width=200&text=Logo"}
          alt={business.name}
          width={200}
          height={200}
        />
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{business.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{business.description}</p>
        <p className="text-xs text-gray-500 font-medium">{business.category}</p>
        <div className="pt-3 mt-auto">
          <Button
            className="w-full text-white"
            style={{ backgroundColor: brandAccentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            View Business
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Product card — image, product name, short description, View Product CTA (brandAccentColor). */
function ProductCard({
  product,
  onClick,
  brandAccentColor = "#2563eb",
  isOwner = false,
  onEdit,
  onDelete,
}: {
  product: ProductOfferItem
  onClick: () => void
  brandAccentColor?: string
  isOwner?: boolean
  onEdit?: (p: ProductOfferItem) => void
  onDelete?: (p: ProductOfferItem) => void
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer relative"
      onClick={onClick}
    >
      {isOwner && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/90 hover:bg-gray-100 shadow">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={() => onEdit(product)}>Edit</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600">Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          className="w-full h-full object-cover object-center"
          src={product.image_url || "/placeholder.svg?height=400&width=600&query=product"}
          alt={product.name}
          width={600}
          height={400}
        />
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{product.short_description}</p>
        <div className="pt-3 mt-auto">
          <Button
            className="w-full text-white"
            style={{ backgroundColor: brandAccentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            View Product
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Service card — image, service name, short description, CTA (brandAccentColor). */
function ServiceCard({
  service,
  onClick,
  brandAccentColor = "#2563eb",
  isOwner = false,
  onEdit,
  onDelete,
}: {
  service: ServiceOfferItem
  onClick: () => void
  brandAccentColor?: string
  isOwner?: boolean
  onEdit?: (s: ServiceOfferItem) => void
  onDelete?: (s: ServiceOfferItem) => void
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 cursor-pointer relative"
      onClick={onClick}
    >
      {isOwner && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/90 hover:bg-gray-100 shadow">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && <DropdownMenuItem onClick={() => onEdit(service)}>Edit</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(service)} className="text-red-600">Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className="w-full h-[140px] md:h-[160px] lg:h-[180px] flex-shrink-0 overflow-hidden bg-gray-100 relative">
        <Image
          className="w-full h-full object-cover object-center"
          src={service.image_url || "/placeholder.svg?height=400&width=600&query=service"}
          alt={service.name}
          width={600}
          height={400}
        />
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-lg text-gray-900 leading-snug line-clamp-2">{service.name}</h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{service.short_description}</p>
        <div className="pt-3 mt-auto">
          <Button
            className="w-full text-white"
            style={{ backgroundColor: brandAccentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ProductServicesPageClientProps {
  pageTitle: string
  showBusinessesTab?: boolean
  brandAccentColor?: string
  initialBusinesses: MockBusiness[]
  initialProducts: ProductOfferItem[]
  initialServices: ServiceOfferItem[]
  myBusinesses: MyBusinessOption[]
  serviceTags: { id: string; name: string }[]
  expertTags: { id: string; name: string }[]
  currentUserId: string | null
  canAddBusiness: boolean
  canCreateService: boolean
  canCreateProduct: boolean
  upgradeLink: string | null
}

export default function ProductServicesPageClient({
  pageTitle,
  showBusinessesTab = true,
  brandAccentColor = "#2563eb",
  initialBusinesses,
  initialProducts,
  initialServices,
  myBusinesses,
  serviceTags = [],
  expertTags = [],
  currentUserId = null,
  canAddBusiness = false,
  canCreateService = false,
  canCreateProduct = false,
  upgradeLink,
}: ProductServicesPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>(showBusinessesTab ? "businesses" : "services")
  const [search, setSearch] = useState("")

  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<MockBusiness | null>(null)
  const [selectedBusinessServices, setSelectedBusinessServices] = useState<MockService[]>([])
  const [selectedBusinessProducts, setSelectedBusinessProducts] = useState<MockProduct[]>([])
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceOfferItem | null>(null)
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductOfferItem | null>(null)
  const [sourceBusiness, setSourceBusiness] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [isAddBusinessOpen, setIsAddBusinessOpen] = useState(false)
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "business" | "service" | "product"; id: string; name: string } | null>(null)

  const refreshData = () => router.refresh()

  const selectedBusiness = selectedBusinessProfile
    ? { ...selectedBusinessProfile, products: selectedBusinessProducts, services: selectedBusinessServices }
    : null

  const handleOpenBusinessModal = async (business: MockBusiness) => {
    const profile = await getBusinessBySlug(business.slug)
    if (!profile) return
    const { products: _profileProducts, services: _profileServices, ...rest } = profile
    setSelectedBusinessProfile({
      ...rest,
      social_links: profile.social_links,
    } as MockBusiness)
    setSelectedBusinessServices(
      initialServices
        .filter((s) => s.business_id === business.id)
        .map((s) => ({ id: s.id, name: s.name, description: s.short_description, image_url: s.image_url }))
    )
    setSelectedBusinessProducts(
      initialProducts
        .filter((p) => p.business_id === business.id)
        .map((p) => ({ id: p.id, name: p.name, description: p.short_description, image_url: p.image_url }))
    )
  }

  const handleCloseBusinessModal = () => {
    setSelectedBusinessProfile(null)
    setSelectedBusinessServices([])
    setSelectedBusinessProducts([])
    setSourceBusiness(null)
  }

  const handleOpenServiceFromBusiness = (serviceId: string) => {
    if (!selectedBusinessProfile) return
    setSourceBusiness({
      id: selectedBusinessProfile.id,
      name: selectedBusinessProfile.name,
      slug: selectedBusinessProfile.slug,
    })
    setSelectedBusinessProfile(null)
    setSelectedBusinessServices([])
    setSelectedBusinessProducts([])
    const fullService = initialServices.find((s) => s.id === serviceId) ?? null
    setSelectedServiceDetail(fullService)
  }

  const handleOpenProductFromBusiness = (productId: string) => {
    if (!selectedBusinessProfile) return
    setSourceBusiness({
      id: selectedBusinessProfile.id,
      name: selectedBusinessProfile.name,
      slug: selectedBusinessProfile.slug,
    })
    setSelectedBusinessProfile(null)
    setSelectedBusinessServices([])
    setSelectedBusinessProducts([])
    const fullProduct = initialProducts.find((p) => p.id === productId) ?? null
    setSelectedProductDetail(fullProduct)
  }

  const handleBackToBusinessFromService = async () => {
    if (!sourceBusiness) return
    setSelectedServiceDetail(null)
    const profile = await getBusinessBySlug(sourceBusiness.slug)
    if (!profile) return
    setSelectedBusinessProfile(profile)
    setSelectedBusinessProducts(profile.products)
    setSelectedBusinessServices(profile.services)
    setSourceBusiness(null)
  }

  const handleBackToBusinessFromProduct = async () => {
    if (!sourceBusiness) return
    setSelectedProductDetail(null)
    const profile = await getBusinessBySlug(sourceBusiness.slug)
    if (!profile) return
    setSelectedBusinessProfile(profile)
    setSelectedBusinessProducts(profile.products)
    setSelectedBusinessServices(profile.services)
    setSourceBusiness(null)
  }

  const sponsoredBusiness = initialBusinesses.find((b) => b.is_sponsored) ?? null
  const businessesWithoutSponsored = initialBusinesses.filter((b) => !b.is_sponsored)

  const sponsoredProduct = initialProducts.find((p) => p.is_sponsored) ?? null
  const productsWithoutSponsored = initialProducts.filter((p) => !p.is_sponsored)

  const sponsoredService = initialServices.find((s) => s.is_sponsored) ?? null
  const servicesWithoutSponsored = initialServices.filter((s) => !s.is_sponsored)

  const businessesFiltered = businessesWithoutSponsored.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()),
  )
  const productsFiltered = productsWithoutSponsored.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.short_description.toLowerCase().includes(search.toLowerCase()),
  )
  const servicesFiltered = servicesWithoutSponsored.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.short_description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">
            Discover businesses, products, and services in the community
          </p>
        </div>

        {/* Tab cards - same style as Education */}
        <div
          className={`grid grid-cols-1 gap-4 mb-8 ${showBusinessesTab ? "md:grid-cols-3" : "md:grid-cols-2"}`}
        >
          {showBusinessesTab && (
            <button
              onClick={() => setActiveTab("businesses")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                activeTab === "businesses" ? "text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
              style={
                activeTab === "businesses"
                  ? { backgroundColor: brandAccentColor, borderColor: brandAccentColor }
                  : undefined
              }
            >
              <Store className="w-8 h-8" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">Businesses</h3>
                <p className={activeTab === "businesses" ? "text-white/80" : "text-gray-500"}>
                  Browse local businesses
                </p>
              </div>
            </button>
          )}

          <button
            onClick={() => setActiveTab("services")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
              activeTab === "services" ? "text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
            style={
              activeTab === "services"
                ? { backgroundColor: brandAccentColor, borderColor: brandAccentColor }
                : undefined
            }
          >
            <Briefcase className="w-8 h-8" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">Services</h3>
              <p className={activeTab === "services" ? "text-white/80" : "text-gray-500"}>
                Explore services offered
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`p-6 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
              activeTab === "products" ? "text-white" : "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
            }`}
            style={
              activeTab === "products"
                ? { backgroundColor: brandAccentColor, borderColor: brandAccentColor }
                : undefined
            }
          >
            <Package className="w-8 h-8" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">Products</h3>
              <p className={activeTab === "products" ? "text-white/80" : "text-gray-500"}>
                Discover products
              </p>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Businesses tab */}
        {showBusinessesTab && activeTab === "businesses" && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  if (canAddBusiness) {
                    setEditingBusinessId(null)
                    setIsAddBusinessOpen(true)
                  } else {
                    setIsUpgradeModalOpen(true)
                  }
                }}
                className="text-white"
                style={{ backgroundColor: brandAccentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your Business
              </Button>
            </div>
            {sponsoredBusiness && (
              <div className="mb-8">
                <SponsoredSpotlightCard
                  item={sponsoredBusiness}
                  brandAccentColor={brandAccentColor}
                  onClick={() => handleOpenBusinessModal(sponsoredBusiness)}
                  label="Sponsored"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
            {businessesFiltered.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onClick={() => handleOpenBusinessModal(business)}
                brandAccentColor={brandAccentColor}
                isOwner={currentUserId != null && business.owner_id === currentUserId}
                onEdit={() => { setEditingBusinessId(business.id); setIsAddBusinessOpen(true) }}
                onDelete={() => setDeleteConfirm({ type: "business", id: business.id, name: business.name })}
              />
            ))}
            {businessesFiltered.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <p className="text-gray-500 text-lg">No businesses found</p>
              </div>
            )}
            </div>
          </>
        )}

        {/* Services tab */}
        {activeTab === "services" && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  if (canCreateService) {
                    setEditingServiceId(null)
                    setIsAddServiceOpen(true)
                  } else {
                    setIsUpgradeModalOpen(true)
                  }
                }}
                className="text-white"
                style={{ backgroundColor: brandAccentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>
            {sponsoredService && (
              <div className="mb-8">
                <SponsoredSpotlightCard
                  item={sponsoredService}
                  brandAccentColor={brandAccentColor}
                  onClick={() => setSelectedServiceDetail(sponsoredService)}
                  label="Sponsored"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
            {servicesFiltered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedServiceDetail(service)}
                brandAccentColor={brandAccentColor}
                isOwner={currentUserId != null && service.owner_id === currentUserId}
                onEdit={() => { setEditingServiceId(service.id); setIsAddServiceOpen(true) }}
                onDelete={() => setDeleteConfirm({ type: "service", id: service.id, name: service.name })}
              />
            ))}
            {servicesFiltered.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <p className="text-gray-500 text-lg">No services found</p>
              </div>
            )}
            </div>
          </>
        )}

        {/* Products tab */}
        {activeTab === "products" && (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  if (canCreateProduct) {
                    setEditingProductId(null)
                    setIsAddProductOpen(true)
                  } else {
                    setIsUpgradeModalOpen(true)
                  }
                }}
                className="text-white"
                style={{ backgroundColor: brandAccentColor }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            {sponsoredProduct && (
              <div className="mb-8">
                <SponsoredSpotlightCard
                  item={sponsoredProduct}
                  brandAccentColor={brandAccentColor}
                  onClick={() => setSelectedProductDetail(sponsoredProduct)}
                  label="Sponsored"
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
            {productsFiltered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProductDetail(product)}
                brandAccentColor={brandAccentColor}
                isOwner={currentUserId != null && product.owner_id === currentUserId}
                onEdit={() => { setEditingProductId(product.id); setIsAddProductOpen(true) }}
                onDelete={() => setDeleteConfirm({ type: "product", id: product.id, name: product.name })}
              />
            ))}
            {productsFiltered.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                <p className="text-gray-500 text-lg">No products found</p>
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddBusinessModal
        open={isAddBusinessOpen}
        onClose={() => { setEditingBusinessId(null); setIsAddBusinessOpen(false) }}
        onSuccess={refreshData}
        expertTags={expertTags}
        editingBusinessId={editingBusinessId}
      />
      <AddServiceModal
        open={isAddServiceOpen}
        onClose={() => { setEditingServiceId(null); setIsAddServiceOpen(false) }}
        onSuccess={refreshData}
        myBusinesses={myBusinesses}
        serviceTags={serviceTags}
        editingServiceId={editingServiceId}
      />
      <AddProductModal
        open={isAddProductOpen}
        onClose={() => { setEditingProductId(null); setIsAddProductOpen(false) }}
        onSuccess={refreshData}
        myBusinesses={myBusinesses}
        productTags={serviceTags}
        editingProductId={editingProductId}
      />
      <BusinessProfileModal
        business={selectedBusiness}
        onClose={handleCloseBusinessModal}
        onSelectService={handleOpenServiceFromBusiness}
        onSelectProduct={handleOpenProductFromBusiness}
      />
      <ProductModal
        product={selectedProductDetail}
        onClose={() => { setSelectedProductDetail(null); setSourceBusiness(null) }}
        sourceBusiness={sourceBusiness}
        onBackToBusiness={handleBackToBusinessFromProduct}
        brandAccentColor={brandAccentColor}
      />
      <ServiceModal
        service={selectedServiceDetail}
        onClose={() => { setSelectedServiceDetail(null); setSourceBusiness(null) }}
        sourceBusiness={sourceBusiness}
        onBackToBusiness={handleBackToBusinessFromService}
        brandAccentColor={brandAccentColor}
      />

      <UpgradeRequiredModal open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} context="content" upgradeLink={upgradeLink} />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === "business" ? "Business" : deleteConfirm?.type === "service" ? "Service" : "Product"}?
            </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteConfirm) return
                if (deleteConfirm.type === "business") {
                  const r = await deleteBusiness(deleteConfirm.id)
                  if (r.success) { setDeleteConfirm(null); refreshData() } else alert(r.error)
                } else if (deleteConfirm.type === "service") {
                  const r = await deleteService(deleteConfirm.id)
                  if (r.success) { setDeleteConfirm(null); refreshData() } else alert(r.error)
                } else {
                  const r = await deleteProduct(deleteConfirm.id)
                  if (r.success) { setDeleteConfirm(null); refreshData() } else alert(r.error)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
