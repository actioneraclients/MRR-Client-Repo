export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>

        {/* Action bar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
