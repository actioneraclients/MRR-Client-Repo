import Link from "next/link"
import { SalesSectionRenderer } from "@/components/admin/sales-pages/SalesSectionRenderer"
import type { SalesPageSection } from "@/app/admin/sales-pages/builder/sales-pages-actions"

const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

type SalesPageRendererProps = {
  sections: SalesPageSection[]
  title?: string
  siteName?: string
}

export function SalesPageRenderer({ sections, title, siteName = "Community Platform" }: SalesPageRendererProps) {
  const filteredSections = (sections ?? []).filter((s) => s.enabled !== false)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="relative py-6 shrink-0 bg-white">
        <div className="flex justify-center">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} className="h-14 object-contain" alt="logo" />
          ) : (
            <span className="text-lg font-semibold text-gray-900">Logo</span>
          )}
        </div>
        <Link
          href="/login"
          className="absolute right-6 top-6 px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </header>

      <main className="flex-1">
        {filteredSections.map((section, index) => (
          <SalesSectionRenderer
            key={section.id}
            section={section}
            sectionIndex={index}
          />
        ))}
      </main>

      <footer className="mt-24 border-t pt-10 pb-8 text-center text-sm text-gray-500 shrink-0">
        {/* Footer Links */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <a
            href="/login"
            className="hover:text-gray-800 transition"
          >
            Login
          </a>
          <a
            href="/terms"
            className="hover:text-gray-800 transition"
          >
            Terms
          </a>
          <a
            href="/privacy"
            className="hover:text-gray-800 transition"
          >
            Privacy
          </a>
        </div>
        {/* Copyright */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
