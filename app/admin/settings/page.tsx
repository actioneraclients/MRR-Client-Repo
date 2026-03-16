"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { updateSiteSettings, getDashboardDropdownData } from "./actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

/**
 * IMPORTANT: This file is aligned to your actual `site_settings` table schema:
 * - brand_primary_color (text)
 * - brand_accent_color (text)
 * - brand_background_color (text)
 * - brand_logo_url (text)
 * - member_navigation (jsonb NOT NULL default [])
 * - site_title (text)
 * - meta_description (text)
 * - favicon_url (text)
 * - social_image_url (text)
 * - site_domain (text)
 * - upgrade_link (text)
 * - billing_link (text)
 * - created_at (timestamptz)
 * - updated_at (timestamptz)
 * - dashboard_settings (jsonb)
 *
 * The previous version used non-existent columns like:
 * - site_name, logo_url, primary_color, accent_color, meta_title, og_image_url, nav_visibility
 * which caused "schema cache" errors.
 */

interface NavigationItem {
  id: string
  label: string
  visible: boolean
  order: number
  locked?: boolean
  config?: { showBusinesses?: boolean }
  /** Internal links default to type "internal". External links use type "external" with url. */
  type?: "internal" | "external"
  url?: string
  children?: Array<{ id: string; label: string; order?: number; visible?: boolean }>
}

type WeeklyItem = {
  date: string
  time: string
  title: string
  description: string
  button_url: string
}

type FeaturedSections = {
  groups: string[]
  courses: string[]
  masterclasses: string[]
  experts: string[]
  content: string[]
  businesses: string[]
  products: string[]
  services: string[]
  tools: string[]
}

type SpotlightSettings = {
  media_url: string
  headline: string
  text: string
  button_url: string
}

interface DashboardSettings {
  creator_headline: string
  creator_message: string
  creator_video_url: string
  header_image_url: string
  featured_tools: string[]
  featured_groups: string[]
  featured_content: string[]
  featured_experts: string[]
  featured_business: string | null
  weekly_items: WeeklyItem[]
  featured_sections: FeaturedSections
  spotlight: SpotlightSettings | null
}

const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", visible: true, order: 1, locked: true },
  { id: "courses", label: "Courses", visible: true, order: 2 },
  { id: "masterclasses", label: "Masterclasses", visible: true, order: 3 },
  {
    id: "tools",
    label: "Tools",
    visible: true,
    order: 4,
  },
  {
    id: "community",
    label: "Community",
    visible: true,
    order: 5,
    children: [
      { id: "community_feed", label: "Member Feed", order: 1, visible: true },
      { id: "community_groups", label: "Groups", order: 2, visible: true },
      { id: "community_directory", label: "Directory", order: 3, visible: true },
      { id: "community_events", label: "Events", order: 4, visible: true },
    ],
  },
  { id: "productsservices", label: "Products & Services", visible: true, order: 6 },
  { id: "education", label: "Education", visible: true, order: 7 },
  { id: "support", label: "Support", visible: true, order: 8 },
]

interface SiteSettingsRowFromDb {
  id: number
  brand_primary_color: string | null
  brand_accent_color: string | null
  brand_background_color: string | null
  brand_logo_url: string | null
  member_navigation: unknown[] | null
  site_title: string | null
  meta_description: string | null
  favicon_url: string | null
  social_image_url: string | null
  site_domain: string | null
  upgrade_link: string | null
  billing_link: string | null
  // Add types for new columns
  site_terms_url?: string | null
  site_privacy_url?: string | null
  created_at: string | null
  updated_at: string | null
  dashboard_settings: DashboardSettings | null
}

const SINGLETON_ID = 1

const DEFAULT_WEEKLY_ITEM: WeeklyItem = {
  date: "",
  time: "",
  title: "",
  description: "",
  button_url: "",
}

const DEFAULT_FEATURED_SECTIONS: FeaturedSections = {
  groups: [],
  courses: [],
  masterclasses: [],
  experts: [],
  content: [],
  businesses: [],
  products: [],
  services: [],
  tools: [],
}

const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  creator_headline: "",
  creator_message: "",
  creator_video_url: "",
  header_image_url: "",
  featured_tools: [],
  featured_groups: [],
  featured_content: [],
  featured_experts: [],
  featured_business: null,
  weekly_items: [],
  featured_sections: DEFAULT_FEATURED_SECTIONS,
  spotlight: null,
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("branding")
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingHeaderImage, setIsUploadingHeaderImage] = useState(false)
  const headerImageInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Branding state (UI variables; mapped to DB columns on save)
  const [siteName, setSiteName] = useState("My Membership Site") // maps to site_title
  const [logoUrl, setLogoUrl] = useState("") // maps to brand_logo_url
  const [primaryColor, setPrimaryColor] = useState("#3B82F6") // maps to brand_primary_color
  const [accentColor, setAccentColor] = useState("#10B981") // maps to brand_accent_color
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF") // maps to brand_background_color

  // SEO tab state (UI variables; mapped to DB columns on save)
  // siteName input in SEO tab maps to site_title
  const [metaTitle, setMetaTitle] = useState("") // kept only to avoid refactor; NOT saved (site_title is the title)
  const [metaDescription, setMetaDescription] = useState("") // maps to meta_description
  const [faviconUrl, setFaviconUrl] = useState("") // maps to favicon_url
  const [ogImageUrl, setOgImageUrl] = useState("") // maps to social_image_url

  const [siteDomain, setSiteDomain] = useState("")
  const [upgradeLink, setUpgradeLink] = useState("")
  const [billingLink, setBillingLink] = useState("")
  const [siteTermsUrl, setSiteTermsUrl] = useState("")
  const [sitePrivacyUrl, setSitePrivacyUrl] = useState("")
  const [enableGoogleAuth, setEnableGoogleAuth] = useState(false)

  const [toolOptions, setToolOptions] = useState<{ id: string; name: string }[]>([])
  const [groupOptions, setGroupOptions] = useState<{ id: string; name: string }[]>([])
  const [contentOptions, setContentOptions] = useState<
    { id: string; title: string; content_type: string; image_url: string | null }[]
  >([])
  const [expertOptions, setExpertOptions] = useState<{ id: string; name: string; title: string | null }[]>([])
  const [businessOptions, setBusinessOptions] = useState<{ id: string; name: string }[]>([])
  const [courseOptions, setCourseOptions] = useState<{ id: string; title: string }[]>([])
  const [masterclassOptions, setMasterclassOptions] = useState<{ id: string; title: string }[]>([])
  const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([])
  const [serviceOptions, setServiceOptions] = useState<{ id: string; name: string }[]>([])
  const [isLoadingDropdownData, setIsLoadingDropdownData] = useState(false)

  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS)

  const supabase = getSupabaseBrowserClient()

  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAV_ITEMS)

  // External link modal state
  const [showExternalModal, setShowExternalModal] = useState(false)
  const [editingExternalId, setEditingExternalId] = useState<string | null>(null)
  const [externalLabel, setExternalLabel] = useState("")
  const [externalUrl, setExternalUrl] = useState("")

  function dedupeExternalLinks(items: NavigationItem[]): NavigationItem[] {
    const seen = new Set<string>()
    return items.filter((item) => {
      if (item.type !== "external") return true
      if (!item.url) return false

      const key = item.url.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const fetchDropdownData = async () => {
    setIsLoadingDropdownData(true)
    const result = await getDashboardDropdownData()
    if (result.success && result.data) {
      setToolOptions(result.data.tools)
      setGroupOptions(result.data.groups)
      setContentOptions(result.data.contentItems)
      setExpertOptions(result.data.experts)
      setBusinessOptions(result.data.businesses || [])
      setCourseOptions(result.data.courses || [])
      setMasterclassOptions(result.data.masterclasses || [])
      setProductOptions(result.data.products || [])
      setServiceOptions(result.data.services || [])
      const ds = result.data!.dashboardSettings
      setDashboardSettings((prev) => ({
        ...prev,
        creator_headline: typeof ds.creator_headline === "string" ? ds.creator_headline : "",
        creator_message: typeof ds.creator_message === "string" ? ds.creator_message : "",
        creator_video_url: typeof ds.creator_video_url === "string" ? ds.creator_video_url : "",
        header_image_url: ds.header_image_url || "",
        featured_tools: ds.featured_tools || [],
        featured_groups: ds.featured_groups || [],
        featured_content: ds.featured_content || [],
        featured_experts: ds.featured_experts || [],
        featured_business: ds.featured_business ?? null,
        weekly_items: Array.isArray(ds.weekly_items) ? ds.weekly_items : [],
        featured_sections: ds.featured_sections && typeof ds.featured_sections === "object"
          ? { ...DEFAULT_FEATURED_SECTIONS, ...ds.featured_sections }
          : DEFAULT_FEATURED_SECTIONS,
        spotlight: ds.spotlight && typeof ds.spotlight === "object" ? ds.spotlight : null,
      }))
    }
    setIsLoadingDropdownData(false)
  }

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true)

      const { data, error } = await supabase.from("site_settings").select("*").eq("id", SINGLETON_ID).single()

      if (error) {
        // If fetch fails, still render UI with defaults
        // (No toast here; avoids spam on initial load if auth/session is warming)
        setIsLoading(false)
        return
      }

      const row = data as SiteSettingsRowFromDb

      // ✅ Correct DB → UI mapping
      setLogoUrl(row.brand_logo_url || "")
      setPrimaryColor(row.brand_primary_color || "#3B82F6")
      setAccentColor(row.brand_accent_color || "#10B981")
      setBackgroundColor(row.brand_background_color || "#FFFFFF")

      setSiteName(row.site_title || "My Membership Site")
      setMetaDescription(row.meta_description || "")
      setFaviconUrl(row.favicon_url || "")
      setOgImageUrl(row.social_image_url || "")

      setSiteDomain(row.site_domain || "")
      setUpgradeLink(row.upgrade_link || "")
      setBillingLink(row.billing_link || "")
      setSiteTermsUrl((row as any).site_terms_url || "")
      setSitePrivacyUrl((row as any).site_privacy_url || "")
      setEnableGoogleAuth((row as any).enable_google_auth ?? false)

      if (row.dashboard_settings) {
        const ds = row.dashboard_settings as Record<string, unknown>
        const sections = ds.featured_sections && typeof ds.featured_sections === "object"
          ? { ...DEFAULT_FEATURED_SECTIONS, ...(ds.featured_sections as Record<string, string[]>) }
          : DEFAULT_FEATURED_SECTIONS
        setDashboardSettings({
          creator_headline: typeof ds.creator_headline === "string" ? ds.creator_headline : "",
          creator_message: typeof ds.creator_message === "string" ? ds.creator_message : "",
          creator_video_url: typeof ds.creator_video_url === "string" ? ds.creator_video_url : "",
          header_image_url: (ds.header_image_url as string) || "",
          featured_tools: Array.isArray(ds.featured_tools) ? ds.featured_tools : [],
          featured_groups: Array.isArray(ds.featured_groups) ? ds.featured_groups : [],
          featured_content: Array.isArray(ds.featured_content) ? ds.featured_content : [],
          featured_experts: Array.isArray(ds.featured_experts) ? ds.featured_experts : [],
          featured_business: (ds.featured_business as string | null) ?? null,
          weekly_items: Array.isArray(ds.weekly_items) ? ds.weekly_items as WeeklyItem[] : [],
          featured_sections: sections,
          spotlight: ds.spotlight && typeof ds.spotlight === "object" ? ds.spotlight as SpotlightSettings : null,
        })
      }

      // If empty, invalid, or using old format, seed with defaults
      const mn = row.member_navigation as unknown
      let loadedNavItems: NavigationItem[] = []

      if (Array.isArray(mn) && mn.length > 0) {
        const internalItems = (mn as any[]).filter(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            typeof item.id === "string" &&
            typeof item.label === "string" &&
            typeof item.visible === "boolean" &&
            typeof item.order === "number",
        ) as NavigationItem[]

        const externalItems = (mn as any[]).filter(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            item.type === "external" &&
            typeof item.url === "string" &&
            item.url &&
            typeof item.label === "string",
        ).map((item: any) => ({
          id: item.id ?? `ext-${item.url}`,
          label: item.label,
          visible: item.visible !== false,
          order: typeof item.order === "number" ? item.order : 999,
          type: "external" as const,
          url: item.url,
        })) as NavigationItem[]

        loadedNavItems = [
          ...internalItems.sort((a, b) => a.order - b.order),
          ...externalItems.sort((a, b) => a.order - b.order),
        ]
      }

      // If no valid internal items found, use defaults (preserve external)
      const hasInternal = loadedNavItems.some((item) => item.type !== "external")
      if (!hasInternal) {
        const externalOnly = loadedNavItems.filter((item) => item.type === "external")
        loadedNavItems = [...DEFAULT_NAV_ITEMS, ...externalOnly]
      }

      // Backward-compatibility: migrate "course" → "courses"
      loadedNavItems = loadedNavItems.map((item) => {
        if (item.id === "course") {
          return {
            ...item,
            id: "courses",
            label: (item as { label?: string }).label || "Courses",
          }
        }
        return item
      })

      // Ensure "masterclasses" exists
      const hasMasterclasses = loadedNavItems.some((item) => item.id === "masterclasses")
      if (!hasMasterclasses) {
        const maxOrder =
          loadedNavItems.length > 0
            ? Math.max(...loadedNavItems.map((item) => item.order))
            : 0
        loadedNavItems = [
          ...loadedNavItems,
          {
            id: "masterclasses",
            label: "Masterclasses",
            visible: true,
            order: maxOrder + 1,
          },
        ]
      }

      // Ensure no duplicate IDs
      const seenIds = new Set<string>()
      loadedNavItems = loadedNavItems.filter((item) => {
        if (seenIds.has(item.id)) return false
        seenIds.add(item.id)
        return true
      })

      // Backward-compatible merge: ensure productsservices exists without mutating DB
      const hasProductsservices = loadedNavItems.some((item) => item.id === "productsservices")
      if (!hasProductsservices) {
        const maxOrder = loadedNavItems.length > 0
          ? Math.max(...loadedNavItems.map((item) => item.order))
          : 0
        loadedNavItems = [
          ...loadedNavItems,
          {
            id: "productsservices",
            label: "Products & Services",
            visible: true,
            locked: false,
            order: maxOrder + 1,
            config: { showBusinesses: true },
          },
        ]
      }

      // Normalize children for community: inject defaults if missing (soft migration)
      loadedNavItems = loadedNavItems.map((item) => {
        if (item.id === "community") {
          const defaultChildren = [
            { id: "community_feed", label: "Member Feed", order: 1, visible: true },
            { id: "community_groups", label: "Groups", order: 2, visible: true },
            { id: "community_directory", label: "Directory", order: 3, visible: true },
            { id: "community_events", label: "Events", order: 4, visible: true },
          ]

          const existingChildren = Array.isArray(item.children) ? item.children : []

          const mergedChildren = defaultChildren.map((def) => {
            const existing = existingChildren.find((c: { id?: string }) => c.id === def.id)
            return {
              ...def,
              ...existing,
              visible: existing?.visible !== false,
              order: typeof existing?.order === "number" ? existing.order : def.order,
            }
          })

          return {
            ...item,
            children: mergedChildren.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
          }
        }

        return item
      })

      loadedNavItems = dedupeExternalLinks(loadedNavItems)
      setNavItems(loadedNavItems)

      setIsLoading(false)
    }

    fetchSettings()
    fetchDropdownData()
  }, [supabase])

  const showToastNotification = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  /**
   * ✅ BRANDING SAVE
   * Uses server action and correct DB columns.
   */
  const saveBrandingSettings = async () => {
    setIsSaving(true)

    const payload = {
      // ✅ correct columns
      brand_logo_url: logoUrl,
      brand_primary_color: primaryColor,
      brand_accent_color: accentColor,
      brand_background_color: backgroundColor,
    }

    const { success, error } = await updateSiteSettings(payload)

    if (error || !success) {
      showToastNotification(error || "Failed to save branding settings", "error")
    } else {
      showToastNotification("Branding settings saved successfully!")
    }
    setIsSaving(false)
  }

  /**
   * ✅ NAVIGATION SAVE
   * There is no `nav_visibility` column in your table.
   * We store this visibility object inside member_navigation as a typed wrapper.
   */
  const saveNavigationSettings = async () => {
    setIsSaving(true)

    const { success, error } = await updateSiteSettings({
      member_navigation: dedupeExternalLinks(navItems),
    })

    if (error || !success) {
      showToastNotification(error || "Failed to save navigation settings", "error")
    } else {
      showToastNotification("Navigation settings saved successfully!")
    }
    setIsSaving(false)
  }

  /**
   * ✅ SEO SAVE
   * Uses server action and correct DB columns:
   * - site_title
   * - meta_description
   * - favicon_url
   * - social_image_url
   */
  const saveSeoSettings = async () => {
    setIsSaving(true)

    const { success, error } = await updateSiteSettings({
      site_title: siteName,
      meta_description: metaDescription,
      favicon_url: faviconUrl,
      social_image_url: ogImageUrl,
    })

    if (error || !success) {
      showToastNotification(error || "Failed to save SEO/Social settings", "error")
    } else {
      showToastNotification("SEO/Social settings saved successfully!")
    }
    setIsSaving(false)
  }

  const saveDomainSettings = async () => {
    setIsSaving(true)

    const { success, error } = await updateSiteSettings({
      site_domain: siteDomain,
      upgrade_link: upgradeLink,
      billing_link: billingLink,
      site_terms_url: siteTermsUrl,
      site_privacy_url: sitePrivacyUrl,
    })

    if (!success) {
      showToastNotification(error || "Failed to save domain settings", "error")
    } else {
      showToastNotification("Domain & links saved successfully!")
    }

    setIsSaving(false)
  }

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      showToastNotification("Please upload a JPG, PNG, or WebP image.", "error")
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showToastNotification("Image must be less than 5MB.", "error")
      return
    }

    setIsUploadingHeaderImage(true)

    try {
      const timestamp = Date.now()
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `dashboard/dashboard-header-${timestamp}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("dashboard-assets")
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage.from("dashboard-assets").getPublicUrl(fileName)

      const publicUrl = publicUrlData.publicUrl

      setDashboardSettings((prev) => ({
        ...prev,
        header_image_url: publicUrl,
      }))

      showToastNotification("Header image uploaded successfully!")
    } catch (err: any) {
      showToastNotification(err.message || "Failed to upload image.", "error")
    } finally {
      setIsUploadingHeaderImage(false)
      // Reset file input
      if (headerImageInputRef.current) {
        headerImageInputRef.current.value = ""
      }
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      showToastNotification("Please upload a JPG, PNG, SVG or WebP image.", "error")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      showToastNotification("Logo must be under 5MB.", "error")
      return
    }

    setIsUploadingLogo(true)

    try {
      const timestamp = Date.now()
      const ext = file.name.split(".").pop()?.toLowerCase() || "png"
      const fileName = `branding/logo-${timestamp}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("dashboard-assets")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("dashboard-assets")
        .getPublicUrl(fileName)

      setLogoUrl(data.publicUrl)

      showToastNotification("Logo uploaded successfully!")
    } catch (err: any) {
      showToastNotification(err.message || "Upload failed.", "error")
    } finally {
      setIsUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  const saveDashboardSettings = async () => {
    setIsSaving(true)

    const { success, error } = await updateSiteSettings({
      dashboard_settings: {
        creator_headline: dashboardSettings.creator_headline ?? "",
        creator_message: dashboardSettings.creator_message ?? "",
        creator_video_url: dashboardSettings.creator_video_url?.trim() || null,
        header_image_url: dashboardSettings.header_image_url || null,
        featured_tools: dashboardSettings.featured_tools,
        featured_groups: dashboardSettings.featured_groups,
        featured_content: dashboardSettings.featured_content,
        featured_experts: dashboardSettings.featured_experts,
        featured_business: dashboardSettings.featured_business ?? null,
        weekly_items: dashboardSettings.weekly_items,
        featured_sections: dashboardSettings.featured_sections,
        spotlight: dashboardSettings.spotlight,
      },
    })

    if (!success) {
      showToastNotification(error || "Failed to save dashboard settings", "error")
    } else {
      showToastNotification("Dashboard settings saved successfully!")
    }

    setIsSaving(false)
  }

  const saveAuthenticationSettings = async () => {
    setIsSaving(true)

    const { success, error } = await updateSiteSettings({
      enable_google_auth: enableGoogleAuth,
    })

    if (!success) {
      showToastNotification(error || "Failed to save authentication settings", "error")
    } else {
      showToastNotification("Authentication settings saved successfully!")
    }

    setIsSaving(false)
  }

  const updateNavItemLabel = (itemId: string, newLabel: string) => {
    setNavItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, label: newLabel } : item)))
  }

  const toggleNavItem = (itemId: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.id === itemId && !item.locked && item.type !== "external"
          ? { ...item, visible: !item.visible }
          : item,
      ),
    )
  }

  const setProductsservicesShowBusinesses = (showBusinesses: boolean) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.id === "productsservices"
          ? { ...item, config: { ...item.config, showBusinesses } }
          : item,
      ),
    )
  }

  const moveNavItem = (itemId: string, direction: "up" | "down") => {
    setNavItems((prev) => {
      const internalOnly = prev.filter((item) => item.type !== "external")
      const sorted = [...internalOnly].sort((a, b) => a.order - b.order)
      const currentIndex = sorted.findIndex((item) => item.id === itemId)

      if (currentIndex === -1) return prev

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= sorted.length) return prev

      if (sorted[targetIndex].locked || sorted[currentIndex].locked) return prev

      const externalItems = prev.filter((item) => item.type === "external")
      const newInternal = sorted.map((item, index) => {
        if (index === currentIndex) {
          return { ...item, order: sorted[targetIndex].order }
        }
        if (index === targetIndex) {
          return { ...item, order: sorted[currentIndex].order }
        }
        return item
      })
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: index + 1 }))

      const maxInternalOrder = newInternal.length > 0 ? Math.max(...newInternal.map((i) => i.order)) : 0
      const externalWithOrder = externalItems
        .sort((a, b) => a.order - b.order)
        .map((item, index) => ({ ...item, order: maxInternalOrder + index + 1 }))

      return [...newInternal, ...externalWithOrder]
    })
  }

  const updateChildNavItemLabel = (parentId: string, childId: string, newLabel: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.id === parentId && item.children
          ? {
              ...item,
              children: item.children.map((child) =>
                child.id === childId ? { ...child, label: newLabel } : child,
              ),
            }
          : item,
      ),
    )
  }

  const toggleChildNavItem = (parentId: string, childId: string) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.id === parentId && item.children
          ? {
              ...item,
              children: item.children.map((child) =>
                child.id === childId ? { ...child, visible: !child.visible } : child,
              ),
            }
          : item,
      ),
    )
  }

  const moveChildNavItem = (parentId: string, childId: string, direction: "up" | "down") => {
    setNavItems((prev) =>
      prev.map((item) => {
        if (item.id !== parentId || !item.children) return item

        const sorted = [...item.children].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        const index = sorted.findIndex((c) => c.id === childId)
        if (index === -1) return item

        const targetIndex = direction === "up" ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= sorted.length) return item

        const temp = sorted[index]
        sorted[index] = sorted[targetIndex]
        sorted[targetIndex] = temp

        const reOrdered = sorted.map((child, i) => ({
          ...child,
          order: i + 1,
        }))

        return { ...item, children: reOrdered }
      }),
    )
  }

  const openAddExternalModal = () => {
    setEditingExternalId(null)
    setExternalLabel("")
    setExternalUrl("")
    setShowExternalModal(true)
  }

  const openEditExternalModal = (item: NavigationItem) => {
    if (item.type !== "external" || !item.url) return
    setEditingExternalId(item.id)
    setExternalLabel(item.label)
    setExternalUrl(item.url)
    setShowExternalModal(true)
  }

  const closeExternalModal = () => {
    setShowExternalModal(false)
    setEditingExternalId(null)
    setExternalLabel("")
    setExternalUrl("")
  }

  const saveExternalLink = () => {
    const trimLabel = externalLabel.trim()
    const trimUrl = externalUrl.trim()
    if (!trimLabel || !trimUrl) return

    if (editingExternalId) {
      setNavItems((prev) =>
        prev.map((item) =>
          item.id === editingExternalId && item.type === "external"
            ? { ...item, label: trimLabel, url: trimUrl }
            : item,
        ),
      )
    } else {
      const maxOrder =
        navItems.length > 0 ? Math.max(...navItems.map((i) => i.order)) : 0
      const newItem: NavigationItem = {
        id: `external-${crypto.randomUUID()}`,
        label: trimLabel,
        order: maxOrder + 1,
        visible: true,
        type: "external",
        url: trimUrl,
      }
      setNavItems((prev) => [...prev, newItem])
    }
    closeExternalModal()
  }

  const deleteExternalLink = (itemId: string) => {
    setNavItems((prev) => prev.filter((item) => !(item.id === itemId && item.type === "external")))
  }

  const tabs = [
    { id: "branding", label: "Branding", icon: "palette" },
    { id: "navigation", label: "Navigation", icon: "menu" },
    { id: "seo", label: "SEO/Social", icon: "search" },
    { id: "domain", label: "Domain / Links", icon: "link" },
    { id: "dashboard", label: "Dashboard", icon: "layout" },
    { id: "authentication", label: "Authentication", icon: "shield" },
  ]

  if (isLoading || isLoadingDropdownData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Settings</h1>
          <p className="text-gray-600">Customize your platform's appearance, behavior, and brand elements.</p>
        </div>

        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    activeTab === tab.id
                      ? "py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600 whitespace-nowrap focus:outline-none focus:text-blue-800 focus:border-blue-800"
                      : "py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap focus:outline-none focus:text-gray-700 focus:border-gray-300"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>
          {activeTab === "branding" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Color Palette</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Color
                        </label>
                        <p className="text-xs text-gray-500">Used for buttons, links, key accents</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="primary-color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor.toUpperCase()}
                          onChange={(e) => {
                            const hex = e.target.value
                            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                              setPrimaryColor(hex)
                            }
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label htmlFor="accent-color" className="block text-sm font-medium text-gray-700 mb-1">
                          Accent Color
                        </label>
                        <p className="text-xs text-gray-500">Secondary color for highlights and emphasis</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="accent-color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={accentColor.toUpperCase()}
                          onChange={(e) => {
                            const hex = e.target.value
                            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                              setAccentColor(hex)
                            }
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label htmlFor="background-color" className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <p className="text-xs text-gray-500">Main background color for the site</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="background-color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={backgroundColor.toUpperCase()}
                          onChange={(e) => {
                            const hex = e.target.value
                            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                              setBackgroundColor(hex)
                            }
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-3">Color Preview</p>
                    <div className="flex space-x-3">
                      <div
                        className="w-16 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: primaryColor }}
                      ></div>
                      <div
                        className="w-16 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: accentColor }}
                      ></div>
                      <div
                        className="w-16 h-8 rounded-lg border border-gray-200"
                        style={{ backgroundColor: backgroundColor }}
                      ></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Brand Logo</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="logo-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Logo URL
                      </label>
                      <input
                        type="url"
                        id="logo-url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Used as the site's primary logo throughout the platform.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2"
                      >
                        {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                      </button>
                      <p className="mt-2 text-sm text-gray-500">
                        Recommended: transparent PNG or SVG. Max size 5MB.
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-3">Logo Preview</p>
                      <div className="w-full max-h-14 flex items-center">
                        {logoUrl ? (
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt="Brand logo preview"
                            className="max-w-[200px] max-h-14 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                              e.currentTarget.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-32 h-14 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 ${logoUrl ? "hidden" : ""}`}
                        >
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveBrandingSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Branding Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "navigation" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Side Menu Labels</h3>
                  <div className="space-y-6">
                    {[...navItems]
                      .filter((item) => (item.type ?? "internal") !== "external")
                      .sort((a, b) => a.order - b.order)
                      .map((item, index, sortedArray) => (
                        <div key={item.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex flex-col gap-1 pt-7">
                              <button
                                type="button"
                                onClick={() => moveNavItem(item.id, "up")}
                                disabled={item.locked || index === 0 || sortedArray[index - 1]?.locked}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                ↑ Up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveNavItem(item.id, "down")}
                                disabled={item.locked || index === sortedArray.length - 1}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                ↓ Down
                              </button>
                            </div>
                            <div className="flex-1">
                              <label htmlFor={`nav-${item.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                                {item.id.charAt(0).toUpperCase() + item.id.slice(1)} Label
                              </label>
                              <input
                                type="text"
                                id={`nav-${item.id}`}
                                value={item.label}
                                onChange={(e) => updateNavItemLabel(item.id, e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div className="flex flex-col items-end pt-7">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Visible in member sidebar</span>
                                <button
                                  type="button"
                                  onClick={() => toggleNavItem(item.id)}
                                  disabled={item.locked}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    item.locked
                                      ? "bg-blue-400 cursor-not-allowed opacity-60"
                                      : item.visible
                                        ? "bg-blue-600"
                                        : "bg-gray-300"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      item.visible ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                              {item.locked && <p className="text-xs text-gray-500 mt-1">Dashboard is always visible</p>}
                              {item.id === "productsservices" && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600">Show Businesses tab</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setProductsservicesShowBusinesses(
                                          (item.config?.showBusinesses !== false) ? false : true,
                                        )
                                      }
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        (item.config?.showBusinesses !== false) ? "bg-blue-600" : "bg-gray-300"
                                      }`}
                                    >
                                      <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                          (item.config?.showBusinesses !== false) ? "translate-x-6" : "translate-x-1"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    When off, only Products and Services will be shown.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {item.children && item.children.length > 0 && (
                            <div className="mt-4 ml-12 space-y-4">
                              {[...item.children]
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((child, childIndex, childArray) => (
                                  <div key={child.id} className="flex items-start justify-between gap-6">
                                    <div className="flex flex-col gap-1 pt-7">
                                      <button
                                        type="button"
                                        onClick={() => moveChildNavItem(item.id, child.id, "up")}
                                        disabled={childIndex === 0}
                                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveChildNavItem(item.id, child.id, "down")}
                                        disabled={childIndex === childArray.length - 1}
                                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                                      >
                                        ↓
                                      </button>
                                    </div>
                                    <div className="flex-1">
                                      <label className="block text-sm font-medium text-gray-600 mb-2">
                                        {child.label} (Child Label)
                                      </label>
                                      <input
                                        type="text"
                                        value={child.label}
                                        onChange={(e) =>
                                          updateChildNavItemLabel(item.id, child.id, e.target.value)
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                      />
                                    </div>
                                    <div className="flex flex-col items-end pt-7">
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600">Visible</span>
                                        <button
                                          type="button"
                                          onClick={() => toggleChildNavItem(item.id, child.id)}
                                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            child.visible ? "bg-blue-600" : "bg-gray-300"
                                          }`}
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              child.visible ? "translate-x-6" : "translate-x-1"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    These labels update the left sidebar menu shown to members.
                  </p>
                </section>

                <section className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Links</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    These links appear at the bottom of the member sidebar and open in a new tab.
                  </p>
                  <button
                    type="button"
                    onClick={openAddExternalModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    + Add Link
                  </button>
                  <div className="mt-4 space-y-3">
                    {navItems
                      .filter((item) => item.type === "external")
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{item.label}</div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">{item.url}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditExternalModal(item)}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteExternalLink(item.id)}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </section>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveNavigationSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Navigation Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO & Social Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="site-title" className="block text-sm font-medium text-gray-700 mb-2">
                        Site Title
                      </label>
                      <input
                        type="text"
                        id="site-title"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="MRR Platform — Build, Launch, Grow"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="meta-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        id="meta-description"
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Enter a compelling description of your platform..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      ></textarea>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500">Aim for 140–160 characters.</p>
                        <span
                          className={metaDescription.length > 160 ? "text-sm text-red-500" : "text-sm text-gray-500"}
                        >
                          {metaDescription.length} characters
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="favicon-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Favicon URL
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="url"
                          id="favicon-url"
                          value={faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          placeholder="https://example.com/favicon.png"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="w-8 h-8 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                          {faviconUrl ? (
                            <img
                              src={faviconUrl || "/placeholder.svg"}
                              alt="Favicon"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="og-image-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Social Media Preview Image URL
                      </label>
                      <input
                        type="url"
                        id="og-image-url"
                        value={ogImageUrl}
                        onChange={(e) => setOgImageUrl(e.target.value)}
                        placeholder="https://example.com/social-image.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="mt-4 w-full max-w-md h-32 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {ogImageUrl ? (
                          <img
                            src={ogImageUrl || "/placeholder.svg"}
                            alt="Social Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveSeoSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save SEO/Social Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "domain" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Domain & Links Configuration</h3>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="site-domain" className="block text-sm font-medium text-gray-700 mb-2">
                        Site Domain
                      </label>
                      <input
                        type="url"
                        id="site-domain"
                        value={siteDomain}
                        onChange={(e) => setSiteDomain(e.target.value)}
                        placeholder="https://yourdomain.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">Primary domain where this platform is hosted.</p>
                    </div>

                    <div>
                      <label htmlFor="upgrade-link" className="block text-sm font-medium text-gray-700 mb-2">
                        Upgrade Link
                      </label>
                      <input
                        type="url"
                        id="upgrade-link"
                        value={upgradeLink}
                        onChange={(e) => setUpgradeLink(e.target.value)}
                        placeholder="https://yourdomain.com/upgrade"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">Used for upgrade prompts inside the app.</p>
                    </div>

                    <div>
                      <label htmlFor="billing-link" className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Link
                      </label>
                      <input
                        type="url"
                        id="billing-link"
                        value={billingLink}
                        onChange={(e) => setBillingLink(e.target.value)}
                        placeholder="https://yourdomain.com/billing"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">Used for billing and subscription management links.</p>
                    </div>

                    <div>
                      <label htmlFor="site-terms-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Terms of Service URL
                      </label>
                      <input
                        type="url"
                        id="site-terms-url"
                        value={siteTermsUrl}
                        onChange={(e) => setSiteTermsUrl(e.target.value)}
                        placeholder="https://example.com/terms"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">Link to your Terms of Service page.</p>
                    </div>

                    <div>
                      <label htmlFor="site-privacy-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Privacy Policy URL
                      </label>
                      <input
                        type="url"
                        id="site-privacy-url"
                        value={sitePrivacyUrl}
                        onChange={(e) => setSitePrivacyUrl(e.target.value)}
                        placeholder="https://example.com/privacy"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-2 text-sm text-gray-500">Link to your Privacy Policy page.</p>
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveDomainSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Domain & Links"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                {/* Section 1: Creator Message */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Creator Message</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="creator-headline" className="block text-sm font-medium text-gray-700 mb-2">
                        Creator Headline
                      </label>
                      <input
                        type="text"
                        id="creator-headline"
                        value={dashboardSettings.creator_headline}
                        onChange={(e) => setDashboardSettings((prev) => ({ ...prev, creator_headline: e.target.value }))}
                        placeholder="e.g. Welcome back!"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="creator-message" className="block text-sm font-medium text-gray-700 mb-2">
                        Creator Message (optional)
                      </label>
                      <p className="text-sm text-gray-500 mb-2">
                        Supports **bold**, *italic*, [links](https://example.com), and line breaks.
                      </p>
                      <textarea
                        id="creator-message"
                        rows={7}
                        value={dashboardSettings.creator_message}
                        onChange={(e) => setDashboardSettings((prev) => ({ ...prev, creator_message: e.target.value }))}
                        placeholder="e.g. Welcome! Check out our new **course** and the [resources page](https://example.com)."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="creator-video-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Creator Video URL
                      </label>
                      <input
                        type="url"
                        id="creator-video-url"
                        value={dashboardSettings.creator_video_url || ""}
                        onChange={(e) =>
                          setDashboardSettings((prev) => ({
                            ...prev,
                            creator_video_url: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500">
                        Optional. If provided, this video will appear next to the creator message on the member dashboard.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 1: Dashboard Header Image */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Dashboard Header</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">This image appears at the top of the member dashboard.</p>
                    <div className="w-full h-[140px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {dashboardSettings.header_image_url ? (
                        <img
                          src={dashboardSettings.header_image_url || "/placeholder.svg"}
                          alt="Dashboard header preview"
                          className="w-full h-full object-cover object-center"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            e.currentTarget.nextElementSibling?.classList.remove("hidden")
                          }}
                        />
                      ) : null}
                      <div
                        className={`flex flex-col items-center justify-center text-gray-400 ${dashboardSettings.header_image_url ? "hidden" : ""}`}
                      >
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm">Dashboard header preview (recommended: wide image)</span>
                      </div>
                    </div>
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={headerImageInputRef}
                      onChange={handleHeaderImageUpload}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                    />
                    {/* Upload button */}
                    <button
                      type="button"
                      onClick={() => headerImageInputRef.current?.click()}
                      disabled={isUploadingHeaderImage}
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingHeaderImage ? "Uploading..." : "Upload image"}
                    </button>
                  </div>
                </section>

                {/* Section 2: What's Happening This Week */}
                <section className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What&apos;s Happening This Week</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Configure up to four events or announcements. Button text on the dashboard will show &quot;More Details&quot;.
                  </p>
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map((index) => {
                      const item = dashboardSettings.weekly_items[index] ?? { ...DEFAULT_WEEKLY_ITEM }
                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-gray-200 p-5 shadow-sm bg-gray-50/50 space-y-4 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">Item {index + 1}</div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...(dashboardSettings.weekly_items || [])]
                                while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                next[index] = { ...DEFAULT_WEEKLY_ITEM }
                                setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                              }}
                              className="text-xs text-gray-500 hover:text-red-600 font-medium"
                            >
                              Clear Card
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                              <input
                                type="date"
                                value={item.date}
                                onChange={(e) => {
                                  const next = [...(dashboardSettings.weekly_items || [])]
                                  while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                  next[index] = { ...next[index], date: e.target.value }
                                  setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                              <input
                                type="time"
                                value={item.time ?? ""}
                                onChange={(e) => {
                                  const next = [...(dashboardSettings.weekly_items || [])]
                                  while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                  next[index] = { ...next[index], time: e.target.value || "" }
                                  setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...(dashboardSettings.weekly_items || [])]
                                while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                next[index] = { ...next[index], title: e.target.value }
                                setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                              }}
                              placeholder="e.g. Creator Summit 2024"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description (max 3 lines)</label>
                            <textarea
                              rows={3}
                              value={item.description}
                              onChange={(e) => {
                                const next = [...(dashboardSettings.weekly_items || [])]
                                while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                next[index] = { ...next[index], description: e.target.value }
                                setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                              }}
                              placeholder="Brief description of the event..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                            <input
                              type="url"
                              value={item.button_url}
                              onChange={(e) => {
                                const next = [...(dashboardSettings.weekly_items || [])]
                                while (next.length <= index) next.push({ ...DEFAULT_WEEKLY_ITEM })
                                next[index] = { ...next[index], button_url: e.target.value }
                                setDashboardSettings((prev) => ({ ...prev, weekly_items: next }))
                              }}
                              placeholder="https://..."
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                {/* Section 3: Featured Categories */}
                <section className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Featured: Choose a Category</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Select a category, then choose up to 3 items to feature on the dashboard.
                  </p>
                  {isLoadingDropdownData ? (
                    <div className="text-gray-500 text-sm">Loading options...</div>
                  ) : (
                    <div className="space-y-6">
                      {(
                        [
                          { key: "groups", label: "Groups", options: groupOptions, getLabel: (o: { id: string; name: string }) => o.name },
                          { key: "courses", label: "Courses", options: courseOptions, getLabel: (o: { id: string; title: string }) => o.title },
                          { key: "masterclasses", label: "Masterclasses", options: masterclassOptions, getLabel: (o: { id: string; title: string }) => o.title },
                          { key: "experts", label: "Experts", options: expertOptions, getLabel: (o: { id: string; name: string; title?: string | null }) => o.title ? `${o.name} — ${o.title}` : o.name },
                          { key: "content", label: "Content", options: contentOptions, getLabel: (o: { id: string; title: string; content_type: string }) => `${o.title} (${o.content_type})` },
                          { key: "businesses", label: "Businesses", options: businessOptions, getLabel: (o: { id: string; name: string }) => o.name },
                          { key: "products", label: "Products", options: productOptions, getLabel: (o: { id: string; name: string }) => o.name },
                          { key: "services", label: "Services", options: serviceOptions, getLabel: (o: { id: string; name: string }) => o.name },
                          { key: "tools", label: "Tools", options: toolOptions, getLabel: (o: { id: string; name: string }) => o.name },
                        ] as const
                      ).map(({ key, label, options, getLabel }) => {
                        const selectedIds = dashboardSettings.featured_sections[key] || []
                        return (
                          <div key={key} className="rounded-xl border border-gray-200 p-5 shadow-sm bg-gray-50/50">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">{label}</h4>
                            <div className="space-y-3">
                              {[0, 1, 2].map((slotIndex) => {
                                const currentId = selectedIds[slotIndex] || ""
                                const currentOption = options.find((o: { id: string }) => o.id === currentId)
                                const usedIds = selectedIds.filter((_, i) => i !== slotIndex)
                                const available = options.filter((o: { id: string }) => !usedIds.includes(o.id))

                                return (
                                  <div key={slotIndex} className="flex items-center gap-3">
                                    <select
                                      value={currentId}
                                      onChange={(e) => {
                                        const newIds = [...selectedIds]
                                        if (e.target.value) {
                                          newIds[slotIndex] = e.target.value
                                        } else {
                                          newIds.splice(slotIndex, 1)
                                        }
                                        setDashboardSettings((prev) => ({
                                          ...prev,
                                          featured_sections: {
                                            ...prev.featured_sections,
                                            [key]: newIds.filter(Boolean),
                                          },
                                        }))
                                      }}
                                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                      <option value="">Select {label.toLowerCase()}…</option>
                                      {available.map((opt: { id: string }) => (
                                        <option key={opt.id} value={opt.id}>
                                          {getLabel(opt as never)}
                                        </option>
                                      ))}
                                      {currentOption && !available.find((o: { id: string }) => o.id === currentId) && (
                                        <option value={currentId}>{getLabel(currentOption as never)}</option>
                                      )}
                                    </select>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                {/* Section 4: In The Spotlight */}
                <section className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">In The Spotlight</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Featured opportunity or highlight. Displayed with an &quot;Explore Now&quot; button.
                  </p>
                  <div className="rounded-xl border border-gray-200 p-6 shadow-sm space-y-4 bg-gray-50/50">
                    <div>
                      <label htmlFor="spotlight-media-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Media URL (image or video)
                      </label>
                      <input
                        type="url"
                        id="spotlight-media-url"
                        value={dashboardSettings.spotlight?.media_url || ""}
                        onChange={(e) =>
                          setDashboardSettings((prev) => ({
                            ...prev,
                            spotlight: {
                              ...(prev.spotlight || { media_url: "", headline: "", text: "", button_url: "" }),
                              media_url: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="spotlight-headline" className="block text-sm font-medium text-gray-700 mb-2">
                        Headline
                      </label>
                      <input
                        type="text"
                        id="spotlight-headline"
                        value={dashboardSettings.spotlight?.headline || ""}
                        onChange={(e) =>
                          setDashboardSettings((prev) => ({
                            ...prev,
                            spotlight: {
                              ...(prev.spotlight || { media_url: "", headline: "", text: "", button_url: "" }),
                              headline: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. How Sarah Built a 50k Community in 6 Months"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="spotlight-text" className="block text-sm font-medium text-gray-700 mb-2">
                        Text
                      </label>
                      <textarea
                        id="spotlight-text"
                        rows={4}
                        value={dashboardSettings.spotlight?.text || ""}
                        onChange={(e) =>
                          setDashboardSettings((prev) => ({
                            ...prev,
                            spotlight: {
                              ...(prev.spotlight || { media_url: "", headline: "", text: "", button_url: "" }),
                              text: e.target.value,
                            },
                          }))
                        }
                        placeholder="Description of the featured story..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="spotlight-button-url" className="block text-sm font-medium text-gray-700 mb-2">
                        Explore Button URL
                      </label>
                      <input
                        type="url"
                        id="spotlight-button-url"
                        value={dashboardSettings.spotlight?.button_url || ""}
                        onChange={(e) =>
                          setDashboardSettings((prev) => ({
                            ...prev,
                            spotlight: {
                              ...(prev.spotlight || { media_url: "", headline: "", text: "", button_url: "" }),
                              button_url: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500">Button label on dashboard: &quot;Explore Now&quot;</p>
                    </div>
                  </div>
                </section>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveDashboardSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Dashboard Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "authentication" && (
            <div role="tabpanel" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-8">
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Authentication Providers</h3>
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enable Google Login</label>
                        <p className="text-sm text-gray-500">
                          Allow members to sign in with Google. Supabase must be configured with Google OAuth credentials in your project settings.
                        </p>
                      </div>
                      <div className="flex flex-col items-end pt-7">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Enabled</span>
                          <button
                            type="button"
                            onClick={() => setEnableGoogleAuth((prev) => !prev)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              enableGoogleAuth ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                enableGoogleAuth ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={saveAuthenticationSettings}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Authentication Settings"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showExternalModal} onOpenChange={(open) => !open && closeExternalModal()}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingExternalId ? "Edit Link" : "Add Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="external-modal-label" className="block text-sm font-medium text-gray-700 mb-2">
                Menu Label
              </label>
              <input
                type="text"
                id="external-modal-label"
                value={externalLabel}
                onChange={(e) => setExternalLabel(e.target.value)}
                placeholder="e.g. Help Center"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="external-modal-url" className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                id="external-modal-url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/help"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={closeExternalModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveExternalLink}
              disabled={!externalLabel.trim() || !externalUrl.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingExternalId ? "Save" : "Add Link"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showToast && (
        <div className="fixed top-5 right-5 z-50">
          <div
            className={`${toastType === "success" ? "bg-green-500" : "bg-red-500"} text-white px-6 py-3 rounded-lg shadow-lg`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {toastType === "success" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <span>{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
