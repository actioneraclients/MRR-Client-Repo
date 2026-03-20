"use client"

import { useState, useEffect } from "react"
import type { SalesPageSection, EducationSectionResolvedData, PlanForMembershipSection } from "@/app/admin/sales-pages/builder/sales-pages-actions"
import { getEducationSectionResolvedData, getPlansByIdsForSection } from "@/app/admin/sales-pages/builder/sales-pages-actions"
import { TextBlock } from "@/components/sales-page/TextBlock"

function getContentValue(c: Record<string, unknown> | undefined, key: string): string {
  const v = c?.[key]
  return typeof v === "string" ? v : ""
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null
}

function getContentId(c: Record<string, unknown> | undefined, key: string): string | null {
  const v = c?.[key]
  if (v == null || v === "") return null
  return String(v)
}

function EducationSectionContent({
  content,
  accentColor,
  sectionIndex,
}: {
  content: Record<string, unknown>
  accentColor: string
  sectionIndex: number
}) {
  const [data, setData] = useState<EducationSectionResolvedData | null>(null)
  const headline = getContentValue(content, "headline")
  const description = getContentValue(content, "description")

  const expertId = getContentId(content, "expert_id")
  const videoId = getContentId(content, "video_id")
  const articleId = getContentId(content, "article_id")
  const audioId = getContentId(content, "audio_id")
  const documentId = getContentId(content, "document_id")

  useEffect(() => {
    getEducationSectionResolvedData({
      expert_id: expertId,
      video_id: videoId,
      article_id: articleId,
      audio_id: audioId,
      document_id: documentId,
    }).then(setData)
  }, [expertId, videoId, articleId, audioId, documentId])

  const ContentCard = ({ item, type }: { item: { id: string; title: string; image_url: string | null; description: string | null }; type: string }) => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
      <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold uppercase text-blue-600">{type}</span>
        )}
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold text-blue-600 uppercase mb-1 block">{type}</span>
        <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
        {item.description && (
          <div className="line-clamp-4 text-sm text-slate-600">
            <TextBlock text={item.description} />
          </div>
        )}
      </div>
    </div>
  )

  const contentItems = [
    data?.video && { item: data.video, type: "Video" as const },
    data?.article && { item: data.article, type: "Article" as const },
    data?.audio && { item: data.audio, type: "Audio" as const },
    data?.document && { item: data.document, type: "Document" as const },
  ].filter((x): x is { item: { id: string; title: string; image_url: string | null; description: string | null }; type: string } => Boolean(x))

  const hasExpert = Boolean(data?.expert)
  const hasContent = contentItems.length > 0

  const bg = getSectionBg(sectionIndex, "education")
  return (
    <section id="education" className={`py-16 md:py-24 ${bg}`}>
      <div className="max-w-6xl mx-auto px-6">
        {headline && (
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center mb-6">
            {headline}
          </h2>
        )}
        {description && (
          <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed text-center mb-12">
            <TextBlock text={description} className="text-slate-600" />
          </div>
        )}
        <div className={`grid gap-8 items-start ${hasExpert ? "grid-cols-1 lg:grid-cols-[320px_1fr]" : "grid-cols-1"}`}>
          {hasExpert && data?.expert && (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-100">
                <img
                  src={data.expert.image_url || "https://placehold.co/80x80?text=Expert"}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{data.expert.name}</h3>
              {data.expert.bio && (
                <div className="line-clamp-7 text-sm text-slate-600">
                  <TextBlock text={data.expert.bio} />
                </div>
              )}
            </div>
          )}
          {hasContent && (
            <div className="grid md:grid-cols-2 gap-6 min-w-0">
              {contentItems.map(({ item, type }) => (
                <ContentCard key={item.id} item={item} type={type} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MembershipPlansSectionContent({
  content,
  accentColor,
  sectionIndex,
}: {
  content: Record<string, unknown>
  accentColor: string
  sectionIndex: number
}) {
  const [plans, setPlans] = useState<PlanForMembershipSection[]>([])
  const headline = getContentValue(content, "headline")
  const subheadline = getContentValue(content, "subheadline")
  const planIds = Array.isArray(content.plans) ? (content.plans as string[]).filter((x) => typeof x === "string") : []

  useEffect(() => {
    if (planIds.length > 0) {
      getPlansByIdsForSection(planIds).then(setPlans)
    } else {
      setPlans([])
    }
  }, [planIds.join(",")])

  const freePlan = plans.find((p) => p.slug === "free" || p.slug === "Free" || p.name?.toLowerCase() === "free")
  const paidPlans = plans.filter((p) => p !== freePlan)

  const renderPlanCard = (plan: PlanForMembershipSection, isCompact?: boolean) => {
    const isPopular = plan.most_popular === true
    const currencySymbol = plan.currency === "USD" || plan.currency == null || plan.currency === "" ? "$" : plan.currency
    const priceDisplay =
      plan.price == null || plan.price === 0 ? "" : `${currencySymbol}${plan.price}${plan.billing ? ` / ${plan.billing}` : ""}`
    const showPrice = plan.price != null && plan.price !== 0
    const features = Array.isArray(plan.features)
      ? plan.features.filter((f): f is string => typeof f === "string" && f.trim() !== "")
      : []
    const ctaHref = plan.payment_url?.trim() || "#"
    const ctaText = plan.price == null || plan.price === 0 ? "Get Started" : `Choose ${plan.name}`

    if (isCompact) {
      const firstPlanFeatures = features.slice(0, 6)
      return (
        <div
          key={plan.id}
          className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl border border-blue-200 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="md:w-1/4 text-center md:text-center">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              {plan.description?.trim() && (
                <div className="text-sm mt-2">
                  <TextBlock text={plan.description} />
                </div>
              )}
            </div>
            <div className="md:w-2/4 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {firstPlanFeatures.map((f, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <i className="fa-solid fa-check mt-1 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/4 md:text-right">
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full md:w-auto md:inline-block text-center px-8 py-4 bg-white rounded-full border-2 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {ctaText}
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={plan.id}
        className={
          isPopular
            ? "bg-gradient-to-br from-purple-100 to-white rounded-2xl shadow-2xl p-8 border-2 border-purple-300 relative"
            : "bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8 border border-blue-200"
        }
      >
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </span>
          </div>
        )}
        <div className={`text-center mb-6 ${isPopular ? "pt-2" : ""}`}>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          {showPrice && <p className="text-3xl font-bold text-gray-900">{priceDisplay}</p>}
          {plan.description?.trim() && (
            <div className="text-sm mt-2 mb-4 text-center">
              <TextBlock text={plan.description} />
            </div>
          )}
        </div>
        <ul className="space-y-2 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-start space-x-3">
              <i className={`fa-solid fa-check mt-1 ${isPopular ? "text-purple-600" : "text-blue-500"}`} />
              <span className="text-sm text-gray-700">{f}</span>
            </li>
          ))}
        </ul>
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className={
            isPopular
              ? "block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
              : "block w-full text-center px-8 py-4 bg-white rounded-full border-2 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
          }
          style={!isPopular ? { color: accentColor, borderColor: accentColor } : undefined}
        >
          {ctaText}
        </a>
      </div>
    )
  }

  const bg = getSectionBg(sectionIndex, "membership_plans")
  return (
    <section id="membership-plans" className={`py-16 md:py-24 ${bg}`}>
      <div className="max-w-6xl mx-auto px-6 text-center">
        {headline && (
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
        )}
        {subheadline && (
          <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mt-4 mb-12">
            <TextBlock text={subheadline} className="text-slate-600" />
          </div>
        )}
        {plans.length === 0 ? null : freePlan && plans.length === 4 ? (
          <>
            <div className="mb-12">
              {renderPlanCard(freePlan, true)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paidPlans.map((p) => renderPlanCard(p))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {plans.map((p) => renderPlanCard(p))}
          </div>
        )}
      </div>
    </section>
  )
}

function getContentBullets(c: Record<string, unknown> | undefined): string[] {
  const raw = c ?? {}
  const legacy = [raw.bullet_1 ?? raw.bullet1, raw.bullet_2 ?? raw.bullet2, raw.bullet_3 ?? raw.bullet3].filter(
    Boolean
  ) as string[]
  if (Array.isArray(raw.bullets) && raw.bullets.length > 0) {
    return raw.bullets as string[]
  }
  return legacy
}

function getSectionBg(index: number, sectionType: string): string {
  if (sectionType === "hero") return "bg-white"
  return index % 2 === 0 ? "bg-white" : "bg-slate-50"
}

export function SalesSectionRenderer({
  section,
  accentColor = "#2563eb",
  sectionIndex = 0,
}: {
  section: SalesPageSection
  accentColor?: string
  sectionIndex?: number
}) {
  if (section.enabled === false) return null

  const c = (section.content ?? {}) as Record<string, unknown>

  if (section.type === "hero") {
    const headline = getContentValue(c, "headline")
    const heroText = getContentValue(c, "hero_text") || getContentValue(c, "subheadline")
    const videoUrl = getContentValue(c, "video_url")
    const heroImage = getContentValue(c, "hero_image") || getContentValue(c, "background_image")
    const embedVideo = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null
    const buttonText = getContentValue(c, "primary_button_text")
    const buttonAnchor = getContentValue(c, "primary_button_anchor") || getContentValue(c, "primary_button_link") || "#membership-plans"
    const href = buttonAnchor.startsWith("#") ? buttonAnchor : buttonAnchor.startsWith("http") ? buttonAnchor : `#${buttonAnchor}`
    const backgroundImage = c.backgroundImage === true || c.backgroundImage === "true"

    if (backgroundImage && (heroImage || videoUrl)) {
      return (
        <section
          id="hero"
          className="relative py-16 md:py-24 overflow-hidden text-white"
          style={
            heroImage && !videoUrl
              ? {
                  backgroundImage: `url(${heroImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {heroImage && !videoUrl && (
            <div className="absolute inset-0 bg-black/40" aria-hidden />
          )}
          {videoUrl && (
            <div className="absolute inset-0">
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            {headline && (
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-6">
                {headline}
              </h1>
            )}
          {heroText && (
            <div className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed mb-8">
              <TextBlock text={heroText} className="text-white/90" />
            </div>
          )}
            {buttonText && (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-block px-6 py-3 rounded-full bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition"
                style={accentColor !== "#2563eb" ? { backgroundColor: accentColor } : undefined}
              >
                {buttonText}
              </a>
            )}
          </div>
        </section>
      )
    }

    return (
      <section id="hero" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            {headline && (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                {headline}
              </h1>
            )}
            {heroText && (
              <div className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-8">
                <TextBlock text={heroText} className="text-slate-600" />
              </div>
            )}
            {buttonText && (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-block px-6 py-3 rounded-full bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition"
                style={accentColor !== "#2563eb" ? { backgroundColor: accentColor } : undefined}
              >
                {buttonText}
              </a>
            )}
          </div>
          <div>
            {(embedVideo || videoUrl || heroImage) && (
              <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
                {embedVideo ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={embedVideo}
                      title="Hero Video"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                ) : heroImage ? (
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="w-full h-auto"
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "member_experience") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const rawBoxes = c.boxes
    const boxes = Array.isArray(rawBoxes) ? (rawBoxes as Record<string, unknown>[]) : []

    const memberExpBg = getSectionBg(sectionIndex, "member_experience")
    return (
      <section id="member-experience" className={`py-16 md:py-24 ${memberExpBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          {headline && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center mb-6">
              {headline}
            </h2>
          )}
          {subheadline && (
            <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed text-center mb-12">
              <TextBlock text={subheadline} className="text-slate-600" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {boxes.map((box: Record<string, unknown>, i: number) => {
              const icon = typeof box.icon === "string" ? box.icon : ""
              const title = typeof box.title === "string" ? box.title : ""
              const b1 = typeof box.bullet1 === "string" ? box.bullet1 : ""
              const b2 = typeof box.bullet2 === "string" ? box.bullet2 : ""
              const b3 = typeof box.bullet3 === "string" ? box.bullet3 : ""
              const bullets = [b1, b2, b3].filter(Boolean)

              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {icon && (
                    <div className="mb-4">
                      <img
                        src={icon}
                        alt=""
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  )}
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {title}
                    </h3>
                  )}
                  {bullets.length > 0 && (
                    <ul className="space-y-3">
                      {bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <i
                            className="fa-solid fa-check mt-1 flex-shrink-0"
                            style={{ color: accentColor }}
                          />
                          <span className="text-gray-700">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "community_features") {
    const headline = getContentValue(c, "headline")
    const rawFeatures = c.features
    const features = Array.isArray(rawFeatures) ? (rawFeatures as Record<string, unknown>[]) : []

    const cfBg = getSectionBg(sectionIndex, "community_features")
    return (
      <section id="community-features" className={`py-16 md:py-24 ${cfBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          {headline && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center mb-12">
              {headline}
            </h2>
          )}
          <div className="flex flex-col gap-y-20">
            {features.map((feat: Record<string, unknown>, i: number) => {
              const img = typeof feat.image === "string" ? feat.image : ""
              const title = typeof feat.title === "string" ? feat.title : ""
              const desc = typeof feat.description === "string" ? feat.description : ""
              const b1 = typeof feat.bullet1 === "string" ? feat.bullet1 : ""
              const b2 = typeof feat.bullet2 === "string" ? feat.bullet2 : ""
              const b3 = typeof feat.bullet3 === "string" ? feat.bullet3 : ""
              const bullets = [b1, b2, b3].filter(Boolean)
              const textLeft = i % 2 === 0

              return (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
                >
                  <div className={textLeft ? "md:order-1" : "md:order-2"}>
                    {title && (
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {title}
                      </h3>
                    )}
                    {desc && (
                      <div className="text-lg text-slate-600 max-w-2xl leading-relaxed mb-6">
                        <TextBlock text={desc} className="text-slate-600" />
                      </div>
                    )}
                    {bullets.length > 0 && (
                      <ul className="space-y-3">
                        {bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <i
                              className="fa-solid fa-check mt-1 flex-shrink-0"
                              style={{ color: accentColor }}
                            />
                            <span className="text-gray-700">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={textLeft ? "md:order-2" : "md:order-1"}>
                    {img && (
                      <div className="rounded-xl overflow-hidden shadow-xl">
                        <img
                          src={img}
                          alt={title || ""}
                          className="w-full h-auto object-cover"
                        />
                        {title && (
                          <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2 text-center">
                            {title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "tool_highlight") {
    const badgeTitle = getContentValue(c, "badge_title")
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const imageUrl = getContentValue(c, "image")
    const rawFeatures = c.features
    const features = Array.isArray(rawFeatures) ? (rawFeatures as Record<string, unknown>[]) : []

    const toolBg = getSectionBg(sectionIndex, "tool_highlight")
    return (
      <section id="tool-highlight" className={`py-16 md:py-24 ${toolBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            {badgeTitle && (
              <div className="inline-block rounded-full px-4 py-1 text-xs font-semibold bg-purple-100 text-purple-700 uppercase tracking-wide mb-6">
                {badgeTitle}
              </div>
            )}
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
            )}
            {subheadline && (
              <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                <TextBlock text={subheadline} className="text-slate-600" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {features.map((f: Record<string, unknown>, i: number) => {
                const icon = typeof f.icon === "string" ? f.icon : ""
                const title = typeof f.title === "string" ? f.title : ""
                const subtitle = typeof f.subtitle === "string" ? f.subtitle : ""
                if (!title && !subtitle) return null
                return (
                  <div key={i} className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm">
                    {icon && (
                      <img
                        src={icon}
                        className="w-10 h-10 object-contain flex-shrink-0"
                        alt=""
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {title}
                      </h4>
                      {subtitle && (
                        <div className="text-sm text-slate-600">
                          <TextBlock text={subtitle} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {imageUrl && (
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "masterclasses_highlight") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const imageUrl = getContentValue(c, "image")
    const rawBoxes = c.boxes
    const boxes = Array.isArray(rawBoxes) ? (rawBoxes as Record<string, unknown>[]) : []

    const masterBg = getSectionBg(sectionIndex, "masterclasses_highlight")
    return (
      <section id="masterclasses-highlight" className={`py-16 md:py-24 ${masterBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
            )}
            {subheadline && (
              <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                <TextBlock text={subheadline} className="text-slate-600" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {boxes.map((b: Record<string, unknown>, i: number) => {
                const title = typeof b.title === "string" ? b.title : ""
                const text = typeof b.text === "string" ? b.text : ""
                const bullets = Array.isArray(b.bullets) ? (b.bullets as unknown[]).filter((x) => x != null && String(x).trim() !== "").map((x) => String(x)) : []
                const iconBg = i === 0 ? "bg-green-500" : i === 1 ? "bg-blue-500" : "bg-purple-500"
                const iconFa = i === 0 ? "fa-video" : i === 1 ? "fa-user-graduate" : "fa-microphone"
                return (
                  <div
                    key={i}
                    className="rounded-xl p-[1px] bg-gradient-to-br from-green-200 via-blue-200 to-purple-200 transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="bg-white rounded-xl p-6 h-full">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} text-white mb-4`}>
                        <i className={`fa-solid ${iconFa}`} />
                      </div>
                      {title && <h4 className="text-lg font-semibold text-slate-900 mb-3">{title}</h4>}
                      {text && (
                        <div className="text-sm text-slate-600">
                          <TextBlock text={text} />
                        </div>
                      )}
                      {bullets.length > 0 && (
                        <ul className="space-y-1 text-sm text-slate-600 list-disc pl-5 mt-2">
                          {bullets.map((bullet, j) => (
                            <li key={j}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {imageUrl && (
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "marketplace_section" || section.type === "marketplace") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const imageUrl = getContentValue(c, "image_url")
    const rawHighlights = c.highlights
    const highlights = Array.isArray(rawHighlights) ? (rawHighlights as Record<string, unknown>[]) : []

    const marketBg = getSectionBg(sectionIndex, "marketplace")
    return (
      <section id="marketplace" className={`py-16 md:py-24 ${marketBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
            )}
            {subheadline && (
              <div className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                <TextBlock text={subheadline} className="text-slate-600" />
              </div>
            )}
              {highlights.length > 0 && (
                <div className="space-y-4">
                  {highlights.map((h: Record<string, unknown>, i: number) => {
                    const title = typeof h.title === "string" ? h.title : ""
                    const text = typeof h.text === "string" ? h.text : ""
                    if (!title && !text) return null
                    return (
                      <div key={i} className="flex items-start space-x-3">
                        <div>
                          {title && <h4 className="font-bold text-gray-900">{title}</h4>}
                          {text && (
                            <div className="text-gray-600">
                              <TextBlock text={text} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {imageUrl && (
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "courses_section" || section.type === "courses") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const featuredImage = getContentValue(c, "featured_image")
    const free = (c.free_courses ?? {}) as Record<string, unknown>
    const member = (c.member_courses ?? {}) as Record<string, unknown>
    const paid = (c.paid_courses ?? {}) as Record<string, unknown>

    const getCard = (o: Record<string, unknown>) => ({
      description: String(o.description ?? ""),
      bullet1: String(o.bullet1 ?? ""),
      bullet2: String(o.bullet2 ?? ""),
      bullet3: String(o.bullet3 ?? ""),
    })
    const freeCard = getCard(free)
    const memberCard = getCard(member)
    const paidCard = getCard(paid)

    const bullets = (b1: string, b2: string, b3: string, color: string) => {
      const items = [b1, b2, b3].filter(Boolean)
      if (items.length === 0) return null
      return (
        <ul className="space-y-3">
          {items.map((b, i) => (
            <li key={i} className="flex items-start space-x-3">
              <i className={`fa-solid fa-check mt-1 ${color}`} />
              <span className="text-gray-700">{b}</span>
            </li>
          ))}
        </ul>
      )
    }

    const coursesBg = getSectionBg(sectionIndex, "courses")
    return (
      <section id="courses" className={`py-16 md:py-24 ${coursesBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            {headline && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
            )}
            {subheadline && (
              <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                <TextBlock text={subheadline} className="text-slate-600" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-8 border border-green-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-gift text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Courses</h3>
              {freeCard.description && (
                <div className="text-gray-600 mb-6">
                  <TextBlock text={freeCard.description} />
                </div>
              )}
              {bullets(freeCard.bullet1, freeCard.bullet2, freeCard.bullet3, "text-green-500")}
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl shadow-xl p-8 border border-brand-200 hover:shadow-2xl transition transform scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-crown text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Member-Level Courses</h3>
              {memberCard.description && (
                <div className="text-gray-600 mb-6">
                  <TextBlock text={memberCard.description} />
                </div>
              )}
              {bullets(memberCard.bullet1, memberCard.bullet2, memberCard.bullet3, "text-brand-500")}
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl p-8 border border-purple-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-gem text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Paid Courses</h3>
              {paidCard.description && (
                <div className="text-gray-600 mb-6">
                  <TextBlock text={paidCard.description} />
                </div>
              )}
              {bullets(paidCard.bullet1, paidCard.bullet2, paidCard.bullet3, "text-purple-500")}
            </div>
          </div>
          {featuredImage && (
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img src={featuredImage} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </section>
    )
  }

  if (section.type === "education_section" || section.type === "education") {
    return (
      <EducationSectionContent
        content={c}
        accentColor={accentColor}
        sectionIndex={sectionIndex}
      />
    )
  }

  if (section.type === "membership_plans") {
    return (
      <MembershipPlansSectionContent
        content={c}
        accentColor={accentColor}
        sectionIndex={sectionIndex}
      />
    )
  }

  if (section.type === "founders_bridge") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const buttonText = getContentValue(c, "button_text")
    const buttonUrl = getContentValue(c, "button_url")
    const href = buttonUrl?.trim() || "#"

    const foundersBg = getSectionBg(sectionIndex, "founders_bridge")
    return (
      <section id="founders-bridge" className={`py-16 md:py-24 ${foundersBg}`}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          {headline && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>
          )}
          {subheadline && (
            <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              <TextBlock text={subheadline} className="text-slate-600" />
            </div>
          )}
          {buttonText && (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-block px-6 py-3 rounded-full bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition"
              style={accentColor !== "#2563eb" ? { backgroundColor: accentColor } : undefined}
            >
              {buttonText}
            </a>
          )}
        </div>
      </section>
    )
  }

  if (section.type === "generic") {
    const headline = getContentValue(c, "headline")
    const body = getContentValue(c, "body")
    const image = getContentValue(c, "image")
    const videoUrl = getContentValue(c, "video_url")
    const layout = getContentValue(c, "layout") || "image-right"
    const rawBullets = c.bullets
    const bullets = Array.isArray(rawBullets) ? (rawBullets as string[]).filter((b) => typeof b === "string" && b.trim() !== "") : []

    const hasMedia = (layout.includes("image") && image) || (layout.includes("video") && videoUrl)
    const textFirst = layout === "image-right" || layout === "video-right"

    const getVideoEmbedUrl = (url: string): string => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      return m ? `https://www.youtube.com/embed/${m[1]}` : url
    }

    const mediaBlock = layout.includes("video") && videoUrl ? (
      <div className="aspect-video rounded-xl overflow-hidden shadow-xl">
        {videoUrl.includes("youtube") || videoUrl.includes("youtu.be") ? (
          <iframe
            src={getVideoEmbedUrl(videoUrl)}
            className="w-full h-full"
            allowFullScreen
            title="Video"
          />
        ) : (
          <video src={videoUrl} controls className="w-full h-full object-cover" />
        )}
      </div>
    ) : image ? (
      <div className="rounded-xl overflow-hidden shadow-xl">
        <img src={image} alt="" className="w-full object-cover" />
      </div>
    ) : null

    const textBlock = (
      <div className="space-y-6">
        {headline && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">{headline}</h2>}
        {body && (
          <div className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            <TextBlock text={body} className="text-slate-600" />
          </div>
        )}
        {bullets.length > 0 && (
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    )

    const genericBg = getSectionBg(sectionIndex, "generic")
    return (
      <section id="generic" className={`py-16 md:py-24 ${genericBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className={`grid md:grid-cols-2 gap-12 items-center ${textFirst ? "" : ""}`}>
            {textFirst ? (
              <>
                <div>{textBlock}</div>
                {hasMedia && <div>{mediaBlock}</div>}
              </>
            ) : (
              <>
                {hasMedia && <div>{mediaBlock}</div>}
                <div>{textBlock}</div>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "community_vision") {
    const headline = getContentValue(c, "headline")
    const body = getContentValue(c, "body")
    const boxSubheadline = getContentValue(c, "box_subheadline") || "Who it's for:"
    const image = getContentValue(c, "image")
    const bullets = getContentBullets(c)

    const visionBg = getSectionBg(sectionIndex, "community_vision")
    return (
      <section id="community-vision" className={`py-16 md:py-24 ${visionBg}`}>
        <div className="max-w-6xl mx-auto px-6">
          {headline && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 text-center mb-12">
              {headline}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              {image && (
                <div className="rounded-xl overflow-hidden shadow-xl">
                  <img
                    src={image}
                    alt=""
                    className="w-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="order-1 md:order-2 space-y-6">
              {body && (
                <div className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                  <TextBlock text={body} className="text-slate-600" />
                </div>
              )}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm mt-6">
                {boxSubheadline && (
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-blue-700">
                    {boxSubheadline}
                  </h4>
                )}
                {bullets.length > 0 && (
                  <ul className="space-y-2">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-1">★</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (section.type === "cta" || section.type === "call_to_action") {
    const headline = getContentValue(c, "headline")
    const subheadline = getContentValue(c, "subheadline")
    const buttonText = getContentValue(c, "button_text")
    const buttonUrl =
      getContentValue(c, "button_url") ||
      getContentValue(c, "button_link") ||
      getContentValue(c, "link") ||
      getContentValue(c, "url")

    const href = buttonUrl?.trim() || "#"
    const bg = getSectionBg(sectionIndex, "cta")

    return (
      <section id="cta" className={`py-16 md:py-24 ${bg}`}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          {headline && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">
              {headline}
            </h2>
          )}

          {subheadline && (
            <div className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              <TextBlock text={subheadline} className="text-slate-600" />
            </div>
          )}

          {buttonText && (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-block px-6 py-3 rounded-full bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 hover:shadow-md transition"
              style={accentColor !== "#2563eb" ? { backgroundColor: accentColor } : undefined}
            >
              {buttonText}
            </a>
          )}
        </div>
      </section>
    )
  }

  return null
}
