import { Check, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUpgradePageData, type UpgradePlan } from "./actions"

const FEATURE_LABELS: Array<{ key: string; label: string }> = [
  { key: "directory_listing", label: "Directory listing" },
  { key: "create_groups", label: "Create groups" },
  { key: "create_private_group", label: "Create private groups" },
  { key: "create_events", label: "Create events" },
  { key: "offer_content", label: "Offer content" },
  { key: "offer_services", label: "Offer services" },
  { key: "offer_products", label: "Offer products" },
  { key: "offer_businesses", label: "Offer businesses" },
]

function formatPrice(plan: UpgradePlan): { price: string; period: string } {
  if (plan.is_free) {
    return { price: "Free", period: "" }
  }
  const symbol = plan.currency === "USD" ? "$" : plan.currency + " "
  return {
    price: `${symbol}${plan.price}`,
    period: plan.billing.toLowerCase().includes("lifetime") || plan.billing.toLowerCase().includes("one-time")
      ? " one-time"
      : `/${plan.billing.toLowerCase()}`,
  }
}

export default async function UpgradePage() {
  const result = await getUpgradePageData()

  if (!result.success) {
    return (
      <div className="space-y-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Upgrade Your Plan</h1>
            <p className="text-slate-600 mt-1 max-w-xl">Please log in to view plan comparison.</p>
            <Link href="/login" className="mt-4 inline-block">
              <Button>Log in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const {
    currentPlanId,
    plans,
    permissionMatrix,
    tools,
    toolMatrix,
    billingLink,
    upgradePlanIds,
    showFoundersSection,
    stripeCustomerId,
  } = result.data

  let visiblePlans = plans
  if (upgradePlanIds?.length) {
    const planMap = new Map(plans.map((p) => [p.id, p]))
    visiblePlans = upgradePlanIds
      .map((id) => planMap.get(id))
      .filter((p): p is UpgradePlan => Boolean(p))
  }

  return (
    <div className="space-y-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Upgrade Your Plan</h1>
            <p className="text-slate-600 mt-1 max-w-xl">Compare plans and unlock more access.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-700">Features</th>
                  {visiblePlans.map((plan) => {
                    const { price, period } = formatPrice(plan)
                    const isCurrentPlan = plan.id === currentPlanId
                    return (
                      <th key={plan.id} className="text-center py-4 px-4 sm:px-6 min-w-[140px]">
                        <div
                          className={`inline-flex flex-col items-center rounded-xl px-3 sm:px-4 py-3 ${
                            isCurrentPlan ? "bg-indigo-50 ring-2 ring-indigo-200 text-indigo-800" : "text-slate-800"
                          }`}
                        >
                          <span className="text-base font-bold">{plan.name}</span>
                          <span className="text-sm font-medium mt-0.5">
                            {price}
                            {period && <span className="text-slate-500 font-normal">{period}</span>}
                          </span>
                          {isCurrentPlan && (
                            <span className="text-xs font-medium mt-1 text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                              Your Plan
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {FEATURE_LABELS.map(({ key, label }) => (
                  <tr key={key} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="py-3 px-4 sm:px-6 text-sm text-slate-700">{label}</td>
                    {visiblePlans.map((plan) => {
                      const enabled = permissionMatrix[key]?.[plan.id] ?? false
                      return (
                        <td key={plan.id} className="py-3 px-4 sm:px-6 text-center">
                          {enabled ? (
                            <Check className="h-6 w-6 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {tools.length > 0 && (
                  <>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <td colSpan={visiblePlans.length + 1} className="py-3 px-4 sm:px-6">
                        <span className="text-sm font-semibold text-slate-800">Tools Access</span>
                      </td>
                    </tr>
                    {tools.map((tool) => (
                      <tr key={tool.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-4 sm:px-6 text-sm text-slate-700">{tool.name}</td>
                        {visiblePlans.map((plan) => {
                          const included = toolMatrix[tool.id]?.[plan.id] ?? false
                          return (
                            <td key={plan.id} className="py-3 px-4 sm:px-6 text-center">
                              {included ? (
                                <Check className="h-6 w-6 text-emerald-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-400 mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </>
                )}

                <tr className="border-b-0 bg-slate-50/30">
                  <td className="py-5 px-6" />
                  {visiblePlans.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlanId
                    return (
                      <td key={plan.id} className="py-5 px-6 text-center">
                        {isCurrentPlan ? (
                            <Button variant="outline" disabled className="w-full max-w-[160px] sm:max-w-[180px] opacity-70">
                            Current Plan
                          </Button>
                        ) : stripeCustomerId && billingLink ? (
                          <Link href={billingLink}>
                            <Button className="w-full max-w-[160px] sm:max-w-[180px]">Manage Billing</Button>
                          </Link>
                        ) : plan.stripe_payment_link ? (
                          <Link href={plan.stripe_payment_link}>
                            <Button className="w-full max-w-[160px] sm:max-w-[180px]">Upgrade</Button>
                          </Link>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Button disabled className="w-full max-w-[160px] sm:max-w-[180px]">
                              Upgrade
                            </Button>
                            <span className="text-xs text-slate-500">
                              Stripe payment link not configured
                            </span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFoundersSection && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Become a Founding Leader</h2>
            <p className="text-slate-600 mb-6">
              Want to lead, teach, and monetize your expertise? Learn about our founders program.
            </p>
            <Link
              href="/founders"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
            >
              Learn About Becoming a Founding Leader
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
