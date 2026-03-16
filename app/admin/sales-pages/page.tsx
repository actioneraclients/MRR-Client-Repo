import { getAdminSalesPagesWithPlans } from "@/lib/sales-pages/getPublicSalesPage"
import { getAdminOptInPages, getAllPlansForDropdown } from "./optin/actions"
import { getLegalPages } from "./legal-pages/actions"
import type { OptInPageWithPlan, PlanOption } from "./optin/actions"
import { AdminSalesPagesClient } from "./admin-sales-pages-client"
import LegalPagesEditor from "@/components/admin/legal-pages/LegalPagesEditor"

export default async function AdminSalesPagesPage() {
  const [salesResult, optInResult, plansResult, legalPages] = await Promise.all([
    getAdminSalesPagesWithPlans(),
    getAdminOptInPages(),
    getAllPlansForDropdown(),
    getLegalPages(),
  ])

  const { foundersSalesPage, orderedPlans } = salesResult
  const optInPages: OptInPageWithPlan[] = optInResult.items ?? []
  const plansForDropdown: PlanOption[] = plansResult.plans ?? []
  const terms = legalPages.find((p) => p.page_type === "terms")
  const privacy = legalPages.find((p) => p.page_type === "privacy")

  return (
    <div className="flex-1 overflow-hidden p-8">
      <AdminSalesPagesClient
        foundersSalesPage={foundersSalesPage}
        orderedPlans={orderedPlans}
        optInPages={optInPages}
        plansForDropdown={plansForDropdown}
        legalContent={
          <LegalPagesEditor
            initialTerms={terms?.content ?? ""}
            initialPrivacy={privacy?.content ?? ""}
          />
        }
      />
    </div>
  )
}
