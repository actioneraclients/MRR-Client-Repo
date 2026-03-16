"use client"

import { createBrowserClient } from "@supabase/ssr"

export default function GoogleAuthButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleGoogleLogin = async () => {
    const currentUrl = new URL(window.location.href)
    const pid = currentUrl.searchParams.get("pid")
    const ntp = currentUrl.searchParams.get("ntp")

    const callbackUrl = new URL(
      `${window.location.origin}/auth/callback`
    )

    if (pid) callbackUrl.searchParams.set("pid", pid)
    if (ntp) callbackUrl.searchParams.set("ntp", ntp)

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-5 w-5"
      >
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.72 1.22 9.22 3.61l6.9-6.9C35.74 2.13 30.27 0 24 0 14.6 0 6.4 5.48 2.56 13.44l8.03 6.24C12.64 13.22 17.84 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.5c0-1.63-.15-3.2-.43-4.72H24v9h12.4c-.54 2.9-2.2 5.36-4.68 7l7.24 5.63C43.98 36.5 46.1 30.98 46.1 24.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.59 28.68A14.48 14.48 0 019.5 24c0-1.63.28-3.2.79-4.68l-8.03-6.24A23.92 23.92 0 000 24c0 3.85.92 7.48 2.56 10.56l8.03-6.24z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.27 0 11.74-2.07 15.66-5.63l-7.24-5.63c-2.02 1.35-4.6 2.15-8.42 2.15-6.16 0-11.36-3.72-13.41-8.96l-8.03 6.24C6.4 42.52 14.6 48 24 48z"
        />
      </svg>
      Continue with Google
    </button>
  )
}
