// /components/AuthProvider.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { SupabaseClient, Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

interface AuthContextType {
  supabase: SupabaseClient | null
  session: Session | null
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  supabase: null,
  session: null,
  user: null,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function useSupabaseClient() {
  const { supabase } = useContext(AuthContext)
  return supabase
}

export function useSession() {
  const { session } = useContext(AuthContext)
  return session
}

export function useUser() {
  const { user } = useContext(AuthContext)
  return user
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabaseClient = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabaseClient) {
      setIsLoading(false)
      return
    }

    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabaseClient])

  // If env vars are missing (common in V0 preview), skip Supabase entirely
  if (!supabaseClient) {
    console.warn(
      "AuthProvider: Supabase client not available (likely missing env vars in preview). " +
        "Rendering children without auth context.",
    )
    return <>{children}</>
  }

  return (
    <AuthContext.Provider value={{ supabase: supabaseClient, session, user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
