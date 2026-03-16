import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getAboutPage } from "./actions"
import OffersSection, { type OffersContent } from "./OffersSection"
import TeamSection, { type TeamContent } from "./TeamSection"

async function Footer() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("site_settings")
    .select("footer_copyright")
    .limit(1)
    .single()

  return (
    <footer className="w-full py-12 bg-charcoal text-cream mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div>
          {settings?.footer_copyright || "© 2026 Your Brand. All rights reserved."}
        </div>

        <div className="flex gap-6">
          <a href="/terms" className="hover:underline">Terms</a>
          <a href="/privacy" className="hover:underline">Privacy</a>
        </div>
      </div>
    </footer>
  )
}

export default async function AboutPage() {
  const about = await getAboutPage()

  if (!about || !about.sections) {
    return null
  }

  if (about.is_published === false) {
    return null
  }

  const supabase = await createClient()
  const { data: settings } = await supabase
    .from("site_settings")
    .select("brand_background_color, brand_primary_color, brand_accent_color")
    .limit(1)
    .single()

  const brandBackground = settings?.brand_background_color || "#f7f4ef"
  const brandPrimary = settings?.brand_primary_color || "#1f2937"
  const brandAccent = settings?.brand_accent_color || "#d97706"

  const sections = about.sections as Array<{
    id: string
    type: string
    enabled?: boolean
    content: Record<string, unknown>
  }>

  return (
    <main id="about-main" className="w-full font-sans text-charcoal">
      {sections
        .filter((section) => section.enabled !== false)
        .map((section) => {
          switch (section.type) {
            case "hero":
              return <HeroSection key={section.id} content={section.content as HeroContent} />
            case "philosophy":
              return <PhilosophySection key={section.id} content={section.content as PhilosophyContent} />
            case "story":
              return <StorySection key={section.id} content={section.content as StoryContent} />
            case "community_intro":
              return (
                <CommunityIntroSection
                  key={section.id}
                  content={section.content as CommunityIntroContent}
                  brandBackground={brandBackground}
                  brandPrimary={brandPrimary}
                  brandAccent={brandAccent}
                />
              )
            case "offers":
              return <OffersSection key={section.id} content={section.content as OffersContent} />
            case "visual_break":
              return <VisualBreakSection key={section.id} content={section.content as VisualBreakContent} brandPrimary={brandPrimary} />
            case "community_cta":
              return <CommunitySection key={section.id} content={section.content as CommunityContent} />
            case "generic":
              return <GenericSection key={section.id} content={section.content as GenericContent} />
            case "team":
              return (
                <TeamSection
                  key={section.id}
                  content={section.content as TeamContent}
                  brandBackground={brandBackground}
                  brandPrimary={brandPrimary}
                  brandAccent={brandAccent}
                />
              )
            default:
              return null
          }
        })}
      <Footer />
    </main>
  )
}

function resolveBackground(
  section: { background_mode?: string; background_color?: string },
  brandBackground: string,
  brandPrimary: string,
  brandAccent: string
) {
  switch (section.background_mode) {
    case "white":
      return "#ffffff"
    case "brand_background":
      return brandBackground
    case "brand_primary":
      return brandPrimary
    case "brand_accent":
      return brandAccent
    case "custom":
      return section.background_color || brandBackground
    default:
      return "transparent"
  }
}

// --- Content types ---
type HeroContent = { headline?: string; subheadline?: string; image_url?: string; ctas?: Array<{ label: string; href: string }> }
type PhilosophyContent = { heading?: string; paragraphs?: string[] }
type StoryContent = { heading?: string; image_url?: string; paragraphs?: string[]; pull_quote?: string }
type CommunityIntroContent = {
  heading?: string
  subheading?: string
  body?: string
  bullets?: string[]
  image_url?: string
  video_url?: string
  layout?: string
  cta?: {
    mode: "community" | "external"
    label: string
    url?: string
  }
}
type VisualBreakContent = { headline?: string; subheadline?: string }
type CommunityContent = { heading?: string; paragraphs?: string[]; cta_text?: string; cta_url?: string; icon?: string }
type GenericContent = {
  headline?: string
  body?: string
  image_url?: string
  video_url?: string
  layout?: string
  bullets?: string[]
}

// --- Section components ---
function HeroSection({ content }: { content: HeroContent }) {
  return (
    <section id="hero-section" className="relative w-full h-[680px] lg:h-[720px] overflow-hidden bg-cream paper-texture">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 h-full items-center">
          <div className="flex flex-col justify-center space-y-8 pt-16 lg:pt-0">
            <h1 className="font-serif font-bold text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] text-charcoal">
              {content.headline || ""}
            </h1>
            <p className="font-sans text-lg md:text-xl lg:text-2xl text-charcoal/70 leading-relaxed max-w-xl font-light">
              {content.subheadline || ""}
            </p>
            {content.ctas && content.ctas.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {content.ctas.map((cta, i) => (
                  <a
                    key={i}
                    href={cta.href}
                    className={
                      i === 0
                        ? "inline-block px-8 py-4 bg-charcoal text-cream font-sans text-sm tracking-wider uppercase hover:bg-charcoal/90 transition-all duration-300"
                        : "inline-block px-8 py-4 border border-charcoal/30 text-charcoal font-sans text-sm tracking-wider uppercase hover:border-charcoal hover:bg-charcoal/5 transition-all duration-300"
                    }
                  >
                    {cta.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {content.image_url && (
            <div className="relative hidden lg:block h-full">
              <div className="absolute inset-0 flex items-center justify-end">
                <div className="w-[420px] h-[560px] relative">
                  <Image
                    src={content.image_url}
                    alt="About hero"
                    width={420}
                    height={560}
                    className="w-full h-full object-cover shadow-2xl"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PhilosophySection({ content }: { content: PhilosophyContent }) {
  return (
    <section id="philosophy-section" className="w-full py-24 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-charcoal mb-12 leading-tight">
          {content.heading || ""}
        </h2>
        <div className="space-y-8 font-sans text-base md:text-lg lg:text-xl text-charcoal/80 leading-loose font-light">
          {content.paragraphs?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

function StorySection({ content }: { content: StoryContent }) {
  return (
    <section id="story-section" className="relative w-full py-24 lg:py-32 bg-cream paper-texture overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {content.image_url && (
            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-[480px] lg:h-[620px]">
                <Image
                  src={content.image_url}
                  alt="Story"
                  width={620}
                  height={480}
                  className="w-full h-full object-cover shadow-xl"
                />
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-terracotta/10 -z-10" />
              </div>
            </div>
          )}

          <div className={content.image_url ? "lg:col-span-7 space-y-8" : "lg:col-span-12 space-y-8"}>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal leading-tight">
              {content.heading || ""}
            </h2>

            <div className="space-y-6 font-sans text-base md:text-lg text-charcoal/80 leading-relaxed">
              {content.paragraphs?.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {content.pull_quote && (
                <div className="my-12 pl-8 border-l-4 border-terracotta py-4">
                  <p className="font-serif text-2xl md:text-3xl lg:text-4xl text-charcoal/90 italic leading-snug">
                    &quot;{content.pull_quote}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CommunityIntroSection({
  content,
  brandBackground,
  brandPrimary,
  brandAccent,
}: {
  content: CommunityIntroContent
  brandBackground: string
  brandPrimary: string
  brandAccent: string
}) {
  return (
    <section
      className="w-full py-24 lg:py-32"
      style={{ backgroundColor: brandBackground }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">

        {/* TEXT LEFT */}
        <div className="space-y-6">

          {content.subheading && (
            <div
              className="text-sm uppercase tracking-widest"
              style={{ color: brandAccent }}
            >
              {content.subheading}
            </div>
          )}

          <h2
            className="font-serif text-4xl lg:text-5xl font-bold"
            style={{ color: brandPrimary }}
          >
            {content.heading}
          </h2>

          {content.body && (
            <p className="leading-relaxed text-charcoal/80">
              {content.body}
            </p>
          )}

          {content.bullets && (
            <div className="space-y-3 pt-4">
              {content.bullets.map((b, i) => (
                <div key={i} className="flex gap-3">
                  <span style={{ color: brandAccent }}>•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {content.cta && (
            <a
              href={content.cta.mode === "community" ? "/register" : (content.cta.url || "#")}
              target={content.cta.mode === "external" ? "_blank" : undefined}
              rel={content.cta.mode === "external" ? "noopener noreferrer" : undefined}
              className="inline-block px-8 py-4 uppercase tracking-wide text-sm transition hover:opacity-90"
              style={{
                backgroundColor: brandPrimary,
                color: "#ffffff",
              }}
            >
              {content.cta.label}
            </a>
          )}
        </div>

        {/* IMAGE RIGHT */}
        {content.image_url && (
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={content.image_url}
              alt={content.heading || ""}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover shadow-xl rounded-2xl"
            />
          </div>
        )}

      </div>
    </section>
  )
}

function VisualBreakSection({ content, brandPrimary }: { content: VisualBreakContent; brandPrimary: string }) {
  return (
    <section
      id="visual-break-section"
      className="relative w-full h-[480px] lg:h-[560px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: brandPrimary }}
    >
      <div className="paper-texture-dark absolute inset-0" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-8">
          {content.headline || ""}
        </h2>
        <p className="font-sans text-lg md:text-xl lg:text-2xl text-white/80 font-light leading-relaxed max-w-3xl mx-auto">
          {content.subheadline || ""}
        </p>
      </div>
    </section>
  )
}

function CommunitySection({ content }: { content: CommunityContent }) {
  return (
    <section id="community-section" className="w-full py-24 lg:py-32 bg-cream paper-texture">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <div className="mb-12">
          <div className="w-20 h-20 bg-terracotta/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className={`${content.icon || "fa-solid fa-heart"} text-terracotta text-3xl`} />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal mb-8 leading-tight">
            {content.heading || ""}
          </h2>
          {content.paragraphs?.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "font-sans text-base md:text-lg lg:text-xl text-charcoal/80 leading-relaxed max-w-2xl mx-auto mb-8"
                  : "font-sans text-base md:text-lg text-charcoal/70 leading-relaxed max-w-2xl mx-auto"
              }
            >
              {p}
            </p>
          ))}
        </div>
        {content.cta_text && content.cta_url && (
          <div className="pt-8">
            <a
              href={content.cta_url}
              className="inline-block px-10 py-5 bg-charcoal text-cream font-sans text-sm tracking-wider uppercase hover:bg-charcoal/90 transition-all duration-300"
            >
              {content.cta_text}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function GenericSection({ content }: { content: GenericContent }) {
  return (
    <section className="w-full py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
        {content.layout?.includes("video") && content.video_url && (
          <div className="aspect-video">
            <iframe src={content.video_url} className="w-full h-full" allowFullScreen title="Video" />
          </div>
        )}

        {content.layout?.includes("image") && content.image_url && (
          <div className="relative h-[480px] w-full">
            <Image
              src={content.image_url}
              alt="Section"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-6">
          <h2 className="font-serif text-4xl font-bold text-charcoal">{content.headline || ""}</h2>
          <p className="text-charcoal/80 leading-relaxed">{content.body || ""}</p>

          {content.bullets?.map((b, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-terracotta">•</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
