"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"
import { submitOptInRegistration } from "./actions"

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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
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
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-[15px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label="Toggle password visibility"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

export default function OptInForm({ slug }: { slug: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

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
    setInlineError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!captchaToken) {
      setInlineError("Please complete the captcha")
      return
    }

    setErrors({})
    setIsSubmitting(true)

    const result = await submitOptInRegistration({
      slug,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber.trim() || undefined,
      captchaToken,
    })

    if (result.ok) {
      router.push(result.redirectTo)
      return
    }

    setInlineError(result.error || "Something went wrong. Please try again.")
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {inlineError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" role="alert">
          {inlineError}
        </div>
      )}

      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
          First Name
        </label>
        <input
          id="firstName"
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          aria-invalid={!!errors.firstName}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.firstName && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.firstName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
          Last Name
        </label>
        <input
          id="lastName"
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          aria-invalid={!!errors.lastName}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.lastName && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.lastName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number (optional)
        </label>
        <input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 font-semibold rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSubmitting ? "Submitting…" : "Register"}
      </button>
    </form>
  )
}
