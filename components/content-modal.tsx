"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

function normalizeYouTubeUrl(url: string): string {
  if (!url) return url

  // youtu.be/VIDEO_ID
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0]
    return `https://www.youtube.com/embed/${id}`
  }

  // youtube.com/watch?v=VIDEO_ID
  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0]
    return `https://www.youtube.com/embed/${id}`
  }

  // already embed or other providers
  return url
}

type ContentDetail = {
  id: string
  slug: string
  title: string
  description: string | null
  contentType: string
  image: string | null
  author: string | null
  authorImage: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  fullContent: {
    videoUrl?: string
    audioUrl?: string
    documentUrl?: string
    articleBody?: string
  }
}

export function ContentModal({
  content,
  sourceExpert,
  onBackToExpert,
  onClose,
}: {
  content: ContentDetail | null
  sourceExpert?: { id: string; name: string; slug: string } | null
  onBackToExpert?: () => void
  onClose: () => void
}) {
  if (!content) return null

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[70vw] max-w-[1200px] max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {sourceExpert && onBackToExpert && (
            <button
              onClick={onBackToExpert}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
            >
              ← Back to {sourceExpert.name}
            </button>
          )}

          {/* Content Type Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                content.contentType === "Video" || content.contentType === "video"
                  ? "bg-red-100 text-red-800"
                  : content.contentType === "Article" || content.contentType === "article"
                    ? "bg-blue-100 text-blue-800"
                    : content.contentType === "Audio" || content.contentType === "audio"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {content.contentType}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>

          {/* Author */}
          {content.author && (
            <div className="flex items-center gap-3">
              <Image
                src={content.authorImage || "/placeholder.svg?height=40&width=40&query=avatar"}
                alt={content.author}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="font-medium text-gray-900">{content.author}</span>
            </div>
          )}

          {content.image && content.contentType !== "Video" && content.contentType !== "video" && (
            <div className="relative w-full max-h-[420px] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              <Image
                src={content.image || "/placeholder.svg"}
                alt={content.title}
                width={1200}
                height={800}
                className="w-auto max-h-[420px] object-contain"
                priority
              />
              <div className="pointer-events-none absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-background to-transparent" />
            </div>
          )}

          {/* Content Display based on type */}
          {(content.contentType === "Video" || content.contentType === "video") && content.fullContent.videoUrl && (
            <>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={normalizeYouTubeUrl(content.fullContent.videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-gray-700 leading-relaxed">{content.description}</p>
            </>
          )}

          {(content.contentType === "Article" || content.contentType === "article") &&
            content.fullContent.articleBody && (
              <div className="max-w-3xl mx-auto px-6 pb-10">
                <div className="prose prose-gray max-w-none">
                  <div
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content.fullContent.articleBody }}
                  />
                </div>
              </div>
            )}

          {(content.contentType === "Audio" || content.contentType === "audio") && content.fullContent.audioUrl && (
            <>
              <div className="bg-gray-100 rounded-lg p-6">
                <audio controls className="w-full">
                  <source src={content.fullContent.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              <p className="text-gray-700 leading-relaxed">{content.description}</p>
            </>
          )}

          {(content.contentType === "Document" || content.contentType === "document") &&
            content.fullContent.documentUrl && (
              <>
                <Button
                  onClick={() => window.open(content.fullContent.documentUrl, "_blank")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open / Download Document
                </Button>

                <p className="text-gray-700 leading-relaxed">{content.description}</p>
              </>
            )}

          {content.ctaText && content.ctaUrl && (
            <div className="pt-8 border-t border-gray-200">
              <Button
                onClick={() => window.open(content.ctaUrl!, "_blank")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
              >
                {content.ctaText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
