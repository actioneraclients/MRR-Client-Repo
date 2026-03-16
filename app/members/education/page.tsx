import EducationPageClient from "./education-page-client"
import { getExpertsList } from "./actions-experts"
import { getContentList, getContentFilters } from "./actions-content"
import { getTaxonomiesByType } from "@/app/admin/categories/actions"
import { createClient } from "@/lib/supabase/server"
import { canUserCreateContent } from "./can-user-create-content"

type NavItem = { id: string; label: string; order: number; visible: boolean }

export const dynamic = "force-dynamic"

export default async function EducationPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const includeAll = resolvedSearchParams?.view === "my"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("member_navigation, brand_accent_color, upgrade_link")
    .limit(1)
    .maybeSingle()

  const upgradeLink = siteSettings?.upgrade_link ?? null

  let pageTitle = "Education Hub"
  if (siteSettings?.member_navigation) {
    const navItems = siteSettings.member_navigation as NavItem[]
    const educationNav = navItems.find((item) => item.id === "education")
    if (educationNav?.label) {
      pageTitle = educationNav.label
    }
  }

  const brandAccentColor = siteSettings?.brand_accent_color || "#2563eb"

  const [expertsResult, contentResult, contentFilters, contentTags, canCreateContent] = await Promise.all([
    getExpertsList({}),
    getContentList({ page: 1, pageSize: 12, includeAll }),
    getContentFilters(),
    getTaxonomiesByType("content_tag"),
    canUserCreateContent(),
  ])

  const allExpertTags = Array.from(new Set(expertsResult.items.flatMap((e) => e.tags)))

  return (
    <EducationPageClient
      pageTitle={pageTitle}
      brandAccentColor={brandAccentColor}
      initialExperts={expertsResult.items}
      allExpertTags={allExpertTags}
      initialContent={contentResult.items}
      totalContent={contentResult.total}
      initialPage={contentResult.page}
      pageSize={contentResult.pageSize}
      initialSponsoredItem={contentResult.sponsoredItem}
      contentFilters={contentFilters}
      contentCategories={contentFilters.categories}
      contentTags={contentTags.map((t) => ({ id: t.id, name: t.name }))}
      currentUserId={currentUserId}
      canCreateContent={canCreateContent}
      upgradeLink={upgradeLink}
    />
  )
}
