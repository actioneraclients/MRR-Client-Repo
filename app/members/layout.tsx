import type React from "react"
import { redirect } from "next/navigation"
import { ShellConfigProvider } from "./_components/ShellConfig"
import { AppShell } from "./_components/AppShell"
import { createClient } from "@/lib/supabase/server"

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let userProfile = { email: "" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, full_name, email, avatar_url, role, is_creator")
    .eq("id", user.id)
    .single()

  if (profile) {
    userProfile = {
      ...profile,
      email: profile.email || user.email || "",
    }
  } else {
    userProfile = { email: user.email || "" }
  }

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select(
      "site_title, brand_logo_url, brand_accent_color, member_navigation, site_terms_url, site_privacy_url, billing_link",
    )
    .single()

  const allowedKeys = ["dashboard", "courses", "masterclasses", "tools", "community", "education", "productsservices", "support"]

  const defaultLabels: Record<string, string> = {
    dashboard: "Dashboard",
    courses: "Courses",
    masterclasses: "Masterclasses",
    tools: "Tools",
    community: "Community",
    education: "Education",
    businesses: "Products & Services",
    productsservices: "Products & Services",
    support: "Support",
  }

  type NavItem = {
    id: string
    label: string
    order?: number
    visible?: boolean
    type?: "internal" | "external"
    url?: string
    children?: Array<{ id: string; label: string; order?: number; visible?: boolean }>
  }
  let orderedNavigation: NavItem[] = []
  const sidebarLabels: Record<string, string> = { ...defaultLabels }

  if (siteSettings?.member_navigation) {
    let memberNavigation = siteSettings.member_navigation

    if (typeof memberNavigation === "string") {
      try {
        memberNavigation = JSON.parse(memberNavigation)
      } catch {
        memberNavigation = []
      }
    }

    const parsedNav = Array.isArray(memberNavigation)
      ? memberNavigation
      : []

    // Normalize: internal (allowed keys) + external (type external + url)
    if (Array.isArray(parsedNav)) {
      const internalItems = parsedNav
        .filter((item) => {
          const id = item.id
          return typeof id === "string" && allowedKeys.includes(id)
        })
        .sort((a, b) => {
          const orderA = typeof a.order === "number" ? a.order : 999
          const orderB = typeof b.order === "number" ? b.order : 999
          return orderA - orderB
        })
        .map((item) => {
          const base = {
            id: item.id as string,
            label: item.label || defaultLabels[item.id as string] || (item.id as string),
            visible: item.visible !== false,
            type: "internal" as const,
            order: typeof item.order === "number" ? item.order : undefined,
          }
          if (item.id === "community") {
            const kids =
              Array.isArray(item.children) && item.children.length > 0
                ? item.children
                    .filter((c) => c && typeof c.id === "string" && typeof c.label === "string")
                    .map((c) => ({
                      id: c.id,
                      label: c.label,
                      order: typeof c.order === "number" ? c.order : undefined,
                      visible: c.visible !== false,
                    }))
                : [
                    { id: "community_feed", label: "Member Feed", order: 1, visible: true },
                    { id: "community_groups", label: "Groups", order: 2, visible: true },
                    { id: "community_directory", label: "Directory", order: 3, visible: true },
                    { id: "community_events", label: "Events", order: 4, visible: true },
                  ]
            return { ...base, children: kids }
          }
          return base
        }) as NavItem[]

      const externalItems = parsedNav
        .filter(
          (item) =>
            item.type === "external" &&
            typeof item.url === "string" &&
            item.url &&
            typeof item.label === "string",
        )
        .sort((a, b) => {
          const orderA = typeof a.order === "number" ? a.order : 999
          const orderB = typeof b.order === "number" ? b.order : 999
          return orderA - orderB
        })
        .map((item, index) => ({
          id: (item.id as string) || `ext-${index}`,
          label: item.label as string,
          visible: item.visible !== false,
          type: "external" as const,
          url: item.url as string,
        })) as NavItem[]

      orderedNavigation = [...internalItems, ...externalItems]

      // Build sidebarLabels from ordered navigation (internal only)
      internalItems.forEach((item) => {
        sidebarLabels[item.id] = item.label || defaultLabels[item.id] || item.id
      })

      // Sidebar label for Products/Businesses section: from nav item id "productsservices"
      const productsservicesItem = parsedNav.find((item) => item?.id === "productsservices")
      sidebarLabels.businesses =
        productsservicesItem?.label != null && String(productsservicesItem.label).trim() !== ""
          ? String(productsservicesItem.label).trim()
          : "Products & Services"
    }
  }

  // If no valid internal navigation was built, use defaults (preserve external)
  const hasInternal = orderedNavigation.some((item) => item.type !== "external")
  if (!hasInternal) {
    const externalOnly = orderedNavigation.filter((item) => item.type === "external")
    orderedNavigation = [
      { id: "dashboard", label: defaultLabels.dashboard, visible: true, order: 1 },
      { id: "courses", label: defaultLabels.courses, visible: true, order: 2 },
      { id: "masterclasses", label: defaultLabels.masterclasses, visible: true, order: 3 },
      { id: "tools", label: defaultLabels.tools, visible: true, order: 4 },
      {
        id: "community",
        label: defaultLabels.community,
        visible: true,
        order: 5,
        children: [
          { id: "community_feed", label: "Member Feed", order: 1, visible: true },
          { id: "community_groups", label: "Groups", order: 2, visible: true },
          { id: "community_directory", label: "Directory", order: 3, visible: true },
          { id: "community_events", label: "Events", order: 4, visible: true },
        ],
      },
      { id: "education", label: defaultLabels.education, visible: true, order: 6 },
      { id: "productsservices", label: defaultLabels.businesses, visible: true, order: 7 },
      { id: "support", label: defaultLabels.support, visible: true, order: 8 },
      ...externalOnly,
    ]
  }

  const shellConfigValue = {
    sidebarLabels,
    memberNavigation: orderedNavigation,
    brandLogoUrl: siteSettings?.brand_logo_url ?? null,
    brandAccentColor: siteSettings?.brand_accent_color ?? null,
    siteTitle: siteSettings?.site_title ?? null,
    siteTermsUrl: siteSettings?.site_terms_url ?? null,
    sitePrivacyUrl: siteSettings?.site_privacy_url ?? null,
    billingLink: siteSettings?.billing_link ?? null,
  }

  return (
    <ShellConfigProvider value={shellConfigValue}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        crossOrigin="anonymous"
      />
      <AppShell userProfile={userProfile}>{children}</AppShell>
    </ShellConfigProvider>
  )
}
