"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"
import Image from "next/image"
import GoogleAuthButton from "@/components/auth/GoogleAuthButton"
import { assignPlanToProfile, registerUserWithRecaptcha } from "./actions"

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
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

interface RegFormProps {
  termsUrl: string | null
  privacyUrl: string | null
  enableGoogleAuth: boolean
}

export default function RegForm({
  termsUrl,
  privacyUrl,
  enableGoogleAuth,
}: RegFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const brandLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL

  const rawPid = searchParams.get("pid")
  const ntpRaw = searchParams.get("ntp")
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const ntpPlanId = ntpRaw && uuidRegex.test(ntpRaw) ? ntpRaw : null
  const pid = rawPid && uuidRegex.test(rawPid) ? rawPid : null

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }

    if (lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!captchaToken) {
      setErrors({ email: "Please complete the captcha" })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const result = await registerUserWithRecaptcha({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        captchaToken,
      })

      if (!result.ok) {
        setErrors({ email: result.error })
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Registration successful:", email)

      if (result.userId && pid) {
        if (ntpPlanId) {
          const tempAssign = await assignPlanToProfile(result.userId, ntpPlanId)
          if (!tempAssign.ok) {
            console.error("[v0] Failed to assign temporary plan:", tempAssign.error)
          }

          try {
            const response = await fetch(`/api/get-plan-payment-link?pid=${pid}`)
            const json = await response.json()
            if (json?.stripe_payment_link) {
              window.location.href = json.stripe_payment_link
              return
            }
          } catch (err) {
            console.error("[v0] Failed to fetch payment link:", err)
          }
        } else {
          const res = await assignPlanToProfile(result.userId, pid)
          if (res.ok) {
            console.log("[v0] Plan assigned successfully:", pid)
          } else {
            console.error("[v0] Failed to assign plan:", res.error)
          }
        }
      }

      // Show success toast
      setToast("Account created! Check your email to confirm your account.")

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("[v0] Registration error:", error)
      setErrors({
        email: error instanceof Error ? error.message : "Failed to create account. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[#0a1428]">Create your account</h1>
        </div>

        {/* Form */}
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

          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={!!errors.firstName}
              className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={!!errors.lastName}
              className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.lastName}
              </p>
            )}
          </div>

          {/* Phone Number (optional) */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number (optional)
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[#2f91cf] focus:border-transparent"
            />
          </div>

          {/* Email */}
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

          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
            onChange={(token) => setCaptchaToken(token)}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full rounded-xl py-2.5 font-medium bg-[#2f91cf] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? "Creating…" : "Create Account"}
          </button>

          {/* Helper Text */}
          <p className="mt-3 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#2f91cf] hover:underline">
              Log in
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-slate-500">
            By creating an account you agree to our{" "}
            {termsUrl ? (
              <a href={termsUrl} className="text-[#2f91cf] hover:underline" target="_blank" rel="noopener noreferrer">
                Terms
              </a>
            ) : (
              <span className="text-[#2f91cf]">Terms</span>
            )}{" "}
            &{" "}
            {privacyUrl ? (
              <a href={privacyUrl} className="text-[#2f91cf] hover:underline" target="_blank" rel="noopener noreferrer">
                Privacy
              </a>
            ) : (
              <span className="text-[#2f91cf]">Privacy</span>
            )}
            .
          </p>
        </form>

        {/* Toast Notification */}
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
  )
}
