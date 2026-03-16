import { createClient } from "@/lib/supabase/server"

export default async function OptInDemoPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("site_settings")
    .select("brand_primary_color, brand_accent_color, brand_logo_url, site_terms_url, site_privacy_url")
    .eq("id", 1)
    .single()

  const primary = settings?.brand_primary_color || "#3B82F6"
  const accent = settings?.brand_accent_color || "#10B981"

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Header */}
      <header className="py-12 text-center">
        {settings?.brand_logo_url && (
          <img
            src={settings.brand_logo_url}
            alt="Logo"
            className="mx-auto h-14 object-contain mb-6"
          />
        )}
        <h3 className="text-3xl font-semibold text-gray-900 max-w-2xl mx-auto">
          Unlock the Free Lifestyle Business Blueprint
        </h3>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start">
          
          {/* Left Column */}
          <div>
            <div className="mb-8 rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
                alt="Preview"
                className="w-full h-64 object-cover"
              />
            </div>

            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: primary }}
            >
              Build Predictable Monthly Revenue
            </h2>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Discover the framework that helps experts, coaches, and creators
              generate recurring income without burnout or constant launches.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Step-by-step revenue roadmap",
                "Automation strategy included",
                "Community growth blueprint",
                "AI leverage framework",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-lg font-semibold" style={{ color: primary }}>
              Get instant access — it's completely free.
            </p>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                Register Below
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Create your free account to get access instantly.
              </p>
            </div>

            {/* Temporary placeholder for form */}
            <div className="h-[420px] bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
              Plan Registration Form Will Render Here
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-100">
        <div className="space-x-6">
          {settings?.site_terms_url && (
            <a href={settings.site_terms_url} target="_blank" className="hover:underline">
              Terms
            </a>
          )}
          {settings?.site_privacy_url && (
            <a href={settings.site_privacy_url} target="_blank" className="hover:underline">
              Privacy
            </a>
          )}
        </div>
        <div className="mt-4">
          © {new Date().getFullYear()} All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}
