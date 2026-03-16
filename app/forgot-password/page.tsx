"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/browser"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) setError(error.message)
    else setSuccess(true)

    setLoading(false)
  }

  return (
    <>
      <title>Forgot Password | My JV Manager</title>

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

          <h1 className="text-2xl font-semibold text-[#0a1428]">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-600">Enter your email and we'll send you a password reset link.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-2.5 font-medium bg-[#2f91cf] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          {success && (
            <div
              role="status"
              className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
            >
              If an account exists for this email, a reset link has been sent.
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

          <p className="mt-4 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-[#2f91cf] hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
