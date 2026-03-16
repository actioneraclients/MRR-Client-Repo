"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import type { Dashboard2Data, WeeklyItem } from "../actions"
import { getYouTubeEmbedUrl, isYouTubeUrl } from "../utils"
import { PLACEHOLDER_IMG } from "./utils"
import { useShellConfig } from "../../_components/ShellConfig"

const CATEGORY_LABELS: Record<string, string> = {
  groups: "Groups",
  courses: "Courses",
  masterclasses: "Masterclasses",
  experts: "Experts",
  content: "Content",
  businesses: "Businesses",
  products: "Products",
  services: "Services",
  tools: "Tools",
}

const WEEKLY_CARD_STYLES = [
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
  "bg-green-50 text-green-600",
  "bg-amber-50 text-amber-600",
] as const

function formatDate(dateStr: string) {
  if (!dateStr) return { month: "", day: "" }
  const d = new Date(dateStr)
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: d.getDate().toString(),
  }
}

export function Dashboard2Content(props: Dashboard2Data) {
  const config = useShellConfig()
  const navItems = config.memberNavigation || []

  const { hasGroups, hasCourses, hasMasterclasses, hasExperts, hasContent, hasBusinesses, hasProducts, hasServices, hasTools } = useMemo(() => {
    const communityItem = navItems.find((item) => item.id === "community")
    const communityGroupsVisible =
      communityItem?.visible !== false &&
      Array.isArray(communityItem?.children) &&
      communityItem.children.some((c) => c.id === "community_groups" && c.visible !== false)
    return {
      hasGroups: communityGroupsVisible,
      hasCourses: navItems.some((item) => item.id === "courses" && item.visible !== false),
      hasMasterclasses: navItems.some((item) => item.id === "masterclasses" && item.visible !== false),
      hasExperts: navItems.some((item) => item.id === "education" && item.visible !== false),
      hasContent: navItems.some((item) => item.id === "education" && item.visible !== false),
      hasBusinesses: navItems.some((item) => item.id === "productsservices" && item.visible !== false),
      hasProducts: navItems.some((item) => item.id === "productsservices" && item.visible !== false),
      hasServices: navItems.some((item) => item.id === "productsservices" && item.visible !== false),
      hasTools: navItems.some((item) => item.id === "tools" && item.visible !== false),
    }
  }, [navItems])

  const featuredTabs = useMemo(
    () =>
      [
        hasGroups && { key: "groups" as const, label: CATEGORY_LABELS.groups },
        hasCourses && { key: "courses" as const, label: CATEGORY_LABELS.courses },
        hasMasterclasses && { key: "masterclasses" as const, label: CATEGORY_LABELS.masterclasses },
        hasExperts && { key: "experts" as const, label: CATEGORY_LABELS.experts },
        hasContent && { key: "content" as const, label: CATEGORY_LABELS.content },
        hasBusinesses && { key: "businesses" as const, label: CATEGORY_LABELS.businesses },
        hasProducts && { key: "products" as const, label: CATEGORY_LABELS.products },
        hasServices && { key: "services" as const, label: CATEGORY_LABELS.services },
        hasTools && { key: "tools" as const, label: CATEGORY_LABELS.tools },
      ].filter((t): t is { key: string; label: string } => Boolean(t)),
    [hasGroups, hasCourses, hasMasterclasses, hasExperts, hasContent, hasBusinesses, hasProducts, hasServices, hasTools]
  )

  const [activeCategory, setActiveCategory] = useState("groups")
  useEffect(() => {
    if (featuredTabs.length > 0 && !featuredTabs.some((t) => t.key === activeCategory)) {
      setActiveCategory(featuredTabs[0].key)
    }
  }, [featuredTabs, activeCategory])

  const {
    displayName,
    profileCompletePercent,
    creatorHeadline,
    creatorMessage,
    creatorVideoUrl,
    creatorVideoThumbnailUrl,
    weeklyItems,
    featuredSections,
    spotlight,
    brandAccentColor,
    inboxActivity,
  } = props

  const hasInboxActivity =
    (inboxActivity?.unreadMessages ?? 0) > 0 ||
    (inboxActivity?.siteUpdates ?? 0) > 0 ||
    (inboxActivity?.groupMessages ?? 0) > 0

  const creatorVideoEmbedUrl = getYouTubeEmbedUrl(creatorVideoUrl)
  const featuredItems = (featuredSections[activeCategory] || []) as Record<string, unknown>[]
  const accentStyle = { backgroundColor: brandAccentColor || "#2563eb" } as React.CSSProperties

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-0 bg-gray-50 min-h-full">
      {/* Section 1: Welcome Header */}
      <section id="welcome-header" className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Here&apos;s what&apos;s happening in your community today
            </p>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">Profile Complete</span>
              <span className="text-xs font-bold text-primary-600">{profileCompletePercent}%</span>
            </div>
            <div className="w-32 sm:w-40 bg-gray-100 rounded-full h-1.5 mb-2">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletePercent}%` }}
              />
            </div>
            <Link
              href="/members/profile"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center group"
            >
              Complete Your Profile{" "}
              <i className="fa-solid fa-arrow-right ml-1 text-[10px] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2: Site Message + Video */}
      <section id="site-message-video" className="mb-8 sm:mb-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-0">
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {creatorHeadline || "Platform Update"}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {creatorMessage || "Check back soon for updates from the community."}
                </p>
              </div>
              <div className="flex flex-col">
                <div className="relative aspect-video bg-gray-900 overflow-hidden min-h-[14rem] lg:min-h-0">
                  {creatorVideoEmbedUrl ? (
                    <iframe
                      src={creatorVideoEmbedUrl}
                      title="Platform update video"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : creatorVideoThumbnailUrl ? (
                    <img
                      className="absolute inset-0 w-full h-full object-cover"
                      src={creatorVideoThumbnailUrl}
                      alt="Platform update"
                    />
                  ) : null}
                </div>
                <div className="mt-4 px-4 pb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Inbox Activity</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-lg font-semibold">{inboxActivity?.unreadMessages ?? 0}</div>
                      <div className="text-xs text-gray-500">Unread Messages</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-lg font-semibold">{inboxActivity?.siteUpdates ?? 0}</div>
                      <div className="text-xs text-gray-500">Site Updates</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3">
                      <div className="text-lg font-semibold">{inboxActivity?.groupMessages ?? 0}</div>
                      <div className="text-xs text-gray-500">Group Messages</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {hasInboxActivity ? "You have new activity waiting" : "You're all caught up"}
                  </p>
                  <Link
                    href="/members/inbox?tab=updates"
                    className="mt-4 w-full inline-flex justify-center items-center rounded-md px-4 py-2.5 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={accentStyle}
                  >
                    View Updates in Inbox
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Section 4: Featured Categories Header */}
      {featuredTabs.length > 0 && (
        <section id="featured-categories-header" className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            Featured: Choose a Category
          </h2>
          <p className="text-sm text-gray-500">Explore featured resources from across the community</p>
        </section>
      )}

      {/* Section 5: Featured Categories Selector */}
      {featuredTabs.length > 0 && (
        <section id="featured-categories" className="mb-6">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`category-pill flex-shrink-0 px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                  activeCategory === tab.key
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Section 6: Dynamic Featured Content */}
      {featuredTabs.length > 0 && (
        <section id="dynamic-content" className="mb-8 sm:mb-10">
          <div className="content-area">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hasGroups && activeCategory === "groups" &&
              featuredItems.map((g: Record<string, unknown>) => (
                <Link
                  key={String(g.id)}
                  href={`/members/community/groups?group=${g.slug || g.id}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
                    <img
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={(g.listing_image_url as string) || (g.avatar_url as string) || PLACEHOLDER_IMG}
                      alt={String(g.name)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(g.name)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-2">{String(g.description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span
                        className="inline-block w-full text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                        style={accentStyle}
                      >
                        Join <i className="fa-solid fa-arrow-right ml-1 text-xs" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasCourses && activeCategory === "courses" &&
              featuredItems.map((c: Record<string, unknown>) => (
                <Link
                  key={String(c.id)}
                  href={`/members/courses?course=${encodeURIComponent(String(c.title || c.id))}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      src={(c.thumbnail_url as string) || PLACEHOLDER_IMG}
                      alt={String(c.title)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(c.title)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-3">{String(c.description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span
                        className="block w-full text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                        style={accentStyle}
                      >
                        More Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasMasterclasses && activeCategory === "masterclasses" &&
              featuredItems.map((m: Record<string, unknown>) => (
                <Link
                  key={String(m.id)}
                  href={`/members/masterclasses`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      src={(m.image_url as string) || "/placeholder.svg"}
                      alt={String(m.title)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(m.title)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-2">{String(m.description || "")}</p>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <i className="fa-regular fa-calendar" />
                        <span>{m.scheduled_at ? new Date(String(m.scheduled_at)).toLocaleString() : ""}</span>
                      </div>
                      <span
                        className="text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                        style={accentStyle}
                      >
                        Register
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasExperts && activeCategory === "experts" &&
              featuredItems.map((e: Record<string, unknown>) => (
                <Link
                  key={String(e.id)}
                  href={`/members/education?view=experts&expert=${encodeURIComponent(String(e.slug || e.name || e.id))}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={(e.image_url as string) || PLACEHOLDER_IMG}
                        alt={String(e.name)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">{String(e.name)}</h3>
                      <p className="text-sm text-primary-600 font-medium mb-2">{String(e.title || "")}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex-grow line-clamp-4">{String(e.bio || "")}</p>
                  <div className="mt-auto pt-4">
                    <span
                      className="block w-full text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                      style={accentStyle}
                    >
                      View Expert
                    </span>
                  </div>
                </Link>
              ))}

            {hasContent && activeCategory === "content" &&
              featuredItems.map((c: Record<string, unknown>) => (
                <Link
                  key={String(c.id)}
                  href={`/members/education?content=${c.slug || c.id}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                      src={(c.image_url as string) || "/placeholder.svg"}
                      alt={String(c.title)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                        {String(c.content_type || "Content")}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{String(c.title)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-2">{String(c.description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                        Read More <i className="fa-solid fa-arrow-right ml-1 text-xs" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasBusinesses && activeCategory === "businesses" &&
              featuredItems.map((b: Record<string, unknown>) => (
                <Link
                  key={String(b.id)}
                  href={`/members/productservices?business=${encodeURIComponent(String(b.name))}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={(b.logo_url as string) || "/placeholder.svg"}
                        alt={String(b.name)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">{String(b.name)}</h3>
                      <p className="text-sm text-gray-500 mb-2">{String(b.short_description || b.description || "")}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex-grow line-clamp-2">{String(b.description || b.short_description || "")}</p>
                  <div className="mt-auto pt-4">
                    <span
                      className="block w-full text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                      style={accentStyle}
                    >
                      View Profile
                    </span>
                  </div>
                </Link>
              ))}

            {hasProducts && activeCategory === "products" &&
              featuredItems.map((p: Record<string, unknown>) => (
                <Link
                  key={String(p.id)}
                  href={`/members/productservices?tab=products&product=${encodeURIComponent(String(p.name || p.id))}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      src={(p.image_url as string) || PLACEHOLDER_IMG}
                      alt={String(p.name)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(p.name)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-3">{String(p.short_description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span
                        className="block w-full text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                        style={accentStyle}
                      >
                        More Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasServices && activeCategory === "services" &&
              featuredItems.map((s: Record<string, unknown>) => (
                <Link
                  key={String(s.id)}
                  href={`/members/productservices?tab=services&service=${encodeURIComponent(String(s.name || s.id))}`}
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      src={(s.image_url as string) || PLACEHOLDER_IMG}
                      alt={String(s.name)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(s.name)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-3">{String(s.short_description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span
                        className="block w-full text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                        style={accentStyle}
                      >
                        More Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {hasTools && activeCategory === "tools" &&
              featuredItems.map((t: Record<string, unknown>) => (
                <Link
                  key={String(t.id)}
                  href="/members/tools"
                  className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-900">
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      src={(t.image_url as string) || PLACEHOLDER_IMG}
                      alt={String(t.name)}
                    />
                  </div>
                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{String(t.name)}</h3>
                    <p className="text-sm text-gray-600 flex-grow line-clamp-3">{String(t.short_description || "")}</p>
                    <div className="mt-auto pt-4">
                      <span
                        className="block w-full text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                        style={accentStyle}
                      >
                        View All Tools
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
      )}

      {/* Section 3: Happening This Week */}
      {weeklyItems.length > 0 && (
        <section id="happening-this-week" className="mb-8 sm:mb-10">
          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Happening This Week</h2>
          </div>
          <div className="relative">
            <div className="flex overflow-x-auto gap-4 pb-4 scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
              {weeklyItems.map((item: WeeklyItem, idx: number) => {
              const { month, day } = formatDate(item.date)
              const style = WEEKLY_CARD_STYLES[idx % WEEKLY_CARD_STYLES.length]
              return (
                <div
                  key={idx}
                  className="flex flex-col flex-shrink-0 w-72 bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${style}`}
                    >
                      <span className="text-xs font-bold uppercase">{month}</span>
                      <span className="text-lg font-bold">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500">
                        {item.time ? (
                          <>
                            <i className="fa-regular fa-clock mr-1" />
                            {item.time}
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 flex-1">{item.description}</p>
                  <a
                    href={item.button_url || "#"}
                    className="mt-auto block w-full text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors text-center hover:opacity-90"
                    style={accentStyle}
                  >
                    More Details
                  </a>
                </div>
              )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Section 7: Spotlight Feature Header */}
      <section id="spotlight-header" className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">In The Spotlight</h2>
        <p className="text-sm text-gray-500">
          Featured opportunities and highlights from the community
        </p>
      </section>

      {/* Section 8: Spotlight Feature */}
      {spotlight && (spotlight.headline || spotlight.media_url || spotlight.text) ? (
        <section id="spotlight-feature" className="mb-10">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative aspect-video lg:aspect-auto lg:min-h-[20rem] bg-gray-900 order-2 lg:order-1">
                {isYouTubeUrl(spotlight.media_url) && getYouTubeEmbedUrl(spotlight.media_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(spotlight.media_url)!}
                    title={spotlight.headline || "Spotlight video"}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : spotlight.media_url ? (
                  <>
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-90"
                      src={spotlight.media_url}
                      alt={spotlight.headline || "Spotlight"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Featured
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      className="absolute inset-0 w-full h-full object-cover opacity-90"
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/spotlight-feature.jpg"
                      alt={spotlight.headline || "Featured"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Featured
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center order-1 lg:order-2">
                <div className="inline-flex items-center space-x-2 mb-4">
                  <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Member Spotlight
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {spotlight.headline}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
                  {spotlight.text}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={spotlight.button_url || "#"}
                    className="text-white font-semibold text-sm py-3 px-6 rounded-lg transition-colors shadow-sm text-center hover:opacity-90"
                    style={accentStyle}
                  >
                    Explore Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section id="spotlight-feature" className="mb-10">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative h-64 lg:h-auto bg-gray-900 group cursor-pointer order-2 lg:order-1">
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-70 transition-opacity"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/spotlight-feature.jpg"
                  alt="Featured"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center order-1 lg:order-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">In The Spotlight</h2>
                <p className="text-gray-600 text-sm sm:text-base">Featured opportunities will appear here.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
