"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ImageIcon, FileText, LinkIcon, ExternalLink, Video, Play, Library, X } from "lucide-react"
import { getGroupFeedVideos, getCuratedGroupVideos, getGroupFeedResources } from "../actions"
import { createBrowserClient } from "@supabase/ssr"

type FeedResource = {
  id: string
  body: string
  image_url: string | null
  document_url: string | null
  document_name: string | null
  link_url: string | null
  author_id: string
  created_at: string
  author: { name: string; avatar_url: string | null }
}

export default function GroupLibraryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const groupId = params.id as string
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all")
  const [feedVideos, setFeedVideos] = useState<FeedVideo[]>([])
  const [feedVideosLoading, setFeedVideosLoading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<FeedVideo | null>(null)
  const [curatedMedia, setCuratedMedia] = useState<CuratedMedia[]>([])
  const [curatedMediaLoading, setCuratedMediaLoading] = useState(false)
  const [selectedCuratedMedia, setSelectedCuratedMedia] = useState<CuratedMedia | null>(null)
  const [curatedLightbox, setCuratedLightbox] = useState<{ imageUrl: string; title: string; authorName: string } | null>(null)
  const [group, setGroup] = useState<{ name: string; description: string } | null>(null)
  const [feedResources, setFeedResources] = useState<FeedResource[]>([])
  const [feedResourcesLoading, setFeedResourcesLoading] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<FeedResource | null>(null)

  const tabParam = searchParams?.get("tab")
  const activeTab = ["resources", "group-videos"].includes(tabParam as string) ? (tabParam as string) : "resources"

  useEffect(() => {
    async function fetchGroup() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase.from("groups").select("name, description").eq("id", groupId).single()
      if (data) setGroup(data)
    }
    fetchGroup()
  }, [groupId])

  useEffect(() => {
    async function fetchResources() {
      if (activeTab === "resources" && resourceFilter !== "feed-videos") {
        setFeedResourcesLoading(true)
        const resources = await getGroupFeedResources(groupId)
        setFeedResources(resources)
        setFeedResourcesLoading(false)
      }
    }
    fetchResources()
  }, [activeTab, groupId, resourceFilter])

  useEffect(() => {
    async function fetchFeedVideos() {
      if (resourceFilter === "feed-videos") {
        setFeedVideosLoading(true)
        const videos = await getGroupFeedVideos(groupId)
        setFeedVideos(videos)
        setFeedVideosLoading(false)
      }
    }
    fetchFeedVideos()
  }, [resourceFilter, groupId])

  useEffect(() => {
    async function fetchCuratedMedia() {
      if (activeTab === "group-videos") {
        setCuratedMediaLoading(true)
        const items = await getCuratedGroupVideos(groupId)
        setCuratedMedia(items)
        setCuratedMediaLoading(false)
      }
    }
    fetchCuratedMedia()
  }, [activeTab, groupId])

  const filteredResources = feedResources.filter((resource) => {
    if (resourceFilter === "all") return true
    if (resourceFilter === "images") return resource.image_url !== null
    if (resourceFilter === "documents") return resource.document_url !== null
    if (resourceFilter === "links") return resource.link_url !== null
    return true
  })

  const getResourceType = (resource: FeedResource): "image" | "document" | "link" => {
    if (resource.image_url) return "image"
    if (resource.document_url) return "document"
    return "link"
  }

  const getResourceUrl = (resource: FeedResource): string => {
    return resource.image_url || resource.document_url || resource.link_url || "#"
  }

  const getResourceTitle = (resource: FeedResource): string => {
    if (resource.document_name) return resource.document_name
    if (resource.body) return resource.body.slice(0, 60) + (resource.body.length > 60 ? "..." : "")
    return "Untitled Resource"
  }

  return (
    <>
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={lightboxImage.image_url! || "/placeholder.svg"}
              alt={getResourceTitle(lightboxImage)}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Image context/caption */}
            <div className="mt-3 text-center text-white/80 text-sm">
              <p className="font-medium">{getResourceTitle(lightboxImage)}</p>
              <p className="text-white/60">Posted by {lightboxImage.author.name}</p>
            </div>
          </div>
        </div>
      )}

      {curatedLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setCuratedLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setCuratedLightbox(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={curatedLightbox.imageUrl}
              alt={curatedLightbox.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 text-center text-white/80 text-sm">
              <p className="font-medium">{curatedLightbox.title}</p>
              <p className="text-white/60">Posted by {curatedLightbox.authorName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href={`/members/community/groups/${groupId}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Group Feed
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{group?.name || "Group"} Library</h2>
                <p className="text-gray-600">
                  {group?.description || "Browse resources and videos shared in this group."}
                </p>
              </div>
              {/* Library icon accent */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
                <Library className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 mb-6 inline-flex gap-1">
            <Link
              href={`/members/community/groups/${groupId}/library?tab=resources`}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === "resources"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              FEED
            </Link>
            <Link
              href={`/members/community/groups/${groupId}/library?tab=group-videos`}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === "group-videos"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              GROUP
            </Link>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} className="w-full">
            {/* Resources Tab */}
            <TabsContent value="resources">
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { value: "all", label: "All" },
                  { value: "images", label: "Images" },
                  { value: "documents", label: "Documents" },
                  { value: "links", label: "Links" },
                  { value: "feed-videos", label: "Feed Videos" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setResourceFilter(filter.value as ResourceFilter)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      resourceFilter === filter.value
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {resourceFilter === "feed-videos" ? (
                <div className="space-y-3">
                  {feedVideosLoading ? (
                    <Card className="p-8 text-center text-gray-500">Loading feed videos...</Card>
                  ) : feedVideos.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                      No videos have been shared in this group's feed yet.
                    </Card>
                  ) : (
                    feedVideos.map((video) => (
                      <Card key={video.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Video icon */}
                          <div className="mt-1">
                            <Video className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* Post body (truncated) */}
                            <p className="font-medium text-gray-900 mb-1 line-clamp-2">{video.body || "Video post"}</p>
                            {/* Author and date */}
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                              <span>{video.author.name}</span>
                              <span>•</span>
                              <span>{new Date(video.created_at).toLocaleDateString()}</span>
                            </div>
                            {/* Video embed when selected */}
                            {selectedVideo?.id === video.id && getVideoEmbedUrl(video.video_url) && (
                              <div className="aspect-video rounded-lg overflow-hidden mb-3">
                                <iframe
                                  src={getVideoEmbedUrl(video.video_url)!}
                                  className="w-full h-full"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              </div>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {selectedVideo?.id === video.id ? "Hide" : "Play"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                /* Resources List - now feed-driven */
                <div className="space-y-3">
                  {feedResourcesLoading ? (
                    <Card className="p-8 text-center text-gray-500">Loading resources...</Card>
                  ) : filteredResources.length === 0 ? (
                    <Card className="p-8 text-center text-gray-500">
                      No {resourceFilter === "all" ? "resources" : resourceFilter} have been shared in this group yet.
                    </Card>
                  ) : (
                    filteredResources.map((resource) => (
                      <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {resource.image_url ? (
                              <button
                                onClick={() => setLightboxImage(resource)}
                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                              >
                                <img
                                  src={resource.image_url || "/placeholder.svg"}
                                  alt={getResourceTitle(resource)}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="mt-1">{getResourceIcon(getResourceType(resource))}</div>
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{getResourceTitle(resource)}</h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="font-medium">{getResourceTypeLabel(getResourceType(resource))}</span>
                                <span>•</span>
                                <span>Posted by {resource.author.name}</span>
                                <span>•</span>
                                <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {resource.image_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLightboxImage(resource)}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                View Image
                              </Button>
                            )}
                            {resource.document_url && (
                              <a
                                href={resource.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View Document
                              </a>
                            )}
                            {resource.link_url && !resource.image_url && !resource.document_url && (
                              <a
                                href={resource.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Visit Link
                              </a>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            {/* GROUP tab: curated media (video, image, document, link) */}
            <TabsContent value="group-videos">
              <div className="space-y-4">
                {curatedMediaLoading ? (
                  <Card className="p-8 text-center text-gray-500">Loading curated media...</Card>
                ) : curatedMedia.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">
                    No curated group media yet. Group owners and moderators can add items from the feed.
                  </Card>
                ) : (
                  curatedMedia.map((item) => (
                    <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        {/* Media type icon or thumbnail */}
                        <div className="mt-1 flex-shrink-0">
                          {item.video_url && (
                            <Video className="h-5 w-5 text-purple-600" />
                          )}
                          {item.image_url && !item.video_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setCuratedLightbox({
                                  imageUrl: item.image_url!,
                                  title: item.video_title ?? "Untitled",
                                  authorName: item.author.name,
                                })
                              }
                              className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer block"
                            >
                              <img
                                src={item.image_url!}
                                alt={item.video_title ?? "Untitled"}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}
                          {item.document_url && !item.video_url && !item.image_url && (
                            <FileText className="h-5 w-5 text-orange-600" />
                          )}
                          {item.link_url && !item.video_url && !item.image_url && !item.document_url && (
                            <LinkIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Title (required video_title) */}
                          <h3 className="font-semibold text-gray-900 mb-1">{item.video_title ?? "Untitled"}</h3>
                          {/* Author and date */}
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                            <span>{item.author.name}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          {/* Video embed when selected */}
                          {item.video_url &&
                            selectedCuratedMedia?.id === item.id &&
                            getVideoEmbedUrl(item.video_url) && (
                              <div className="aspect-video rounded-lg overflow-hidden mb-3">
                                <iframe
                                  src={getVideoEmbedUrl(item.video_url)!}
                                  className="w-full h-full"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              </div>
                            )}
                        </div>
                        {/* Actions: Play for video, View Image, View Document, Visit Link */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.video_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSelectedCuratedMedia(selectedCuratedMedia?.id === item.id ? null : item)
                              }
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {selectedCuratedMedia?.id === item.id ? "Hide" : "Play"}
                            </Button>
                          )}
                          {item.image_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCuratedLightbox({
                                  imageUrl: item.image_url!,
                                  title: item.video_title ?? "Untitled",
                                  authorName: item.author.name,
                                })
                              }
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              View Image
                            </Button>
                          )}
                          {item.document_url && (
                            <a
                              href={item.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Document
                            </a>
                          )}
                          {item.link_url && !item.image_url && !item.document_url && (
                            <a
                              href={item.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit Link
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  // YouTube: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  // Vimeo: vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  // Loom: loom.com/share/VIDEO_ID
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`
  }

  return null
}

function getResourceIcon(type: "image" | "document" | "link") {
  switch (type) {
    case "image":
      return <ImageIcon className="h-5 w-5 text-purple-600" />
    case "document":
      return <FileText className="h-5 w-5 text-orange-600" />
    case "link":
      return <LinkIcon className="h-5 w-5 text-blue-600" />
  }
}

function getResourceTypeLabel(type: "image" | "document" | "link") {
  switch (type) {
    case "image":
      return "Image"
    case "document":
      return "Document"
    case "link":
      return "Link"
  }
}

type ResourceFilter = "all" | "images" | "documents" | "links" | "feed-videos"
type FeedVideo = {
  id: string
  body: string
  video_url: string
  author_id: string
  created_at: string
  author: { name: string; avatar_url: string | null }
}
type CuratedMedia = {
  id: string
  body: string
  video_url: string | null
  image_url: string | null
  document_url: string | null
  document_name: string | null
  link_url: string | null
  video_title: string | null
  author_id: string
  created_at: string
  author: { name: string; avatar_url: string | null }
}
