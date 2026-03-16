"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesPageForm } from "./sales-page-form"
import { AdminOptInClient } from "./optin/optin-client"
import { AdminSalesPagesBuilderClient } from "./builder/admin-sales-pages-builder-client"
import type { ActivePlanForSalesPage, SalesPageRow } from "./sales-page-actions"
import type { OptInPageWithPlan } from "./optin/actions"
import type { PlanOption } from "./optin/actions"

export function AdminSalesPagesClient({
  foundersSalesPage,
  orderedPlans = [],
  optInPages = [],
  plansForDropdown = [],
  legalContent,
}: {
  mainSalesPage?: SalesPageRow | null
  foundersSalesPage: SalesPageRow | null
  orderedPlans?: ActivePlanForSalesPage[]
  optInPages?: OptInPageWithPlan[]
  plansForDropdown?: PlanOption[]
  legalContent?: React.ReactNode
}) {
  return (
    <div className="flex-1 overflow-hidden p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Pages</h1>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList>
            <TabsTrigger value="sales">Sales Pages</TabsTrigger>
            <TabsTrigger value="founders">Founders Page</TabsTrigger>
            <TabsTrigger value="optin">Opt-In Pages</TabsTrigger>
            <TabsTrigger value="legal">Legal Pages</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-6">
            <AdminSalesPagesBuilderClient />
          </TabsContent>
          <TabsContent value="founders" className="mt-6">
            <SalesPageForm pageType="founders" salesPage={foundersSalesPage} orderedPlans={orderedPlans} />
          </TabsContent>
          <TabsContent value="optin" className="mt-6">
            <AdminOptInClient initialItems={optInPages} plans={plansForDropdown} />
          </TabsContent>
          <TabsContent value="legal" className="mt-6">
            {legalContent}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
