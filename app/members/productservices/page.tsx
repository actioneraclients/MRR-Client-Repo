import ProductServicesPageClient from "./productservices-page-client"
import { createClient } from "@/lib/supabase/server"
import { getBusinessesList, getMyBusinesses, getProductsList, getServicesList } from "./actions"
import { getTaxonomiesByType } from "@/app/admin/categories/actions"
import { canUserAddBusiness } from "./can-user-add-business"
import { canUserCreateService } from "./can-user-create-service"
import { canUserCreateProduct } from "./can-user-create-product"

export const dynamic = "force-dynamic"

export default async function ProductServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("brand_accent_color, member_navigation, upgrade_link")
    .limit(1)
    .maybeSingle()
  const upgradeLink = siteSettings?.upgrade_link ?? null

  const brandAccentColor = siteSettings?.brand_accent_color ?? "#2563eb"
  let pageTitle = "Products & Services"
  let showBusinessesTab = true
  const rawNav = siteSettings?.member_navigation
  let navItems: { id?: string; label?: string; config?: { showBusinesses?: boolean } }[] | null = null
  if (rawNav != null) {
    if (Array.isArray(rawNav)) {
      navItems = rawNav as { id?: string; label?: string; config?: { showBusinesses?: boolean } }[]
    } else if (typeof rawNav === "string") {
      try {
        const parsed = JSON.parse(rawNav)
        navItems = Array.isArray(parsed) ? (parsed as { id?: string; label?: string; config?: { showBusinesses?: boolean } }[]) : null
      } catch {
        navItems = null
      }
    }
  }
  if (navItems != null && navItems.length > 0) {
    const productsservicesItem = navItems.find((item) => item?.id === "productsservices")
    if (productsservicesItem?.label != null && String(productsservicesItem.label).trim() !== "") {
      pageTitle = String(productsservicesItem.label).trim()
    }
    if (productsservicesItem?.config && typeof productsservicesItem.config.showBusinesses === "boolean") {
      showBusinessesTab = productsservicesItem.config.showBusinesses
    }
  }

  const [businesses, products, services, myBusinesses, serviceTags, expertTags, canAddBusiness, canCreateService, canCreateProduct] = await Promise.all([
    getBusinessesList(),
    getProductsList(),
    getServicesList(),
    getMyBusinesses(),
    getTaxonomiesByType("content_tag"),
    getTaxonomiesByType("expert_tag"),
    canUserAddBusiness(),
    canUserCreateService(),
    canUserCreateProduct(),
  ])

  const businessesWithOffers = businesses.map((b) => ({
    ...b,
    slug: b.slug ?? "",
    products: products.filter((p) => p.business_id === b.id).map((p) => ({ id: p.id, name: p.name, description: p.short_description })),
    services: services.filter((s) => s.business_id === b.id).map((s) => ({ id: s.id, name: s.name, description: s.short_description })),
  }))

  return (
    <ProductServicesPageClient
      pageTitle={pageTitle}
      showBusinessesTab={showBusinessesTab}
      brandAccentColor={brandAccentColor}
      initialBusinesses={businessesWithOffers}
      initialProducts={products}
      initialServices={services}
      myBusinesses={myBusinesses}
      serviceTags={serviceTags.map((t) => ({ id: t.id, name: t.name }))}
      expertTags={expertTags.map((t) => ({ id: t.id, name: t.name }))}
      currentUserId={currentUserId}
      canAddBusiness={canAddBusiness}
      canCreateService={canCreateService}
      canCreateProduct={canCreateProduct}
      upgradeLink={upgradeLink}
    />
  )
}
