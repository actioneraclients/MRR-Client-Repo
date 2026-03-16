import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import FoundersFaqAccordion from "@/components/FoundersFaqAccordion"
import type { ActivePlanForSalesPage, SalesPageRow } from "@/app/admin/sales-pages/sales-page-actions"
import { MainSalesPage } from "@/components/MainSalesPage"

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (url == null || typeof url !== "string") return null
  const trimmed = url.trim()
  if (trimmed === "") return null
  try {
    const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
    if (youtuBeMatch) return `https://www.youtube.com/embed/${youtuBeMatch[1]}`
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
    return null
  } catch {
    return null
  }
}

type PlanRow = {
  id: string
  name: string
  price: number | null
  currency: string | null
  billing: string | null
  features: string[] | null
  most_popular: boolean | null
  payment_url: string | null
}

export default async function FoundersPage() {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("public_sales_pages")
    .select("*")
    .eq("slug", "founders")
    .single()

  if (error || !row) {
    return (
      <div className="font-sans bg-white min-h-[50vh] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Founders</h1>
          <p className="text-gray-600">This page is not available yet.</p>
        </div>
      </div>
    )
  }

  const founders = row as SalesPageRow
  const spots = founders.founders_spots_available ?? null
  const spotsLabel = spots != null ? String(spots) : "—"

  const planIds = Array.isArray(founders.selected_plan_ids) ? founders.selected_plan_ids : []
  const { data: plansData } = await supabase
    .from("plans")
    .select("id, name, price, currency, billing, features, most_popular, payment_url")
    .eq("active", true)
  const allPlans = (plansData ?? []) as PlanRow[]
  const plansById = new Map(allPlans.map((p) => [p.id, p]))
  const orderedFoundersPlans =
    planIds.length === 0
      ? []
      : planIds
          .map((id) => plansById.get(id))
          .filter((p): p is PlanRow => p != null)

  return (
    <>
      <MainSalesPage
        salesPage={founders}
        orderedPlans={orderedFoundersPlans as ActivePlanForSalesPage[]}
        stopAfterSection="salesy"
        includeAiMentorsWhenStopped
        hideHeroButtons
      />

      {/* Invitation Section */}
      <section id="invitation" className="py-24 px-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-8">
            <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide">
              Exclusive Opportunity
            </span>
          </div>
          {(founders.founders_invite_headline ?? "").trim() !== "" && (
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">{founders.founders_invite_headline}</h2>
          )}
          {(founders.founders_invite_body ?? "").trim() !== "" && (
            <p className="text-xl lg:text-2xl mb-8 leading-relaxed opacity-95 whitespace-pre-wrap">
              {founders.founders_invite_body}
            </p>
          )}
          <div className="inline-block bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl px-8 py-4 mb-12">
            <p className="text-2xl font-bold">
              <i className="fa-solid fa-hourglass-half mr-3"></i>
              Limited to {spotsLabel} Founding Leaders — available until filled.
            </p>
          </div>
          {(founders.founders_invite_media_url ?? "").trim() !== "" && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/20">
              {founders.founders_invite_media_type === "video" ? (
                getYouTubeEmbedUrl(founders.founders_invite_media_url) != null ? (
                  <iframe
                    src={getYouTubeEmbedUrl(founders.founders_invite_media_url)!}
                    title="Founders invite media"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/70 text-sm">
                    Video URL could not be embedded
                  </div>
                )
              ) : (
                <img
                  src={founders.founders_invite_media_url ?? ""}
                  alt="Founders invite media"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Everything Included Section */}
      <section id="everything-included" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {(founders.founders_comparison_headline ?? "").trim() !== "" && (
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{founders.founders_comparison_headline}</h2>
            )}
            {(founders.founders_comparison_subhead ?? "").trim() !== "" && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {founders.founders_comparison_subhead}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-3xl shadow-2xl p-10 border-2 border-brand-200 transform lg:scale-105">
              <div className="text-center mb-8">
                <div className="inline-block bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide mb-4">
                  <i className="fa-solid fa-crown mr-2"></i>
                  Best Value
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Founding Leader</h3>
                <p className="text-brand-700 font-semibold">Lifetime Access</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Lifetime access</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Full "Create" permissions</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Create groups + private groups</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Create and host events</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Create AI Mentors</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Publish content + be featured</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Create courses (lead gen or paid)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Promote products and services</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-check text-brand-600 text-xl mt-1"></i>
                  <span className="text-gray-800 font-medium">Maximum visibility inside the community</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {founders.founders_price_lifetime != null ? `$${founders.founders_price_lifetime}` : "—"}
                </p>
                <p className="text-gray-600 font-medium">One-time payment • Lifetime value</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Top-Level Member</h3>
                <p className="text-gray-600 font-semibold">Monthly Subscription</p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-gray-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Monthly subscription (example: $99+/mo)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-gray-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Access to community and member-level content</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-gray-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Some creation access (limited)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Not all features unlocked</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Founding Leader capabilities not included</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Limited visibility and positioning</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Cannot create AI Mentors</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Limited course creation options</span>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-xmark text-red-400 text-xl mt-1"></i>
                  <span className="text-gray-600">Recurring monthly payment required</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {founders.founders_price_comparison_monthly != null ? `$${founders.founders_price_comparison_monthly}` : "—"}
                </p>
                <p className="text-gray-600 font-medium">Per month • Ongoing cost</p>
              </div>
            </div>
          </div>
          <div className="mt-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-8 text-center text-white">
            <p className="text-2xl font-bold">
              <i className="fa-solid fa-calculator mr-3"></i>
              In one year, the monthly plan can cost more than the Founding Leader lifetime deal — while still not
              including everything.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Claim Section */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {(founders.founders_claim_headline ?? "").trim() !== "" && (
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {founders.founders_claim_headline}
              </h2>
            )}
            {(founders.founders_claim_body ?? "").trim() !== "" && (
              <p className="text-xl text-gray-600 whitespace-pre-wrap">{founders.founders_claim_body}</p>
            )}
          </div>
          {orderedFoundersPlans.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8">
              {orderedFoundersPlans.map((plan) => {
                const isPopular = plan.most_popular === true
                const currencySymbol =
                  plan.currency === "USD" || plan.currency == null || plan.currency === ""
                    ? "$"
                    : plan.currency
                const priceDisplay =
                  plan.price == null || plan.price === 0
                    ? "$0"
                    : `${currencySymbol}${plan.price}${plan.billing ? ` / ${plan.billing}` : ""}`
                const features = Array.isArray(plan.features)
                  ? plan.features.filter((f): f is string => typeof f === "string" && f.trim() !== "")
                  : []
                const ctaHref = plan.payment_url?.trim() ?? "#"
                return (
                  <div
                    key={plan.id}
                    className={
                      isPopular
                        ? "w-full max-w-md bg-gradient-to-br from-purple-100 to-brand-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-300 relative"
                        : "w-full max-w-md bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8 border border-blue-200"
                    }
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-brand-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className={`text-center mb-6 ${isPopular ? "pt-2" : ""}`}>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-3xl font-bold text-gray-900">{priceDisplay}</p>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <i
                            className={`fa-solid fa-check mt-1 ${isPopular ? "text-purple-600" : "text-blue-500"}`}
                          />
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        isPopular
                          ? "block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-full hover:from-purple-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                          : "block w-full text-center px-8 py-4 bg-white text-brand-600 rounded-full border-2 border-brand-600 hover:bg-brand-50 transition-all duration-200 font-semibold"
                      }
                    >
                      {plan.price == null || plan.price === 0 ? "Get Started" : `Choose ${plan.name}`}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
          {orderedFoundersPlans.length > 0 && (
            <p className="text-sm text-gray-500 italic text-center mt-6">
              {spots != null ? `Available until ${spots} spots are filled.` : "Available until spots are filled."}
            </p>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      {Array.isArray(founders.founders_faq) && founders.founders_faq.length > 0 && (
        <section id="faq" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about becoming a Founding Leader</p>
            </div>
            <FoundersFaqAccordion items={founders.founders_faq} />
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section id="final-cta" className="py-24 px-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">Ready to Become a Founding Leader?</h2>
          <p className="text-xl lg:text-2xl mb-12 leading-relaxed opacity-95">
            Join the limited group of experts shaping this community from the beginning — with lifetime access, full
            creator permissions, and built-in ways to share your expertise and grow your impact.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-bold mb-2">
                  {founders.founders_price_lifetime != null ? `$${founders.founders_price_lifetime}` : "$997"}
                </div>
                <p className="text-white/90">One-time lifetime investment</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">{spotsLabel}</div>
                <p className="text-white/90">Limited spots available</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">∞</div>
                <p className="text-white/90">Lifetime access & value</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center">
              <img
                src={founders.logo_url ?? process.env.NEXT_PUBLIC_BRAND_LOGO_URL}
                alt="Brand Logo"
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Login
              </Link>
              <a
                href={process.env.NEXT_PUBLIC_TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Terms
              </a>
              <a
                href={process.env.NEXT_PUBLIC_PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Privacy
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
