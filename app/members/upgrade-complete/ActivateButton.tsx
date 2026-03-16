"use client"

import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function ActivateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleActivate = async () => {
    setLoading(true)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.refreshSession()

    router.replace("/members/profile")
  }

  return (
    <Button
      onClick={handleActivate}
      disabled={loading}
      className="w-full max-w-[220px]"
    >
      {loading ? "Activating..." : "Continue to Activate"}
    </Button>
  )
}
