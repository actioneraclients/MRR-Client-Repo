export const dynamic = "force-dynamic"
export const revalidate = 0
export const dynamicParams = true
export const runtime = "nodejs"

import { notFound } from "next/navigation"
import type { SalesPageSection } from "@/app/admin/sales-pages/builder/sales-pages-actions"
import { getOptInPageBySlug, getSalesPageBySlug } from "./actions"
import { OptInPageRenderer } from "@/components/optin/OptInPageRenderer"
import { SalesPageRenderer } from "@/components/sales-pages/SalesPageRenderer"

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const normalizedSlug = slug.trim().toLowerCase()

  // 1️⃣ Check opt-in pages first
  const optin = await getOptInPageBySlug(normalizedSlug)

  if (optin && optin.is_active) {
    return <OptInPageRenderer page={optin} slug={normalizedSlug} />
  }

  // 2️⃣ Check sales pages
  const salesPage = await getSalesPageBySlug(normalizedSlug)

  if (salesPage) {
    return (
      <SalesPageRenderer
        sections={(salesPage.sections ?? []) as SalesPageSection[]}
        title={salesPage.title}
      />
    )
  }

  // 3️⃣ Nothing found
  notFound()
}
