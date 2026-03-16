export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-96"></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
