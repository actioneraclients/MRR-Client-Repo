"use client"

export function CourseOverviewPrototype() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MRR Platform Bootcamp</h1>
        <p className="text-gray-500 mt-2">6 Modules · 32 Lessons</p>
      </div>

      <div className="grid grid-cols-1 lg:grid lg:grid-cols-3 gap-10">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions Card */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm mb-4">
              Video placeholder
            </div>
            <p className="text-sm text-gray-600">
              This section will contain instructions for taking the course.
            </p>
          </div>

          {/* Continue Learning Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Continue Learning</h2>
            <p className="text-sm text-gray-700 mb-4">Lesson 3 — Designing Your Offer</p>
            <button
              type="button"
              className="text-blue-600 font-medium text-sm hover:underline"
            >
              Continue Lesson →
            </button>
          </div>

          {/* Course Curriculum */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Curriculum</h2>

            {/* Module 1 */}
            <div className="border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Module 1 — Foundations</h3>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "80%" }}></div>
              </div>
              <p className="text-sm text-gray-500">4 / 5 Lessons Complete</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Lesson 1 — Welcome
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Lesson 2 — Vision
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-600">▶</span> Lesson 3 — Designing Your Offer
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span>○</span> Lesson 4 — Monetization
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span>○</span> Lesson 5 — Scaling
                </li>
              </ul>
            </div>

            {/* Module 2 */}
            <div className="border rounded-xl p-5 space-y-3 opacity-75">
              <h3 className="font-semibold text-gray-900">Module 2 — Growth</h3>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
              </div>
              <p className="text-sm text-gray-500">0 / 6 Lessons Complete</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2"><span>○</span> Lesson 1 — Audience</li>
                <li className="flex items-center gap-2"><span>○</span> Lesson 2 — Content</li>
                <li className="flex items-center gap-2"><span>○</span> Lesson 3 — Launch</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl p-6 space-y-6 sticky top-24">
            {/* Course Progress */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Course Progress</h3>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full w-[43%]"></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">43% Complete</p>
            </div>

            {/* Your Learning */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Learning</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Notes: 5</p>
                <p>Highlights: 3</p>
                <p>Saved Resources: 4</p>
              </div>
            </div>

            {/* View Learning Notes */}
            <button
              type="button"
              className="w-full border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              View Learning Notes
            </button>

            {/* Discuss This Course */}
            <button
              type="button"
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition-colors"
            >
              Discuss This Course
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
