"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminNav } from "./AdminNav"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md border border-gray-200"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 512 512">
                <path d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Admin — MRR Platform</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:sticky
          top-0 lg:top-16
          left-0
          h-full lg:h-auto
          w-64
          bg-white
          border-r border-gray-200
          overflow-y-auto
          z-50
          transform transition-transform duration-200
          lg:max-h-[calc(100vh-4rem)]
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <AdminNav />
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
