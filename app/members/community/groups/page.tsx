import { Suspense } from "react"
import GroupsContent from "./groups-content"

export default async function CommunityGroupsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-y-auto">
          <section className="bg-white border-b border-gray-100 px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Groups</h2>
            <p className="text-lg text-gray-600">
              Connect with members by interest. Join open groups or request access.
            </p>
          </section>
          <section className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      }
    >
      <GroupsContent />
    </Suspense>
  )
}
