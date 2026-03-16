export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { notFound } from "next/navigation"
import { getOptInPageBySlug } from "../actions"

export default async function OptInConfirmPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const optInPage = await getOptInPageBySlug(slug)
  if (!optInPage) notFound()

  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const message =
    (optInPage.confirmation_message as string | null) ||
    "Thank you for registering. Check your email to confirm your account."

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg p-8 text-center">
        {brandLogoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={brandLogoUrl}
              alt="Brand Logo"
              className="h-10 w-auto max-w-[140px] object-contain"
            />
          </div>
        )}

        <h1 className="text-2xl font-semibold text-slate-900">
          You&apos;re Almost Done
        </h1>

        <p className="mt-4 text-slate-600 text-sm leading-relaxed">
          {message}
        </p>

        <a
          href="/login"
          className="mt-6 inline-block w-full rounded-xl bg-black text-white py-2.5 font-medium hover:opacity-90 transition"
        >
          Log In
        </a>
      </div>
    </div>
  )
}
