"use client"

import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { MasterclassForUI } from "@/app/members/masterclasses/page"

type Props = {
  masterclass: MasterclassForUI
  brandAccentColor: string
  attendeeCount: number
  onSelect: (m: MasterclassForUI) => void
  getBadgeStyles: (b: string) => string
  getInitials: (n: string) => string
}

/**
 * Sponsored masterclass card — horizontal layout (image left, content right).
 * Matches SponsoredCourseCard visual structure.
 */
export function SponsoredMasterclassCard({
  masterclass,
  brandAccentColor,
  attendeeCount,
  onSelect,
  getBadgeStyles,
  getInitials,
}: Props) {
  return (
    <div
      className="relative w-full rounded-xl border bg-card shadow-sm overflow-hidden h-auto md:h-[260px] cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(masterclass)}
    >
      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-8 items-stretch h-full md:h-[260px]">
        <div className="relative w-full h-[260px] md:h-full overflow-hidden">
          <Image
            src={masterclass.image || "/placeholder.svg?height=400&width=800&query=masterclass"}
            alt={masterclass.title}
            fill
            className="object-cover"
            sizes="220px"
          />
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow">
            Sponsored
          </div>
        </div>

        <div className="flex flex-col h-full w-full min-w-0 py-4 px-6 md:px-8">
          <div className="flex flex-col flex-grow gap-3 min-w-0">
            <h2 className="text-lg font-semibold leading-tight mb-1">{masterclass.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {masterclass.description ?? ""}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={masterclass.hostAvatar} alt={masterclass.hostName} />
                <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
                  {getInitials(masterclass.hostName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900">{masterclass.hostName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 pt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m10-4.13a4 4 0 10-8 0m8 0a4 4 0 01-8 0"
                />
              </svg>
              {attendeeCount > 0
                ? `${attendeeCount} people planning`
                : "Be the first to reserve"}
            </div>
          </div>

          <div className="mt-auto flex justify-end pt-6 w-full">
            <Button
              size="sm"
              className="text-white"
              style={{ backgroundColor: brandAccentColor }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(masterclass)
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
