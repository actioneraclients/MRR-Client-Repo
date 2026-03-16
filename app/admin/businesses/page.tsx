

"use client"

import { useState, useEffect } from "react"
import AdminBusinessesClient from "./businesses-client"
import { getAdminBusinesses, getBusinessTags } from "./actions"

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<
    {
      id: string
      slug: string
      name: string
      avatar_url: string | null
      business_tags: string[]
      status: "active" | "inactive"
      created_at: string
      is_featured: boolean
      is_sponsored: boolean
    }[]
  >([])
  const [businessTags, setBusinessTags] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [businessesResult, tagsResult] = await Promise.all([
        getAdminBusinesses(),
        getBusinessTags(),
      ])
      const items = (businessesResult?.items ?? []).map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        avatar_url: item.logo_url ?? null,
        business_tags: item.business_tags ?? [],
        status: item.is_active ? ("active" as const) : ("inactive" as const),
        created_at: item.created_at ?? "",
        is_featured: item.is_featured ?? false,
        is_sponsored: item.is_sponsored ?? false,
      }))
      setBusinesses(items)
      setBusinessTags(tagsResult?.tags ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-12 text-center text-gray-500">Loading businesses...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminBusinessesClient
      initialItems={businesses}
      businessTags={businessTags}
    />
  )
}
