"use client"

import { Play, FileText, Headphones, File, ExternalLink } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type ExpertProfile = {
  id: string
  slug: string
  name: string
  image: string | null
  businessName: string | null
  businessAbout: string | null
  website: string | null
  bio: string | null
  tags: string[]
}

export type ExpertContent = {
  id: string
  slug: string
  title: string
  contentType: string
}

export default function ExpertProfileModal({
  expert,
  content,
  onClose,
  onSelectContent,
}: {
  expert: ExpertProfile | null
  content: ExpertContent[]
  onClose: () => void
  onSelectContent: (contentSlug: string) => void
}) {
  if (!expert) return null

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Video":
        return <Play className="w-4 h-4 text-red-600" />
      case "Article":
        return <FileText className="w-4 h-4 text-blue-600" />
      case "Audio":
        return <Headphones className="w-4 h-4 text-green-600" />
      case "Document":
        return <File className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getContentBadgeColor = (type: string) => {
    switch (type) {
      case "Video":
        return "bg-red-100 text-red-800"
      case "Article":
        return "bg-blue-100 text-blue-800"
      case "Audio":
        return "bg-green-100 text-green-800"
      case "Document":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={!!expert} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-w-0 overflow-x-auto">
          {/* Hero / Header Section */}
          <div className="relative">
            <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gray-100">
              <img
                src={expert.image || "/placeholder.svg?height=400&width=800&query=expert professional"}
                alt={expert.name}
                className="w-full h-full object-contain object-center"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 md:p-8">
              <h2 className="text-3xl font-bold text-white mb-1">{expert.name}</h2>
              <p className="text-lg text-white/90">{expert.businessName || ""}</p>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-8 min-w-0">
            {/* Business Info Section - SIMPLIFIED */}
            {expert.businessName && (
              <div className="bg-gray-50 rounded-xl p-4 md:p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About {expert.businessName}</h3>
                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{expert.businessAbout || ""}</p>
                {expert.website && (
                  <Button
                    onClick={() => window.open(expert.website!, "_blank")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                )}
              </div>
            )}

            {/* About Expert Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About {expert.name}</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{expert.bio || ""}</p>
            </div>

            {/* Areas of Expertise */}
            {expert.tags.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {expert.tags.map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content by Expert */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Content by {expert.name} ({content.length})
              </h3>
              {content.length > 0 ? (
                <div className="space-y-3">
                  {content.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectContent(item.slug)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 min-w-0"
                    >
                      <div className={`p-2 rounded-lg ${getContentBadgeColor(item.contentType)}`}>
                        {getContentIcon(item.contentType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                      </div>
                      <span
                        className={`px-3 py-1 ${getContentBadgeColor(item.contentType)} text-xs font-medium rounded-full`}
                      >
                        {item.contentType}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No content available from this expert yet.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
