import Link from "next/link"

export default function LegalPageLayout({
  title,
  content,
}: {
  title: string
  content: string
}) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      {process.env.NEXT_PUBLIC_BRAND_LOGO_URL && (
        <div className="flex justify-center mb-8">
          <img
            src={process.env.NEXT_PUBLIC_BRAND_LOGO_URL}
            alt="Brand Logo"
            className="h-16 w-auto object-contain"
          />
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-10 text-center">
        {title}
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10">
        <div
          className="legal-content text-gray-700 leading-7 max-w-none"
          dangerouslySetInnerHTML={{ __html: content || "" }}
        />
      </div>
    </main>
  )
}
