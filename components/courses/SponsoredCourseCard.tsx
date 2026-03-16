"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

type CourseItem = {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  instructor?: string
  avatar_url?: string | null
  category?: { slug: string; name: string } | null
  access_type?: string | null
  includedInPlan?: boolean
  payment_url?: string | null
}

type Props = {
  item: CourseItem
  onClick: () => void
  brandAccentColor: string
  isEnrolled?: boolean
}

/**
 * Sponsored course card — full-width spotlight above the course grid.
 * Uses course fields: thumbnail_url, instructor, avatar_url, category.
 */
export function SponsoredCourseCard({ item, onClick, brandAccentColor, isEnrolled = false }: Props) {
  const planAccess = item.includedInPlan === true
  const hasAccess =
    item.access_type === "free" || planAccess

  return (
    <div
      className="relative w-full rounded-xl border bg-card shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-6 md:gap-8 h-full">
        <div className="relative w-full h-[220px] md:h-full overflow-hidden">
          <Image
            src={item.thumbnail_url || "/placeholder.svg?height=400&width=800&query=sponsored"}
            alt={item.title}
            fill
            className="object-cover w-full h-full"
          />
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow">
            Sponsored
          </div>
        </div>

        <div className="flex flex-col h-full w-full min-w-0 px-6 md:px-8 py-6">
          <div className="flex flex-col flex-grow gap-4 min-w-0">
            <h2 className="text-xl font-semibold leading-tight">{item.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {item.description ?? ""}
            </p>
            {item.category?.name && (
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {item.category.name}
              </span>
            )}
            {item.instructor && (
              <div className="flex items-center gap-2 pt-1">
                <Image
                  src={item.avatar_url || "/placeholder.svg?height=32&width=32&query=avatar"}
                  alt={item.instructor}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-900">{item.instructor}</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-end pt-4">
            {isEnrolled ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/members/courses/${item.id}`
                }}
              >
                Access Course
              </Button>
            ) : hasAccess ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onClick()
                }}
              >
                Start Course
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  if (item.payment_url) {
                    window.location.href = item.payment_url
                  }
                }}
                disabled={!item.payment_url}
              >
                Buy Course
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
