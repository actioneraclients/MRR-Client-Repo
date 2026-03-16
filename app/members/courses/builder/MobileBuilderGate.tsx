"use client"

import { useEffect, useState } from "react"

export function MobileBuilderGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Course Builder Requires a Larger Screen
          </h1>

          <p className="text-gray-600 text-sm">
            The course builder is designed for desktop and tablet screens.
            Please open this page on a computer to create or edit courses.
          </p>

          <p className="text-gray-500 text-sm">
            You can still view and take courses from your mobile device.
          </p>

          <a
            href="/members/courses"
            className="inline-block px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Return to Courses
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
