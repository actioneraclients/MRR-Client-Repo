import { createClient } from "@/lib/supabase/server"
import OptInForm from "@/app/[slug]/opt-in-form"

export type OptInPageData = {
  id: string
  name: string
  slug: string
  is_active: boolean
  logo_enabled: boolean | null
  use_brand_background: boolean | null
  use_background_color: boolean
  background_color: string | null
  headline: string | null
  left_subheadline: string | null
  left_body: string | null
  left_bullets: string[] | null
  video_url: string | null
  image_url: string | null
  cta_text: string | null
  confirmation_message: string | null
  plan_id: string | null
  [key: string]: unknown
}

export async function OptInPageRenderer({
  page,
  slug,
}: {
  page: OptInPageData
  slug: string
}) {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "brand_primary_color, brand_accent_color, brand_background_color, brand_logo_url, site_terms_url, site_privacy_url"
    )
    .eq("id", 1)
    .maybeSingle()

  const primary = settings?.brand_primary_color || "#0f172a"
  const accent = settings?.brand_accent_color || "#2563eb"

  const backgroundColor =
    page.use_brand_background && settings?.brand_background_color
      ? settings.brand_background_color
      : "#ffffff"

  const bullets: string[] = Array.isArray(page.left_bullets) ? page.left_bullets : []
  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor }}
    >
      {page.logo_enabled && brandLogoUrl && (
        <div className="pt-12 pb-6 text-center">
          <img
            src={brandLogoUrl}
            alt="Brand Logo"
            className="mx-auto h-14 w-auto object-contain"
          />
        </div>
      )}

      {page.headline && (
        <div className="px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight"
              style={{ color: primary }}
            >
              {page.headline}
            </h1>
          </div>
        </div>
      )}

      <main className="flex-1 px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.2fr_0.8fr] gap-16 items-start">
          <div>
            {page.video_url ? (
              page.video_url.includes("youtube") ||
              page.video_url.includes("youtu.be") ||
              page.video_url.includes("vimeo") ? (
                <div className="w-full max-w-full aspect-video mb-8">
                  {page.video_url.includes("youtube") || page.video_url.includes("youtu.be") ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${
                        page.video_url.split("v=")[1]?.split("&")[0] ||
                        page.video_url.split("youtu.be/")[1]
                      }`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <iframe
                      src={`https://player.vimeo.com/video/${
                        page.video_url.split("vimeo.com/")[1]
                      }`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <div className="mb-8">
                  <video
                    src={page.video_url}
                    controls
                    className="w-full max-h-[400px] mx-auto"
                  />
                </div>
              )
            ) : page.image_url ? (
              <div className="w-full flex justify-center mb-8">
                <div className="w-full max-w-full">
                  <img
                    src={page.image_url}
                    alt=""
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </div>
              </div>
            ) : null}

            {page.left_subheadline && (
              <p className="mt-4 font-semibold text-gray-900">{page.left_subheadline}</p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-6 space-y-4 mb-10">
                {bullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-2 w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                    <span className="text-gray-800">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {page.left_body && (
              <p className="text-gray-700 mb-8 leading-relaxed">{page.left_body}</p>
            )}

            {page.cta_text && (
              <p className="text-lg font-semibold" style={{ color: primary }}>
                {page.cta_text}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl pt-6 pb-10 px-10 border border-gray-100 max-w-md mx-auto md:mx-0">
            <OptInForm slug={slug} />
          </div>
        </div>
      </main>

      <footer className="py-10 text-center text-sm text-gray-500 border-t border-gray-100">
        <div className="space-x-6">
          <a href="/terms" className="hover:underline">
            Terms
          </a>
          <a href="/privacy" className="hover:underline">
            Privacy
          </a>
        </div>
        <div className="mt-4">© {new Date().getFullYear()} All Rights Reserved.</div>
      </footer>
    </div>
  )
}
