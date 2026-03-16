"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function AboutModal({
  open,
  onClose,
  title,
  description,
  bullets,
  badge,
  imageUrl,
  cta,
}: {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  bullets?: string[]
  badge?: string
  imageUrl?: string
  cta?: {
    mode: "community" | "external"
    label: string
    url?: string
  }
}) {
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto"
  }, [open])

  if (!open) return null

  const handleCTA = () => {
    if (!cta) return

    if (cta.mode === "community") {
      router.push("/login")
    }

    if (cta.mode === "external" && cta.url) {
      window.open(cta.url, "_blank")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-charcoal/60 hover:text-charcoal"
        >
          ✕
        </button>

        {imageUrl && (
          <div className="w-full h-64 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={title || ""}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          </div>
        )}

        <div className="p-10">

          {badge && (
            <div className="mb-4 text-sm uppercase tracking-widest text-terracotta">
              {badge}
            </div>
          )}

          <h3 className="font-serif text-3xl font-semibold text-charcoal mb-6">
            {title}
          </h3>

          {description && (
            <p className="text-charcoal/80 leading-relaxed mb-6">
              {description}
            </p>
          )}

          {bullets && (
            <div className="space-y-3 mb-8">
              {bullets.map((b, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-terracotta">•</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {cta && (
            <button
              type="button"
              onClick={handleCTA}
              className="w-full px-8 py-4 bg-charcoal text-cream rounded-lg text-sm uppercase tracking-wide hover:bg-charcoal/90 transition"
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
