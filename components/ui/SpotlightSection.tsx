"use client"

import { SponsoredEducationCard } from "@/components/education/SponsoredEducationCard"

export interface SpotlightSectionProps<T extends { id: string }> {
  items: T[]
  CardComponent: React.ComponentType<{ item: T }>
  featuredField?: string
  sponsoredField?: string
  onSponsorClick?: (item: T) => void
  brandAccentColor?: string
  /** Optional custom card for sponsored item. When not provided, uses SponsoredEducationCard. */
  SponsoredCardComponent?: React.ComponentType<{
    item: T
    onClick: () => void
    brandAccentColor: string
  }>
}

/**
 * Reusable spotlight layout: sponsored hero + featured-first grid.
 * Handles layout and ordering only; does not fetch data.
 */
export function SpotlightSection<T extends { id: string }>({
  items,
  CardComponent,
  featuredField = "is_featured",
  sponsoredField = "is_sponsored",
  onSponsorClick,
  brandAccentColor = "#2563eb",
  SponsoredCardComponent,
}: SpotlightSectionProps<T>) {
  const sponsored = items.find((i: any) => Boolean(i?.[sponsoredField]))
  const remaining = items.filter((i: any) => !Boolean(i?.[sponsoredField]))

  remaining.sort((a: any, b: any) => {
    const aFeatured = Boolean(a?.[featuredField])
    const bFeatured = Boolean(b?.[featuredField])
    if (aFeatured === bFeatured) return 0
    return aFeatured ? -1 : 1
  })

  return (
    <div className="space-y-8">
      {sponsored &&
        (SponsoredCardComponent ? (
          <SponsoredCardComponent
            item={sponsored}
            onClick={() => onSponsorClick?.(sponsored)}
            brandAccentColor={brandAccentColor}
          />
        ) : (
          <SponsoredEducationCard
            item={sponsored as Parameters<typeof SponsoredEducationCard>[0]["item"]}
            onClick={() => onSponsorClick?.(sponsored)}
            brandAccentColor={brandAccentColor}
          />
        ))}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {remaining.map((item) => (
          <CardComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
