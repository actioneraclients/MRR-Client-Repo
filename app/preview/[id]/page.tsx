import { notFound } from "next/navigation"
import Link from "next/link"
import { getSalesPageById } from "@/app/admin/sales-pages/builder/sales-pages-actions"
import { SalesSectionRenderer } from "@/components/admin/sales-pages/SalesSectionRenderer"

const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const page = await getSalesPageById(id)

  if (!page) {
    notFound()
  }

  const sections = (page.sections ?? []).filter((s) => s.enabled !== false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="relative py-6 shrink-0 bg-white">
        {/* Center Logo */}
        <div className="flex justify-center">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              className="h-14 object-contain"
              alt="logo"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-900">Logo</span>
          )}
        </div>

        {/* Login Button */}
        <Link
          href="/login"
          className="absolute right-6 top-6 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </header>

      <main className="flex-1">
        {sections.map((section, index) => (
          <SalesSectionRenderer key={section.id} section={section} sectionIndex={index} />
        ))}
      </main>

      <footer className="bg-slate-900 text-slate-400 mt-24 shrink-0">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="" className="h-6 opacity-80 w-auto" />
          ) : (
            <span className="text-slate-500 text-sm">Logo</span>
          )}
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition">
              Login
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
          </div>
        </div>
        <div className="text-center text-xs pb-6 opacity-70">
          © {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  )
}
