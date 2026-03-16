"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function LogoutPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClientComponentClient()

        // Clear session (access + refresh). `scope:"global"` helps if you logged in elsewhere too.
        const { error } = await supabase.auth.signOut({ scope: "global" })
        if (error) throw error

        // Clear any legacy/local state your app might have stored
        try {
          localStorage.removeItem("jv-manager-auth")
        } catch {}

        if (!cancelled) {
          // Hard nav avoids stale client cache
          window.location.assign("/login?message=logged_out")
        }
      } catch (e: any) {
        console.error("[Auth] Logout error:", e)
        if (!cancelled) {
          setError(e?.message ?? "Failed to log out")
          setTimeout(() => window.location.assign("/login"), 1200)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <div className="max-w-md mx-auto">
            <div className="rounded-xl bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-800">
              <p className="font-medium mb-1">Logout Error</p>
              <p>{error}</p>
              <p className="mt-2 text-xs">Redirecting to login…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f91cf] border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Logging out…</p>
          </>
        )}
      </div>
    </div>
  )
}
