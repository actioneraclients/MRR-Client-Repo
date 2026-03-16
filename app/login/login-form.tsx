"use client"

import { useState, type FormEvent } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/browser"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

interface SuspensionError {
  isSuspended: boolean
  supportEmail: string
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
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
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default function LoginForm({ enableGoogleAuth }: { enableGoogleAuth: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [suspensionError, setSuspensionError] = useState<SuspensionError | null>(null)
  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) newErrors.email = "Email is required"
    else if (!emailPattern.test(email)) newErrors.email = "Please enter a valid email address"
    if (!password.trim()) newErrors.password = "Password is required"
    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSuspensionError(null)
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw new Error(error.message)

      const userId = data.user?.id
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", userId).single()

        if (profile?.is_active === false) {
          const { data: settings } = await supabase.from("site_settings").select("support_email").single()

          await supabase.auth.signOut()

          setSuspensionError({
            isSuspended: true,
            supportEmail: settings?.support_email ?? "",
          })
          setIsSubmitting(false)
          return
        }
      }

      await supabase.auth.getSession()
      setToast("Logged in successfully!")

      router.push("/members/dashboard")
    } catch (err: any) {
      console.error("[login] error:", err)
      setErrors({ general: err?.message ?? "Invalid email or password. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <title>Login | My JV Manager</title>

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

          <div>
            <h1 className="text-2xl font-semibold text-[#0a1428]">Welcome back</h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
            {enableGoogleAuth && (
              <>
                <GoogleAuthButton />
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="mx-3 text-xs text-slate-400 uppercase tracking-wide">
                    or
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
              </>
            )}

            {suspensionError?.isSuspended && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                Your account is currently suspended. Please contact {suspensionError.supportEmail} to resolve account
                access.
              </div>
            )}

            {errors.general && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {errors.general}
              </div>
            )}

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
                aria-invalid={!!errors.email}
                autoComplete="email"
                className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              error={errors.password}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-xl py-2.5 font-medium bg-[#2f91cf] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-3 text-center text-sm">
              <p>
                <Link href="/forgot-password" className="text-slate-600 hover:text-[#2f91cf] hover:underline">
                  Forgot password?
                </Link>
              </p>
            </div>
          </form>

          {toast && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
            >
              {toast}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
