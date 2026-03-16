"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/browser"

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
  }

  return (
    <>
      <title>Reset Password | My JV Manager</title>

      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg">
          {brandLogoUrl && (
            <div className="flex justify-center mb-6">
              <Image
                src={brandLogoUrl || "/placeholder.svg"}
                alt="Brand Logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          )}

          <h1 className="text-2xl font-semibold text-[#0a1428]">Choose a new password</h1>
          <p className="mt-1 text-sm text-slate-600">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 font-medium bg-[#2f91cf] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>

          {success && (
            <div
              role="status"
              className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
            >
              Password updated successfully! Redirecting to login…
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
