import { getAboutPage } from "./actions"
import AboutBuilder from "./AboutBuilder"

export default async function AdminAboutPage() {
  const about = await getAboutPage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">About Page Builder</h1>
        <p className="text-sm text-slate-500">
          Build and manage the sections of your public About page.
        </p>
      </div>

      <AboutBuilder
        initialSections={about?.sections || []}
        initialPublished={about?.is_published ?? false}
      />
    </div>
  )
}
