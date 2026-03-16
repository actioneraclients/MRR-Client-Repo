"use client"

import Image from "next/image"
import {
  Globe,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Music,
  Youtube,
  Package,
  Briefcase,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export type BusinessProfile = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string
  category: string
  website_url: string | null
  social_links: Record<string, string> | string | null
  products: { id: string; name: string; description?: string }[]
  services: { id: string; name: string; description?: string }[]
}

export default function BusinessProfileModal({
  business,
  onClose,
  onSelectProduct,
  onSelectService,
}: {
  business: BusinessProfile | null
  onClose: () => void
  onSelectProduct?: (productId: string) => void
  onSelectService?: (serviceId: string) => void
}) {
  if (!business) return null

  const socialLabels: Record<string, string> = {
    website: "Additional Website",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "X / Twitter",
    tiktok: "TikTok",
    youtube: "YouTube",
  }
  const socialPillStyles: Record<string, string> = {
    website: "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200",
    linkedin: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    instagram: "bg-pink-50 border-pink-200 text-pink-800 hover:bg-pink-100",
    facebook: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
    twitter: "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200",
    tiktok: "bg-slate-900 border-slate-700 text-white hover:bg-slate-800",
    youtube: "bg-red-50 border-red-200 text-red-800 hover:bg-red-100",
  }
  const defaultPillStyle = "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200"

  const getLabel = (platform: string) =>
    socialLabels[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase()
  const getStyle = (platform: string) => socialPillStyles[platform] ?? defaultPillStyle

  let normalizedSocialLinks: Record<string, string> = {}
  const rawSocialLinks = business.social_links
  if (rawSocialLinks != null) {
    if (typeof rawSocialLinks === "string") {
      try {
        const parsed = JSON.parse(rawSocialLinks)
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
          normalizedSocialLinks = parsed as Record<string, string>
        }
      } catch {
        normalizedSocialLinks = {}
      }
    } else if (typeof rawSocialLinks === "object" && !Array.isArray(rawSocialLinks)) {
      normalizedSocialLinks = rawSocialLinks as Record<string, string>
    }
  }

  const links: { platform: string; url: string; label: string }[] = []
  for (const [key, value] of Object.entries(normalizedSocialLinks)) {
    const url = typeof value === "string" ? value.trim() : ""
    if (!url) continue
    const platform = key.toLowerCase()
    links.push({ platform, url, label: getLabel(platform) })
  }

  const SocialPillIcon = ({ platform }: { platform: string }) => {
    const c = "w-4 h-4 shrink-0"
    switch (platform) {
      case "linkedin":
        return <Linkedin className={c} />
      case "instagram":
        return <Instagram className={c} />
      case "facebook":
        return <Facebook className={c} />
      case "twitter":
        return <Twitter className={c} />
      case "tiktok":
        return <Music className={c} />
      case "youtube":
        return <Youtube className={c} />
      default:
        return <Globe className={c} />
    }
  }

  return (
    <Dialog open={!!business} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            <div className="w-full h-64 md:h-80 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center p-8">
              <Image
                src={business.logo_url || "/placeholder.svg?height=200&width=200&text=Logo"}
                alt={business.name}
                width={200}
                height={200}
                className="max-h-48 w-auto object-contain"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-8 pb-8 pt-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-sm">{business.name}</h2>
              <p className="text-lg text-white/90">{business.category || "—"}</p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{business.description || "No description."}</p>
            </section>

            {business.website_url?.trim() && (
              <section className="text-center">
                <a
                  href={business.website_url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  <Globe className="w-5 h-5 shrink-0 text-gray-600" />
                  <span className="underline decoration-gray-300 hover:decoration-blue-500">
                    {business.website_url.trim()}
                  </span>
                </a>
              </section>
            )}

            {links.length > 0 && (
              <section>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {links.map((link) => (
                    <a
                      key={`${link.platform}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors ${getStyle(link.platform)}`}
                    >
                      <SocialPillIcon platform={link.platform} />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
              {business.products.length > 0 ? (
                <div className="space-y-3">
                  {business.products.map((item) => (
                    <div
                      key={item.id}
                      role={onSelectProduct ? "button" : undefined}
                      onClick={onSelectProduct ? () => onSelectProduct(item.id) : undefined}
                      className={`rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 ${onSelectProduct ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors" : ""}`}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No products listed yet.</p>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
              {business.services.length > 0 ? (
                <div className="space-y-3">
                  {business.services.map((item) => (
                    <div
                      key={item.id}
                      role={onSelectService ? "button" : undefined}
                      onClick={onSelectService ? () => onSelectService(item.id) : undefined}
                      className={`rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4 ${onSelectService ? "cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors" : ""}`}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No services listed yet.</p>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
