"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/browser"

interface PlanPermissions {
  directory_listing: boolean
  create_groups: boolean
  create_events: boolean
  offer_content: boolean
  offer_services: boolean
  offer_products: boolean
}

export function usePlanPermissions() {
  const [permissions, setPermissions] = useState<PlanPermissions>({
    directory_listing: false,
    create_groups: false,
    create_events: false,
    offer_content: false,
    offer_services: false,
    offer_products: false,
  })

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const loadPermissions = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // No user logged in - return all false
          setPermissions({
            directory_listing: false,
            create_groups: false,
            create_events: false,
            offer_content: false,
            offer_services: false,
            offer_products: false,
          })
          return
        }

        // Get user's profile to resolve plan_id
        const { data: profile } = await supabase.from("profiles").select("plan_id").eq("id", user.id).single()

        if (!profile?.plan_id) {
          // User has no plan assigned - return all false
          setPermissions({
            directory_listing: false,
            create_groups: false,
            create_events: false,
            offer_content: false,
            offer_services: false,
            offer_products: false,
          })
          return
        }

        // Query plan_permissions table for this plan
        const { data: planPermissions } = await supabase
          .from("plan_permissions")
          .select("permission_key, enabled")
          .eq("plan_id", profile.plan_id)

        // Build permissions object from database results
        const permissionsMap: PlanPermissions = {
          directory_listing: false,
          create_groups: false,
          create_events: false,
          offer_content: false,
          offer_services: false,
          offer_products: false,
        }

        if (planPermissions) {
          planPermissions.forEach((perm) => {
            if (perm.permission_key in permissionsMap) {
              permissionsMap[perm.permission_key as keyof PlanPermissions] = perm.enabled
            }
          })
        }

        setPermissions(permissionsMap)
      } catch (error) {
        console.error("[usePlanPermissions] Error loading permissions:", error)
        // On error, default to all false
        setPermissions({
          directory_listing: false,
          create_groups: false,
          create_events: false,
          offer_content: false,
          offer_services: false,
          offer_products: false,
        })
      }
    }

    loadPermissions()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPermissions()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { permissions }
}
