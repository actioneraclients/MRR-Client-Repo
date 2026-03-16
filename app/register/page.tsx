"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

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

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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

    setErrors({})
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/members/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      console.log("[v0] Registration successful:", data.user?.email)

      if (data.user?.id) {
        const userId = data.user.id

        let attempts = 0
        let updated = false

        while (attempts < 5 && !updated) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan_id: "100d5436-8e1e-4a93-ad56-46bc9075e9f0",
            })
            .eq("id", userId)

          if (!updateError) {
            updated = true
          } else {
            attempts++
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        }

        if (!updated) {
          console.error("[v0] Failed to assign Pro+ plan after retries")
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
    <>
      <title>Register | My JV Manager</title>

      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[radial-gradient(ellipse_at_top_left,rgba(10,20,40,0.95),rgba(47,145,207,0.25))]">
        <div className="w-full max-w-[420px] rounded-2xl border border-[rgba(10,20,40,0.05)] bg-white/95 backdrop-blur p-6 md:p-8 shadow-xl">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-[#0a1428]">Create your account</h1>
            <p className="mt-1 text-sm text-slate-600">Register to access the members area and test the JV tools.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
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
              <a href="#" className="text-[#2f91cf] hover:underline">
                Terms
              </a>{" "}
              &{" "}
              <a href="#" className="text-[#2f91cf] hover:underline">
                Privacy
              </a>
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
    </>
  )
}
