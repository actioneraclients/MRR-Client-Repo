// /lib/supabase/browser.ts
"use client"

import { createBrowserClient, type SupabaseClient } from "@supabase/ssr"

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn(
      "Supabase env vars missing in browser client — returning null. " +
        "This is common in V0 preview; deploy envs will work normally.",
    )
    return null
  }

  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}

export const createClient = getSupabaseBrowserClient
