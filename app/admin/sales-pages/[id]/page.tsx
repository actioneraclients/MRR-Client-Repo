import { redirect } from "next/navigation"
import { getSalesPageById } from "../builder/sales-pages-actions"
import { SalesPageBuilderClient } from "./sales-page-builder-client"

export default async function AdminSalesPageBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const page = await getSalesPageById(id)

  if (!page) {
    redirect("/admin/sales-pages")
  }

  return (
    <div className="flex-1 overflow-hidden p-6">
      <div className="max-w-6xl mx-auto">
        <SalesPageBuilderClient
          pageId={page.id}
          pageTitle={page.title}
          pageSlug={page.slug}
          isHomepage={page.is_homepage}
          initialSections={page.sections}
        />
      </div>
    </div>
  )
}
