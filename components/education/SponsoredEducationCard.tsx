"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

type ContentItem = {
  id: string
  slug: string
  title: string
  description: string
  contentType: string
  category: string | null
  image: string | null
  author: string | null
  authorImage: string | null
}

type Props = {
  item: ContentItem
  onClick: () => void
  brandAccentColor: string
}

/**
 * Sponsored education card — full-width spotlight above the content grid.
 * Horizontal layout on desktop, stacked on mobile.
 */
export function SponsoredEducationCard({ item, onClick, brandAccentColor }: Props) {
  return (
    <div
      className="relative w-full rounded-xl border bg-card shadow-sm overflow-hidden h-auto md:h-[260px] cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-center h-full md:h-[260px]">
        {/* Image container — fixed height, crops oversized images */}
        <div className="relative w-full h-[260px] md:h-full overflow-hidden rounded-lg">
          <Image
            src={item.image || "/placeholder.svg?height=400&width=800&query=sponsored"}
            alt={item.title}
            fill
            className="object-cover"
          />
          {/* Sponsored badge — top left corner */}
          <div className="absolute top-3 left-3">
            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              Sponsored
            </span>
          </div>
        </div>

        {/* Content — vertically centered */}
        <div className="flex flex-col justify-center gap-3 p-6 md:p-8 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{item.title}</h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-3 max-w-2xl">
            {item.description}
          </p>
        {item.category && (
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {item.category}
          </span>
        )}
        {item.author && (
          <div className="flex items-center gap-2">
            <Image
              src={item.authorImage || "/placeholder.svg?height=32&width=32&query=avatar"}
              alt={item.author}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-900">{item.author}</span>
          </div>
        )}
        <Button
          className="w-full md:w-auto self-start text-white"
          style={{ backgroundColor: brandAccentColor }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          View Content
        </Button>
        </div>
      </div>
    </div>
  )
}
