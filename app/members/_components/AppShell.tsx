// app/members/_components/AppShell.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useShellConfig } from "./ShellConfig"
import { getInboxUnreadIndicator } from "@/app/members/inbox/inbox-indicator-actions"

const STORAGE_KEY = "mrr_sidebar_state"

interface UserProfile {
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: string | null
  is_creator?: boolean | null
}

function classNames(...x: Array<string | false | null | undefined>) {
  return x.filter(Boolean).join(" ")
}

type RouteEntry =
  | { href: string; icon: string; activeMatch?: (p: string) => boolean }
  | { icon: string; activeMatch: (p: string) => boolean }

const ROUTE_MAP: Record<string, RouteEntry> = {
  dashboard: {
    href: "/members/dashboard",
    icon: "fa-chart-line",
  },
  courses: {
    href: "/members/courses",
    icon: "fa-graduation-cap",
  },
  masterclasses: {
    href: "/members/masterclasses",
    icon: "fa-chalkboard",
  },
  tools: {
    href: "/members/tools",
    icon: "fa-tools",
  },
  community: {
    icon: "fa-users",
    activeMatch: (p: string) => p.startsWith("/members/community"),
  },
  education: {
    href: "/members/education",
    icon: "fa-book",
  },
  productsservices: {
    href: "/members/productservices",
    icon: "fa-briefcase",
    activeMatch: (p: string) => p.startsWith("/members/productservices"),
  },
  support: {
    href: "/members/support",
    icon: "fa-life-ring",
  },
}

const COMMUNITY_CHILDREN_ROUTES: Record<string, string> = {
  community_feed: "/members/community",
  community_groups: "/members/community/groups",
  community_directory: "/members/community/directory",
  community_events: "/members/community/events",
}

export function AppShell({
  children,
  userProfile,
  inboxUnreadCount = 0,
}: { children: ReactNode; userProfile: UserProfile; inboxUnreadCount?: number }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [hasInboxUnread, setHasInboxUnread] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const avatarRef = useRef<HTMLDivElement>(null)
  const config = useShellConfig()

  // Initialize: mobile = closed by default, desktop = sidebarCollapsed from localStorage
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024
    if (!isMobile) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "closed") setSidebarCollapsed(true)
      } catch {}
    }
    setMounted(true)
  }, [])

  // Persist to localStorage (desktop only)
  useEffect(() => {
    if (!mounted || (typeof window !== "undefined" && window.innerWidth < 1024)) return
    try {
      localStorage.setItem(STORAGE_KEY, sidebarCollapsed ? "closed" : "open")
    } catch {}
  }, [sidebarCollapsed, mounted])

  useEffect(() => {
    let alive = true

    const check = async () => {
      try {
        const res = await getInboxUnreadIndicator()
        if (alive) setHasInboxUnread(!!res?.hasUnread)
      } catch {
        // keep silent
      }
    }

    check()

    const onFocus = () => check()
    window.addEventListener("focus", onFocus)

    return () => {
      alive = false
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  useEffect(() => {
    const accent = config.brandAccentColor || "#6366f1" // fallback indigo
    document.documentElement.style.setProperty("--brand-accent", accent)
    document.documentElement.style.setProperty("--brand-accent-color", accent)
  }, [config.brandAccentColor])

  useEffect(() => {
    if (pathname.startsWith("/members/community")) {
      setOpenMenus((prev) => ({ ...prev, community: true }))
    }
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (avatarOpen) setAvatarOpen(false)
        else if (mobileMenuOpen) setMobileMenuOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [avatarOpen, mobileMenuOpen])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!avatarRef.current) return
      if (!avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    if (avatarOpen) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [avatarOpen])

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileMenuOpen((v) => !v)
    } else {
      setSidebarCollapsed((v) => !v)
    }
  }

  // Close sidebar when navigating (mobile only) - allows tap target to work before route change
  const closeSidebarOnNav = () => setMobileMenuOpen(false)

  const internalItems = [...config.memberNavigation]
    .filter((item) => item.visible !== false && item.id in ROUTE_MAP && item.type !== "external")
    .sort((a, b) => {
      const orderA = (typeof (a as { order?: number }).order === "number" ? (a as { order?: number }).order : 999) as number
      const orderB = (typeof (b as { order?: number }).order === "number" ? (b as { order?: number }).order : 999) as number
      return orderA - orderB
    })
  const externalItems = config.memberNavigation.filter(
    (item) => item.type === "external" && item.url && item.visible !== false,
  )

  const isParentWithChildren = (item: (typeof internalItems)[number]) =>
    "children" in item && Array.isArray((item as { children?: unknown[] }).children)

  const getHref = (id: string) => {
    const entry = ROUTE_MAP[id]
    return entry && "href" in entry ? entry.href : null
  }

  const isActiveLink = (id: string, href: string | null) => {
    const entry = ROUTE_MAP[id]
    if (entry && "activeMatch" in entry && entry.activeMatch) return entry.activeMatch(pathname)
    return href ? pathname === href : false
  }

  const isChildActive = (route: string) => {
    if (route === "/members/community") return pathname === route || pathname === "/members/community/"
    return pathname === route || pathname.startsWith(route + "/")
  }

  const getDisplayName = () => {
    return userProfile.full_name || userProfile.email || "Member"
  }

  const getInitials = () => {
    const name = getDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {/* HEADER */}
      <div id="header" className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-controls="sidebar"
              aria-expanded={mobileMenuOpen || !sidebarCollapsed}
              aria-label="Toggle sidebar"
              type="button"
            >
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-current transition-all duration-300"></div>
                <div className="w-full h-0.5 bg-current transition-all duration-300"></div>
                <div className="w-full h-0.5 bg-current transition-all duration-300"></div>
              </div>
            </button>

            <Link href="/members/dashboard" id="logo-section" className="flex items-center">
              {config.brandLogoUrl ? (
                <img
                  src={config.brandLogoUrl || "/placeholder.svg"}
                  alt={config.siteTitle || "Logo"}
                  className="h-12 w-auto"
                />
              ) : (
                <span className="text-xl font-bold text-gray-900">{config.siteTitle || "Platform"}</span>
              )}
            </Link>
          </div>

          {/* Right side: inbox, avatar */}
          <div id="header-user-menu" className="flex items-center space-x-4">
            {/* Bell => /members/inbox */}
            <Link
              href="/members/inbox"
              className="relative flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open Inbox"
            >
              <i className="fa-solid fa-bell text-lg"></i>
              <span className="text-sm font-medium">Inbox</span>

              {hasInboxUnread && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
            </Link>

            {/* Avatar + dropdown */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200" ref={avatarRef}>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-900">{getDisplayName()}</div>
                <div className="text-xs text-gray-500">{userProfile.role || "Member"}</div>
              </div>

              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="relative rounded-full focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={avatarOpen}
                aria-label="Open user menu"
                type="button"
              >
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url || "/placeholder.svg"}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand-accent)]/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-accent)]/10 flex items-center justify-center text-[var(--brand-accent)] font-bold border-2 border-[var(--brand-accent)]/20">
                    {getInitials()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--brand-accent)] rounded-full border-2 border-white"></div>
              </button>

              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Toggle user menu"
                type="button"
              >
                <i className="fa-solid fa-chevron-down text-sm"></i>
              </button>

              {/* Dropdown */}
              {avatarOpen && (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-6 top-14 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-2 z-[60]"
                >
                  <Link
                    href="/members/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    role="menuitem"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Profile
                  </Link>
                  {config.billingLink ? (
                    <a
                      href={config.billingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={() => setAvatarOpen(false)}
                    >
                      Billing
                    </a>
                  ) : (
                    <Link
                      href="/members/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                      onClick={() => setAvatarOpen(false)}
                    >
                      Account
                    </Link>
                  )}
                  <Link
                    href="/logout"
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                    onClick={() => setAvatarOpen(false)}
                  >
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay - mobile only, when mobile menu open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - mobile: full-screen drawer overlay, desktop: below header, fills remaining viewport */}
      <aside
        id="sidebar"
        className={classNames(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
          "w-64",
          sidebarCollapsed ? "lg:w-20 lg:overflow-hidden" : "lg:w-64",
          "transition-[width] duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          !mobileMenuOpen && "pointer-events-none lg:pointer-events-auto",
        )}
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full">
          <div id="sidebar-main-menu" className="flex-1 py-6">
            <nav className="px-4 space-y-2">
              {internalItems.map((item) => {
                const entry = ROUTE_MAP[item.id]
                const icon = entry?.icon || "fa-circle"
                const hasChildren = isParentWithChildren(item)
                const children = hasChildren
                  ? ((item as { children?: Array<{ id: string; label: string; order?: number; visible?: boolean }> })
                      .children ?? [])
                  : []

                if (hasChildren) {
                  const isOpen = openMenus[item.id] === true
                  const active = entry && "activeMatch" in entry && entry.activeMatch
                    ? entry.activeMatch(pathname)
                    : false
                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                        }
                        className={classNames(
                          "flex w-full items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 group text-left",
                          sidebarCollapsed && "lg:justify-center lg:px-2",
                          active
                            ? "text-white bg-[var(--brand-accent)] shadow-lg"
                            : "text-gray-600 hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5",
                        )}
                      >
                        <i
                          className={classNames(
                            "fa-solid w-5 mr-3",
                            icon,
                            sidebarCollapsed && "lg:mr-0",
                            active ? "text-white" : "text-gray-500 group-hover:text-[var(--brand-accent)]",
                          )}
                        />
                        <span className={classNames(sidebarCollapsed && "lg:hidden")}>{item.label}</span>
                        <i
                          className={classNames(
                            "fa-solid fa-chevron-down ml-auto w-4 transition-transform",
                            isOpen && "rotate-180",
                            sidebarCollapsed && "lg:hidden",
                          )}
                        />
                      </button>
                      {isOpen && children.length > 0 && !sidebarCollapsed && (
                        <div className="ml-8 space-y-1 mt-1">
                          {[...children]
                            .filter((c) => c.visible !== false)
                            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
                            .map((child) => {
                              const route =
                                item.id === "community"
                                  ? COMMUNITY_CHILDREN_ROUTES[child.id]
                                  : null
                              if (!route) return null
                              const childActive = isChildActive(route)
                              return (
                                <Link
                                  key={child.id}
                                  href={route}
                                  onClick={closeSidebarOnNav}
                                  className={classNames(
                                    "block text-sm px-4 py-2 rounded-lg transition-colors",
                                    childActive
                                      ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-medium"
                                      : "text-gray-600 hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5",
                                  )}
                                >
                                  {child.label}
                                </Link>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                }

                const href = getHref(item.id)
                if (!href) return null
                const active = isActiveLink(item.id, href)
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={closeSidebarOnNav}
                    className={classNames(
                      "flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                      sidebarCollapsed && "lg:justify-center lg:px-2",
                      active
                        ? "text-white bg-[var(--brand-accent)] shadow-lg"
                        : "text-gray-600 hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5",
                    )}
                  >
                    <i
                      className={classNames(
                        "fa-solid w-5 mr-3",
                        icon,
                        sidebarCollapsed && "lg:mr-0",
                        "text-gray-500",
                        active && "text-white",
                        !active && "group-hover:text-[var(--brand-accent)]",
                      )}
                    />
                    <span className={classNames(sidebarCollapsed && "lg:hidden")}>{item.label}</span>
                    {active ? (
                      <div className={classNames("ml-auto w-2 h-2 bg-white/30 rounded-full", sidebarCollapsed && "lg:hidden")} />
                    ) : (
                      <div className={classNames("ml-auto opacity-0 group-hover:opacity-100 transition-opacity", sidebarCollapsed && "lg:hidden")}>
                        <div className="w-2 h-2 bg-[var(--brand-accent)]/20 rounded-full" />
                      </div>
                    )}
                  </Link>
                )
              })}
              {userProfile.is_creator === true && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeSidebarOnNav}
                  className={classNames(
                    "flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 group",
                    sidebarCollapsed && "lg:justify-center lg:px-2",
                    pathname.startsWith("/admin")
                      ? "text-white bg-[var(--brand-accent)] shadow-lg"
                      : "text-gray-600 hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5",
                  )}
                >
                  <i
                    className={classNames(
                      "fa-solid fa-shield-halved w-5 mr-3",
                      sidebarCollapsed && "lg:mr-0",
                      "text-gray-500",
                      pathname.startsWith("/admin") && "text-white",
                      !pathname.startsWith("/admin") && "group-hover:text-[var(--brand-accent)]",
                    )}
                  />
                  <span className={classNames(sidebarCollapsed && "lg:hidden")}>Admin</span>
                  {pathname.startsWith("/admin") ? (
                    <div className={classNames("ml-auto w-2 h-2 bg-white/30 rounded-full", sidebarCollapsed && "lg:hidden")} />
                  ) : (
                    <div className={classNames("ml-auto opacity-0 group-hover:opacity-100 transition-opacity", sidebarCollapsed && "lg:hidden")}>
                      <div className="w-2 h-2 bg-[var(--brand-accent)]/20 rounded-full" />
                    </div>
                  )}
                </Link>
              )}
              {externalItems.length > 0 && (
                <>
                  <div className="my-4 border-t border-gray-200" role="separator" />
                  {externalItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeSidebarOnNav}
                      className={classNames(
                        "flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 text-gray-600 hover:text-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/5 group",
                        sidebarCollapsed && "lg:justify-center lg:px-2",
                      )}
                    >
                      <i className={classNames("fa-solid fa-up-right-from-square w-5 mr-3 text-gray-500 group-hover:text-[var(--brand-accent)]", sidebarCollapsed && "lg:mr-0")} />
                      <span className={classNames(sidebarCollapsed && "lg:hidden")}>{item.label}</span>
                    </a>
                  ))}
                </>
              )}
            </nav>
          </div>

          <div id="sidebar-bottom-section" className={classNames("border-t border-gray-200 p-4", sidebarCollapsed && "lg:hidden")}>
            <div className="text-xs text-gray-500 space-y-1">
              <div>
                © {new Date().getFullYear()} {config.siteTitle || "Platform"}
              </div>
              {(config.siteTermsUrl || config.sitePrivacyUrl) && (
                <div className="flex items-center gap-2">
                  {config.siteTermsUrl && (
                    <a
                      href={config.siteTermsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Terms
                    </a>
                  )}
                  {config.siteTermsUrl && config.sitePrivacyUrl && <span className="text-gray-300">|</span>}
                  {config.sitePrivacyUrl && (
                    <a
                      href={config.sitePrivacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Privacy
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - full width on mobile, margin for sidebar on desktop (adjusts when collapsed) */}
      <div
        className={classNames(
          "mt-16 p-6 transition-all duration-300 ml-0",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
        )}
      >
        {children}
      </div>
    </>
  )
}
