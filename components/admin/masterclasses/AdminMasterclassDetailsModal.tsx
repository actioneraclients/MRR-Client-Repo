"use client"

import { format } from "date-fns"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { MasterclassRow } from "./MasterclassTable"

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getEmbedUrl(url: string): string | null {
  const u = url.trim()
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = u.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

const formatDualTimezone = (dateString: string) => {
  const date = new Date(dateString)
  const pst = date.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const est = date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${pst} PST / ${est} EST`
}

type Props = {
  masterclass: MasterclassRow | null
  open: boolean
  onClose: () => void
}

export default function AdminMasterclassDetailsModal({ masterclass, open, onClose }: Props) {
  const imageSrc = masterclass?.imageUrl || "/placeholder.svg?height=450&width=800&text=Masterclass"
  const hasVideoEmbed = masterclass?.videoUrl && getEmbedUrl(masterclass.videoUrl)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 max-h-[90vh] overflow-hidden flex flex-col"
        style={{ maxWidth: "72rem" }}
      >
        {masterclass && (
        <div className="flex-1 overflow-y-auto">
          {/* Header Image */}
          <div className="relative w-full max-h-[300px] overflow-hidden rounded-t-lg bg-gray-100">
            <div className="relative w-full h-[280px] md:h-[300px] flex items-center justify-center">
              <Image
                src={imageSrc}
                alt={masterclass.title}
                fill
                className="object-cover object-center"
                sizes="72rem"
                unoptimized={!masterclass.imageUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
            </div>
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
                {masterclass.title}
              </h2>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Host section */}
            <div className="flex items-start">
              <div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={masterclass.hostAvatarUrl ?? undefined} alt={masterclass.hostName} />
                    <AvatarFallback className="bg-slate-200 text-slate-700">
                      {getInitials(masterclass.hostName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{masterclass.hostName}</p>
                    {masterclass.scheduledAt ? (
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="font-semibold text-gray-900">
                          {format(new Date(masterclass.scheduledAt), "EEE, MMM d")}
                        </span>
                        {" · "}
                        {formatDualTimezone(masterclass.scheduledAt)}
                        {masterclass.durationFormatted ? ` · ${masterclass.durationFormatted}` : ""}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        {masterclass.scheduledAtFormatted}
                        {masterclass.durationFormatted ? ` · ${masterclass.durationFormatted}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {masterclass.attendeeCount > 0
                    ? `${masterclass.attendeeCount} people planning to attend`
                    : "No attendees yet"}
                </div>
              </div>
            </div>

            {/* Video embed */}
            {hasVideoEmbed && (
              <div className="flex justify-center">
                <div className="w-full max-w-xl aspect-video overflow-hidden rounded-lg shadow-md bg-gray-100">
                  <iframe
                    src={getEmbedUrl(masterclass.videoUrl!)!}
                    title="Session Video"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                {masterclass.description || "No description provided."}
              </p>
            </div>

            {/* Topics You'll Learn */}
            {masterclass.topics.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Topics You&apos;ll Learn</h3>
                <ul className="space-y-2">
                  {masterclass.topics.map((topic) => (
                    <li key={topic} className="flex items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      <span className="text-gray-700">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Who It's For */}
            {masterclass.whoItsFor && (
              <div className="pt-2">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Who It&apos;s For</h3>
                <p className="text-base text-gray-700 leading-relaxed">{masterclass.whoItsFor}</p>
              </div>
            )}
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
