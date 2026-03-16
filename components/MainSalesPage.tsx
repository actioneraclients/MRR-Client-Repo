import Link from "next/link"
import type { ReactNode } from "react"
import type {
  ActivePlanForSalesPage,
  SalesPageRow,
} from "@/app/admin/sales-pages/sales-page-actions"
import { getHeroVideoDisplay } from "@/lib/sales-pages/heroVideo"

/** Renders Markdown-style text (paragraphs, line breaks, **bold**, *italic*) as React nodes. No raw HTML. */
function renderMarkdownBody(text: string): ReactNode {
  if (!text || typeof text !== "string") return null
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())
  return paragraphs.map((para, i) => {
    const lineParts: ReactNode[] = []
    const lines = para.split("\n")
    lines.forEach((line, j) => {
      if (j > 0) lineParts.push(<br key={`br-${i}-${j}`} />)
      const segments = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
      segments.forEach((seg, k) => {
        const key = `${i}-${j}-${k}`
        if (seg.startsWith("**") && seg.endsWith("**"))
          lineParts.push(<strong key={key}>{seg.slice(2, -2)}</strong>)
        else if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 1)
          lineParts.push(<em key={key}>{seg.slice(1, -1)}</em>)
        else if (seg) lineParts.push(seg)
      })
    })
    return (
      <p key={i} className="text-lg text-gray-600">
        {lineParts}
      </p>
    )
  })
}

const VISION_DEFAULT_HEADLINE =
  "This Community Is Built for People Who Want to Go Deeper"
const VISION_DEFAULT_IMAGE_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/community-group-image-Y4Vv49m4TMagbGFYrlIN41GTBz51Ad.png"
const VISION_DEFAULT_BODY = (
  <>
    <p className="text-lg text-gray-600">
      This community is designed around a clear focus:{" "}
      <span className="text-gray-900 font-bold">
        helping people grow through connection, learning, and meaningful action.
      </span>
    </p>
    <p className="text-lg text-gray-600">
      It&apos;s for people who want more than endless content feeds and algorithms — they want real
      conversations, practical insight, and momentum.
    </p>
    <p className="text-lg text-gray-600">
      Members come here to explore ideas, build relationships, and move forward with support.
    </p>
  </>
)
/**
 * Shared sales page content used by the public "/" route and the admin preview modal.
 * No layout chrome (admin headers, editor UI). No preview-only props.
 * When `salesPage` is passed, it is used for Hero, logo, and future section mapping.
 */
export function MainSalesPage({
  salesPage,
  orderedPlans = [],
  stopAfterSection,
  includeAiMentorsWhenStopped,
  hideHeroButtons = false,
}: {
  salesPage?: SalesPageRow | null
  orderedPlans?: ActivePlanForSalesPage[]
  stopAfterSection?: "salesy"
  includeAiMentorsWhenStopped?: boolean
  hideHeroButtons?: boolean
}) {
  const stopAfterSalesy = stopAfterSection === "salesy"
  const logoUrl = salesPage?.logo_url ?? process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const visionHeadline = salesPage?.vision_headline ?? VISION_DEFAULT_HEADLINE
  const visionImageUrl = salesPage?.vision_image_url ?? VISION_DEFAULT_IMAGE_URL
  const visionBodyContent =
    salesPage?.vision_body_text?.trim() != null && salesPage?.vision_body_text?.trim() !== ""
      ? renderMarkdownBody(salesPage.vision_body_text)
      : VISION_DEFAULT_BODY
  const visionBulletsRaw = salesPage?.vision_who_for_bullets
  const visionBullets =
    Array.isArray(visionBulletsRaw) && visionBulletsRaw.length > 0
      ? visionBulletsRaw.filter((b): b is string => typeof b === "string" && b.trim() !== "")
      : null
  const showWhoForBlock = visionBullets != null && visionBullets.length > 0

  const educationHeadline =
    salesPage?.education_headline?.trim() ?? "Education Powered by Experts and Proven Voices"
  const showCourses = salesPage?.show_courses !== false
  const showMarketplace = salesPage?.show_marketplace !== false
  const showAiMentors = salesPage?.show_ai_mentors !== false
  const showFoundersBridge = salesPage?.show_founders_bridge !== false

  const membershipHeadline =
    salesPage?.membership_headline?.trim() ?? "Start Free. Upgrade When It Makes Sense."
  const membershipIntro =
    salesPage?.membership_intro?.trim() ??
    "Everyone can join for free and immediately experience the community.\nAs your goals grow, upgrade to unlock tools that help you build your business and amplify your message."

  return (
    <div className="font-sans bg-white">
      {/* Header with Login */}
      <header className="bg-gradient-to-b from-gray-50 to-gray-50 pt-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Link
            href="/login"
            className="px-6 py-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-all duration-200 font-semibold text-sm"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Brand Logo Section */}
      <section className="bg-gradient-to-b from-gray-50 to-gray-50 pt-8 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex justify-center">
          <img
            src={logoUrl}
            alt="Brand Logo"
            className="h-16 w-auto"
          />
        </div>
      </section>

      {/* Section 1 - Hero */}
      <section id="hero" className="py-16 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-balance">
                {salesPage?.hero_headline ?? "A Community Built for Connection, Learning, and Action"}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {salesPage?.hero_intro_text ??
                  "A modern community platform where people come together to share ideas, learn from trusted voices, and move forward — not just consume content."}
              </p>
              {!hideHeroButtons && (
                <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                  <a
                    href="#membership"
                    className="px-8 py-4 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-lg"
                  >
                    Join Free
                  </a>
                  <a
                    href="#member-experience"
                    className="px-8 py-4 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 font-semibold text-lg"
                  >
                    Explore the Community
                  </a>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-50 to-gray-100 rounded-2xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center border border-gray-200">
                {(() => {
                  const heroVideo = getHeroVideoDisplay(salesPage?.hero_video_url)
                  const heroImageUrl =
                    salesPage?.hero_image_url ??
                    "https://storage.googleapis.com/uxpilot-auth.appspot.com/XPYZqTkHKUezklygXKVAtUhWQWm1%2F9299ed61-6619-432d-9f18-daad08f3cf55.png"
                  if (heroVideo?.kind === "iframe") {
                    return (
                      <iframe
                        src={heroVideo.src}
                        title="Hero video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  }
                  if (heroVideo?.kind === "video") {
                    return (
                      <video src={heroVideo.src} controls className="w-full h-full object-cover" />
                    )
                  }
                  return (
                    <img
                      src={heroImageUrl}
                      alt="modern community platform dashboard showing member feed, groups, and engagement metrics with clean premium interface design"
                      className="w-full h-full object-cover"
                    />
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Community Vision */}
      <section id="community-vision" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance">
              {visionHeadline}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-100 to-brand-50 rounded-2xl shadow-xl overflow-hidden aspect-video flex items-center justify-center border border-gray-200">
                <img
                  src={visionImageUrl}
                  alt="Community vision illustration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">{visionBodyContent}</div>
              {showWhoForBlock && (
                <div className="bg-gradient-to-br from-brand-50 to-gray-50 rounded-xl p-8 border border-brand-100 space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Who It&apos;s For:</h3>
                  <div className="space-y-3">
                    {visionBullets!.map((bullet, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <i className="fa-solid fa-star text-brand-500 mt-1"></i>
                        <span className="text-gray-700">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - What Every Member Can Experience Here */}
      <section id="member-experience" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">What Every Member Can Experience Here</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At any membership level, members gain access to a living ecosystem designed for connection, learning, and
              momentum.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-users text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Community Connection</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Community feed and shared conversations</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Discover members via the directory</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Messaging and relationship-building</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-layer-group text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Groups & Experiences</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Join groups by topic and intent</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Participate in guided discussions</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Attend community experiences and live sessions</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-graduation-cap text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Learning & Growth</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Education content shared by selected contributors</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Courses for deeper transformation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Tools and resources to support action</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-toolbox text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tools & Resources</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Practical tools created by the community owner</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Frameworks, guides, templates, and planners</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Resources designed to support real-world action</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-robot text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Driven Support</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">AI Mentors designed around specific topics and outcomes</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Guided conversations that support clarity and progress</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">On-demand support available anytime</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-user-tie text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Access to Leading Experts</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">A curated group of respected experts and leaders</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Live trainings, shared content, and exclusive experiences</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Access to expert-led products and services inside the community</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Inside the Community (The Core Community Experience) */}
      <section id="inside-community" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">The Core Community Experience</h2>
          </div>
          <div className="space-y-32">
            {/* Feature 01 - Member Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                  Feature 01
                </div>
                <h3 className="text-4xl font-bold text-gray-900">Member Feed</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  A central place for updates, insights, and conversation — where members actually engage and contribute.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Real-time updates and member posts</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Rich media support for images, videos, and links</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Engagement through comments, reactions, and shares</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-brand-50 to-gray-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/memberfeedimage.png-PQfinrHp8BgzztCYvB31k5CZUc9xit.jpeg"
                    alt="Member Feed illustration showing desktop and mobile views of social posts with likes, comments, and user avatars"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 02 - Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="bg-gradient-to-br from-gray-100 to-brand-50 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/groupsimage.png-F4MLX0KNzNpQSbLd0quwcJbeV7R6WT.jpeg"
                    alt="Groups illustration showing Business Growth, Health & Fitness, and Personal Development group cards with Join Group buttons"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <div className="inline-block bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                  Feature 02
                </div>
                <h3 className="text-4xl font-bold text-gray-900">Groups</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Focused spaces for real discussion, accountability, and transformation — guided by leaders and members.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Topic-specific and intent-based groups</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Public and private group options</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Leader-guided discussions and accountability</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 03 - Member Directory + Messaging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                  Feature 03
                </div>
                <h3 className="text-4xl font-bold text-gray-900">Member Directory + Messaging</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Find aligned people, connect directly, and build relationships inside a trusted ecosystem.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Searchable member profiles with expertise and interests</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Direct messaging for one-on-one connections</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Filter by location, expertise, and interests</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-brand-50 to-gray-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Directory-inboximage.png-m7QmuO1eAEXhtddsRcdAbMRKPKMAB6.jpeg"
                    alt="Directory and Inbox illustration showing member listings with Message buttons on the left and chat conversation interface on the right"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Feature 04 - Community Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="bg-gradient-to-br from-gray-100 to-brand-50 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/communityeventsimage-Vkl8exiOOo8ImCMC0hSxAWoUyF18Kd.png"
                    alt="Community Events illustration showing Live Workshop, Expert Q&A Session, and Networking Meetup with View Event buttons and calendar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-6 order-1 lg:order-2">
                <div className="inline-block bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                  Feature 04
                </div>
                <h3 className="text-4xl font-bold text-gray-900">Community Events</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  A curated directory of upcoming events shared by community members — from virtual workshops and summits to in-person experiences. Community Events help members discover what's happening and explore opportunities aligned with their interests.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Upcoming virtual and in-person events shared by community members</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Easy discovery of aligned workshops, summits, trainings, and experiences</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <i className="fa-solid fa-arrow-right text-brand-500 mt-1"></i>
                    <span className="text-gray-700">Direct links to external registration and event pages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section id="education" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {educationHeadline}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              This community features content from chosen experts and leaders — so members can learn from real
              experience, not theory.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-brand-100">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4eeec44006-7d391b2c10df1c0bfabc.png"
                      alt="professional expert leader portrait, confident speaker, thought leader headshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Alex Morgan</h3>
                <p className="text-brand-600 text-center font-semibold mb-4">Community Leader · Practitioner · Guide</p>
                <p className="text-gray-600 text-center mb-6">
                  A respected voice actively contributing to the community through real-world experience, practical frameworks, and lived insight. Alex focuses on helping people move from clarity to action in their work and message, emphasizing progress over theory and meaningful contribution over noise.
                </p>
                <div className="flex justify-center space-x-3">
                  <a href="#" className="text-gray-600 hover:text-brand-600 transition">
                    <i className="fa-brands fa-linkedin text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-brand-600 transition">
                    <i className="fa-brands fa-twitter text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-brand-600 transition">
                    <i className="fa-solid fa-globe text-xl"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition">
                  <div className="h-48 bg-gradient-to-br from-brand-100 to-gray-100 flex items-center justify-center">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/XPYZqTkHKUezklygXKVAtUhWQWm1%2F9299ed61-6619-432d-9f18-daad08f3cf55.png"
                      alt="video content thumbnail, educational webinar, online course preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Video</span>
                    <h4 className="text-lg font-bold text-gray-900 mt-2 mb-2">Building Momentum Through Focused Action</h4>
                    <p className="text-gray-600 text-sm">A guided video experience breaking down key concepts, practical strategies, and real examples members can apply immediately. Designed to support understanding, reflection, and forward movement — not passive watching.</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-brand-100 flex items-center justify-center">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/90660d9a2c-a174734f25823e795df7.png"
                      alt="article blog post featured image, educational content, learning resource"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Article</span>
                    <h4 className="text-lg font-bold text-gray-900 mt-2 mb-2">Why Most Communities Fail — and What Actually Creates Engagement</h4>
                    <p className="text-gray-600 text-sm">A written deep dive exploring core ideas, patterns, and lessons drawn from real experience. Articles are designed to spark insight, challenge assumptions, and offer clear takeaways members can reflect on or discuss inside the community.</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition">
                  <div className="h-48 bg-gradient-to-br from-brand-100 to-gray-100 flex items-center justify-center">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/89bbfceebd-4a260ead314f9351622c.png"
                      alt="podcast audio content visual, microphone setup, audio learning resource"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Audio</span>
                    <h4 className="text-lg font-bold text-gray-900 mt-2 mb-2">Clarity, Consistency, and the Long Game</h4>
                    <p className="text-gray-600 text-sm">Audio content for members who prefer to learn on the go. These sessions share perspective, stories, and guidance in a conversational format — ideal for reflection during walks, commutes, or quiet thinking time.</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-brand-100 flex items-center justify-center">
                    <img
                      src="https://storage.googleapis.com/uxpilot-auth.appspot.com/63a9fc1774-48a7d784a39b7992aac1.png"
                      alt="downloadable resource template, workbook, toolkit visual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Document</span>
                    <h4 className="text-lg font-bold text-gray-900 mt-2 mb-2">Guided Framework: From Idea to Action</h4>
                    <p className="text-gray-600 text-sm">Downloadable tools designed to support real implementation. Documents may include worksheets, frameworks, templates, or guided exercises members can use to apply what they're learning inside the community.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showCourses && (
        <>
      {/* Courses Section */}
      <section id="courses" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Courses for Deeper Transformation</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Courses inside the community are designed to create real change through structured learning — including
              free courses, member-level courses, and paid courses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-xl p-8 border border-green-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-gift text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Courses</h3>
              <p className="text-gray-600 mb-6">Lead generation + onboarding into the community</p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-green-500 mt-1"></i>
                  <span className="text-gray-700">Open to all visitors</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-green-500 mt-1"></i>
                  <span className="text-gray-700">Introduction to community value</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-green-500 mt-1"></i>
                  <span className="text-gray-700">Gateway to membership</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl shadow-xl p-8 border border-brand-200 hover:shadow-2xl transition transform scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-crown text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Member-Level Courses</h3>
              <p className="text-gray-600 mb-6">Included for certain membership levels</p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Exclusive to paying members</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Core transformation content</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                  <span className="text-gray-700">Ongoing learning path</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl p-8 border border-purple-100 hover:shadow-2xl transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <i className="fa-solid fa-gem text-white text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Paid Courses</h3>
              <p className="text-gray-600 mb-6">Premium deep dives offered by selected creators</p>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-purple-500 mt-1"></i>
                  <span className="text-gray-700">Advanced specialized training</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-purple-500 mt-1"></i>
                  <span className="text-gray-700">Expert-led deep dives</span>
                </li>
                <li className="flex items-start space-x-3">
                  <i className="fa-solid fa-check text-purple-500 mt-1"></i>
                  <span className="text-gray-700">Revenue opportunity for creators</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-100 to-brand-50 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/courseimage-rjm07SbzflFSWiYieCBdJrBywLMSzX.png"
                alt="Mindful Leadership Foundations course interface showing progress tracking, module listings, and lesson navigation with 34% completion"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
        </>
      )}

      {showMarketplace && (
        <>
      {/* Marketplace Section - Products & Services */}
      <section id="marketplace" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                A Place to Feature Offers Without Feeling 'Salesy'
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Selected members can share aligned products and services — like coaching, services, programs, and
                resources — with a warm, relevant audience.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <i className="fa-solid fa-badge-check text-brand-500 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Feature coaching and service offers</h4>
                    <p className="text-gray-600">Showcase your expertise through your offerings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <i className="fa-solid fa-badge-check text-brand-500 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Create visibility with aligned members</h4>
                    <p className="text-gray-600">Reach people who already value what you do</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <i className="fa-solid fa-badge-check text-brand-500 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Build credibility through trusted association</h4>
                    <p className="text-gray-600">Your presence in the community adds authority</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <i className="fa-solid fa-badge-check text-brand-500 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Drive leads from community traffic</h4>
                    <p className="text-gray-600">Convert engaged members into clients</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-50 to-gray-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border border-gray-200">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/productsserviesimage-AW5vOGKg7uWcTifSscKSQVRzRf3n6b.png"
                  alt="Services and Products illustration showing a support representative with headset and lightbulb ideas on the left, and a shopping bag with digital products, books, and media content on the right"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      )}

      {showAiMentors && (!stopAfterSalesy || includeAiMentorsWhenStopped) && (
        <>
      {/* AI Mentors Section */}
      <section id="ai-mentors" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-gradient-to-r from-purple-100 to-brand-100 text-purple-700 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide mb-6">
              <i className="fa-solid fa-sparkles mr-2"></i>
              Powerful Feature
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              AI Mentors: Personalized Support at Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              One of the most powerful tools in the community is AI Mentors — focused AI chat experiences designed
              around specific outcomes. Members can use mentors to get guided support on demand.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-50 to-brand-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-brain text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Targeted AI guidance with clear intent and outcomes
                    </h4>
                    <p className="text-gray-600">Each mentor is designed around a specific transformation or goal</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-8 border border-brand-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-bullseye text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Mentors built around specific topics and transformations
                    </h4>
                    <p className="text-gray-600">From mindset shifts to technical skills to business strategies</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-brand-50 rounded-2xl p-8 border border-purple-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-clock text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Available 24/7 inside the platform</h4>
                    <p className="text-gray-600">Get guidance and support whenever you need it, on your schedule</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-2xl p-8 border border-brand-100">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-lightbulb text-white text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      Guided conversations that support clarity and progress
                    </h4>
                    <p className="text-gray-600">Move from confusion to action with structured AI support</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-brand-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border-2 border-purple-200">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/0aac170124-e94c3713179dbda6e10e-qeaDjRyo9sCzLjuQX4bSonM8glLZQE.png"
                  alt="AI mentor interface showing personalized guidance, starter questions, and chat functionality"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-brand-500 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-comments text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">24/7</p>
                    <p className="text-sm text-gray-600">Always Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      )}

      {!stopAfterSalesy && (
      <>
      {/* Membership Paths Section */}
      <section id="membership" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {membershipHeadline}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto whitespace-pre-line">
              {membershipIntro}
            </p>
          </div>
          {orderedPlans.length >= 4 ? (
            <>
              {/* First Plan – Compact horizontal banner card */}
              <div className="max-w-6xl mx-auto mb-12">
                <div className="w-full">
                  {(() => {
                    const plan = orderedPlans[0]
                    const features = Array.isArray(plan.features)
                      ? plan.features.filter((f): f is string => typeof f === "string" && f.trim() !== "")
                      : []
                    const firstPlanFeatures = features.slice(0, 6)
                    const ctaHref = plan.payment_url?.trim() || "#"
                    return (
                      <div
                        key={plan.id}
                        className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl border border-blue-200 p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                          {/* Left: Plan name + description (centered) */}
                          <div className="md:w-1/4 text-center md:text-center">
                            <h3 className="text-2xl font-bold text-gray-900">
                              {plan.name}
                            </h3>
                            {(plan as { description?: string }).description &&
                              (plan as { description?: string }).description!.trim() !== "" && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {(plan as { description?: string }).description}
                                </p>
                              )}
                          </div>
                          {/* Middle: Features in 2 columns */}
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
                          {/* Right: CTA */}
                          <div className="md:w-1/4 md:text-right">
                            <a
                              href={ctaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full md:w-auto md:inline-block text-center px-8 py-4 bg-white text-brand-600 rounded-full border-2 border-brand-600 hover:bg-brand-50 transition-all duration-200 font-semibold"
                            >
                              {plan.price == null || plan.price === 0 ? "Get Started" : `Choose ${plan.name}`}
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
              {/* Remaining Plans – 3 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {orderedPlans.slice(1).map((plan) => {
                  const isPopular = plan.most_popular === true
                  const currencySymbol =
                    plan.currency === "USD" || plan.currency == null || plan.currency === ""
                      ? "$"
                      : plan.currency
                  const priceDisplay =
                    plan.price == null || plan.price === 0
                      ? ""
                      : `${currencySymbol}${plan.price}${plan.billing ? ` / ${plan.billing}` : ""}`
                  const showPrice = plan.price != null && plan.price !== 0
                  const features = Array.isArray(plan.features)
                    ? plan.features.filter((f): f is string => typeof f === "string" && f.trim() !== "")
                    : []
                  const ctaHref = plan.payment_url?.trim() || "#"
                  return (
                    <div
                      key={plan.id}
                      className={
                        isPopular
                          ? "bg-gradient-to-br from-purple-100 to-brand-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-300 relative"
                          : "bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8 border border-blue-200"
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
                        {showPrice && <p className="text-3xl font-bold text-gray-900">{priceDisplay}</p>}
                        {(plan as { description?: string }).description &&
                          (plan as { description?: string }).description!.trim() !== "" && (
                            <p className="text-sm text-gray-600 mt-2 mb-4 text-center">
                              {(plan as { description?: string }).description}
                            </p>
                          )}
                      </div>
                      <ul className="space-y-2 mb-8">
                        {features.map((f, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <i
                              className={`fa-solid fa-check mt-1 ${isPopular ? "text-purple-600" : "text-blue-500"}`}
                            />
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
                            ? "block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-full hover:from-purple-700 hover:to-brand-700 transition-all duration-200 font-semibold shadow-lg"
                            : "block w-full text-center px-8 py-4 bg-white text-brand-600 rounded-full border-2 border-brand-600 hover:bg-brand-50 transition-all duration-200 font-semibold"
                        }
                      >
                        {plan.price == null || plan.price === 0 ? "Get Started" : `Choose ${plan.name}`}
                      </a>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {orderedPlans.map((plan) => {
                const isPopular = plan.most_popular === true
                const currencySymbol =
                  plan.currency === "USD" || plan.currency == null || plan.currency === ""
                    ? "$"
                    : plan.currency
                const priceDisplay =
                  plan.price == null || plan.price === 0
                    ? ""
                    : `${currencySymbol}${plan.price}${plan.billing ? ` / ${plan.billing}` : ""}`
                const showPrice = plan.price != null && plan.price !== 0
                const features = Array.isArray(plan.features)
                  ? plan.features.filter((f): f is string => typeof f === "string" && f.trim() !== "")
                  : []
                const ctaHref = plan.payment_url?.trim() || "#"
                return (
                  <div
                    key={plan.id}
                    className={
                      isPopular
                        ? "bg-gradient-to-br from-purple-100 to-brand-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-300 relative"
                        : "bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl p-8 border border-blue-200"
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
                      {showPrice && <p className="text-3xl font-bold text-gray-900">{priceDisplay}</p>}
                      {(plan as { description?: string }).description &&
                        (plan as { description?: string }).description!.trim() !== "" && (
                          <p className="text-sm text-gray-600 mt-2 mb-4 text-center">
                            {(plan as { description?: string }).description}
                          </p>
                        )}
                    </div>
                    <ul className="space-y-2 mb-8">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start space-x-3">
                          <i
                            className={`fa-solid fa-check mt-1 ${isPopular ? "text-purple-600" : "text-blue-500"}`}
                          />
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
                          ? "block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-full hover:from-purple-700 hover:to-brand-700 transition-all duration-200 font-semibold shadow-lg"
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
        </div>
      </section>

      {showFoundersBridge && (
        <>
      {/* Leaders & Creators Bridge Section */}
      <section id="leaders" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Want to Lead, Teach, Share, and Monetize Your Expertise?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            This community also supports creators, educators, and leaders who want to guide others through content,
            experiences, tools, and business or personal transformation.
          </p>
          <Link
            href="/founders"
            className="inline-block px-8 py-4 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-lg"
          >
            Learn About Becoming a Founding Leader
          </Link>
        </div>
      </section>
        </>
      )}

      {/* Final CTA Section */}
      <section id="final-cta" className="py-24 px-6 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Join the Community</h2>
          <p className="text-xl text-brand-100 mb-8">
            Whether you're here to learn, connect, or contribute — the best way to understand this community is to
            experience it from the inside.
          </p>
          <Link
            href="/reg"
            className="inline-block px-8 py-4 bg-white text-brand-700 rounded-full hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-lg"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo - Bottom Left */}
            <div className="flex items-center">
              <img
                src={logoUrl}
                alt="Brand Logo"
                className="h-8 w-auto brightness-0 invert"
              />
            </div>

            {/* Links - Center/Right */}
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

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </>
      )}
    </div>
  )
}
