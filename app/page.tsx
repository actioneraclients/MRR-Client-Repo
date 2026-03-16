import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getPublicSalesPageWithPlans } from "@/lib/sales-pages/getPublicSalesPage"
import { MainSalesPage } from "@/components/MainSalesPage"
import { getHomepageSalesPage } from "@/app/admin/sales-pages/builder/sales-pages-actions"
import { SalesPageRenderer } from "@/components/sales-pages/SalesPageRenderer"

export default async function HomePage() {
  const homepage = await getHomepageSalesPage()

  if (homepage) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: settings } = await supabase
      .from("site_settings")
      .select("site_title")
      .single()

    return (
      <SalesPageRenderer
        sections={homepage.sections ?? []}
        title={homepage.title}
        siteName={settings?.site_title ?? "Community Platform"}
      />
    )
  }

  const { salesPage, orderedPlans } = await getPublicSalesPageWithPlans()
  return <MainSalesPage salesPage={salesPage} orderedPlans={orderedPlans} />
}
