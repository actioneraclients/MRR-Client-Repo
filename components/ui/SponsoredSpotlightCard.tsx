"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

type SpotlightItem = {
  id: string
  name: string
  title?: string
  description?: string
  short_description?: string
  logo_url?: string | null
  image_url?: string | null
  image?: string | null
  category?: string
  author?: string | null
  authorImage?: string | null
  business?: { name: string; logo_url?: string | null }
}

type Props = {
  item: SpotlightItem
  onClick: () => void
  brandAccentColor: string
  label?: string
}

/**
 * Generic sponsored spotlight card — full-width horizontal layout.
 * Works with businesses, products, services, and education content.
 */
export function SponsoredSpotlightCard({
  item,
  onClick,
  brandAccentColor,
  label = "Sponsored",
}: Props) {
  const image = item.image ?? item.image_url ?? item.logo_url ?? "/placeholder.svg?height=400&width=800&query=sponsored"
  const title = item.title ?? item.name
  const description = item.description ?? item.short_description ?? ""
  const author = item.author ?? item.business?.name
  const authorImage = item.authorImage ?? item.business?.logo_url

  return (
    <div
      className="relative w-full rounded-xl border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-6 items-stretch">

        {/* Image Area — 16:9 aspect ratio */}
        <div className="relative w-full aspect-video md:aspect-[16/9] bg-white flex items-center justify-center overflow-hidden">

          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-4"
            sizes="420px"
          />

          <div className="absolute top-3 left-3">
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              {label}
            </span>
          </div>

        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-6 md:p-8 min-w-0">

          <div className="space-y-2">

            <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">
              {title}
            </h2>

            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 max-w-2xl">
              {description}
            </p>

            {item.category && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {item.category}
              </span>
            )}

            {author && (
              <div className="flex items-center gap-2 pt-1">
                <Image
                  src={authorImage || "/placeholder.svg?height=32&width=32&query=avatar"}
                  alt={author}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-900">
                  {author}
                </span>
              </div>
            )}

          </div>

          <div className="pt-4">
            <Button
              className="text-white"
              style={{ backgroundColor: brandAccentColor }}
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
            >
              View Details
            </Button>
          </div>

        </div>

      </div>
    </div>
  )
}
