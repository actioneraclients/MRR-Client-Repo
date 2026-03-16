import { createClient as createBrowserClient } from "./browser"

export const createClient = createBrowserClient
export const getSupabaseBrowserClient = createBrowserClient
export const supabase = createBrowserClient()
