"use client"

import { createContext, useContext, type ReactNode } from "react"

interface ShellConfigContextType {
  sidebarLabels: {
    dashboard: string
    tools: string
    community: string
    education: string
    businesses: string
    support: string
  }
  memberNavigation: Array<{
    id: string
    label: string
    order?: number
    visible?: boolean
    type?: "internal" | "external"
    url?: string
    children?: Array<{
      id: string
      label: string
      order?: number
      visible?: boolean
    }>
  }>
  brandLogoUrl: string | null
  brandAccentColor: string | null
  siteTitle: string | null
  siteTermsUrl: string | null
  sitePrivacyUrl: string | null
  billingLink: string | null
}

const defaultConfig: ShellConfigContextType = {
  sidebarLabels: {
    dashboard: "Dashboard",
    tools: "Tools",
    community: "Community",
    education: "Education",
    businesses: "Products & Services",
    support: "Support",
  },
  memberNavigation: [],
  brandLogoUrl: null,
  brandAccentColor: null,
  siteTitle: null,
  siteTermsUrl: null,
  sitePrivacyUrl: null,
  billingLink: null,
}

const ShellConfigContext = createContext<ShellConfigContextType>(defaultConfig)

export function ShellConfigProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ShellConfigContextType
}) {
  return <ShellConfigContext.Provider value={value}>{children}</ShellConfigContext.Provider>
}

export function useShellConfig() {
  return useContext(ShellConfigContext)
}
