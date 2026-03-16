import type { CourseBlock } from "@/lib/courseBlocks"
import JournalBlock from "@/components/courses/JournalBlock"
import SaveResourceButton from "@/components/courses/SaveResourceButton"

type LessonBlockRendererProps = {
  blocks: CourseBlock[]
  courseId: string
  lessonId: string
  brandAccentColor?: string | null
}

function getEmbedUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.split("v=")[1]?.split("&")[0] || url.split("/").pop()
    return `https://www.youtube.com/embed/${id}`
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop()
    return `https://player.vimeo.com/video/${id}`
  }
  return url
}

export default function LessonBlockRenderer({ blocks, courseId, lessonId, brandAccentColor }: LessonBlockRendererProps) {
  return (
    <div className="space-y-10">
      {blocks?.map((block, index) => {
        const type = block?.type
        const content = block?.content
        const title = block?.title

        switch (type) {
          case "headline":
            return (
              <h2
                key={block.id ?? index}
                id={block.id}
                className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mt-10 mb-6"
              >
                {content ?? ""}
              </h2>
            )

          case "section":
            return (
              <h2 key={block.id ?? index} id={block.id} className="text-xl font-semibold mt-10 text-gray-900 border-l-4 border-primary pl-4">
                {content ?? ""}
              </h2>
            )

          case "text":
            return (
              <div
                key={block.id ?? index}
                id={block.id}
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content ?? "" }}
              />
            )

          case "video": {
            const videoUrl = (block?.videoUrl as string) ?? (block?.url as string) ?? ""
            if (!videoUrl) return null
            return (
              <div key={block.id ?? index} id={block.id} className="relative overflow-visible">
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                  {videoUrl.endsWith(".mp4") ? (
                    <video controls className="w-full h-full">
                      <source src={videoUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <iframe
                      src={getEmbedUrl(videoUrl)}
                      className="w-full h-full"
                      allowFullScreen
                      title="Video"
                    />
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <SaveResourceButton courseId={courseId} lessonId={lessonId} block={block} />
                </div>
              </div>
            )
          }

          case "embed":
            return (
              <div
                key={block.id ?? index}
                id={block.id}
                dangerouslySetInnerHTML={{ __html: (block?.embed as string) ?? "" }}
              />
            )

          case "image":
            return (
              <div key={block.id ?? index} id={block.id} className="space-y-2 relative overflow-visible">
                <img
                  src={(block?.imageUrl as string) ?? ""}
                  alt={(block?.caption as string) ?? ""}
                  className="rounded-xl w-full border border-gray-200"
                />
                {(block?.caption as string) && (
                  <p className="text-sm text-gray-500">{block.caption as string}</p>
                )}
                <div className="flex justify-end">
                  <SaveResourceButton courseId={courseId} lessonId={lessonId} block={block} />
                </div>
              </div>
            )

          case "audio":
            return (
              <div key={block.id ?? index} id={block.id} className="space-y-2 relative overflow-visible">
                <audio controls className="w-full">
                  <source src={(block?.audio_url as string) ?? (block?.audioUrl as string) ?? ""} />
                </audio>
                {(block?.description as string) && (
                  <p className="text-sm text-gray-500">{block.description as string}</p>
                )}
                <div className="flex justify-end">
                  <SaveResourceButton courseId={courseId} lessonId={lessonId} block={block} />
                </div>
              </div>
            )

          case "download":
            return (
              <div
                key={block.id ?? index}
                id={block.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 relative overflow-visible"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">{(block?.file_name as string) ?? (block?.fileName as string) ?? "Resource"}</p>
                    {(block?.description as string) && (
                      <p className="text-sm text-gray-500">{block.description as string}</p>
                    )}
                  </div>
                  <a
                    href={(block?.file_url as string) ?? (block?.downloadUrl as string) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 w-full sm:w-auto text-center"
                  >
                    Download
                  </a>
                </div>
                <div className="flex justify-end">
                  <SaveResourceButton courseId={courseId} lessonId={lessonId} block={block} />
                </div>
              </div>
            )

          case "journal":
            return (
              <JournalBlock
                key={block.id}
                lessonId={lessonId}
                blockId={block.id}
                question={(block as { question: string }).question ?? ""}
              />
            )

          case "callout":
            return (
              <div
                key={block.id ?? index}
                id={block.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-start"
              >
                <div className="text-amber-500 text-xl mt-1">💡</div>
                <div className="text-gray-800 text-lg leading-relaxed">
                  {(block as { content?: string }).content ?? ""}
                </div>
              </div>
            )

          case "divider":
            return <hr key={block.id ?? index} id={block.id} className="border-gray-200 my-10" />

          case "external_link": {
            const extTitle = (block?.title as string) ?? ""
            const extDesc = (block?.description as string) ?? ""
            const extUrl = (block?.url as string) ?? ""
            if (!extUrl) return null
            return (
              <div key={block.id ?? index} id={block.id} className="border border-sky-200 rounded-xl p-6 bg-sky-50/50">
                {extTitle && <h3 className="font-semibold text-gray-900 mb-2">{extTitle}</h3>}
                {extDesc && <p className="text-gray-600 mb-4">{extDesc}</p>}
                <a
                  href={extUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
                >
                  <i className="fa-solid fa-up-right-from-square text-xs" />
                  Open Link
                </a>
              </div>
            )
          }

          case "cta": {
            const ctaTitle = (block?.title as string) ?? ""
            const ctaDesc = (block?.description as string) ?? ""
            const ctaButtonText = (block?.button_text as string) ?? "Click here"
            const ctaUrl = (block?.url as string) ?? ""
            if (!ctaUrl) return null
            const accentColor = brandAccentColor || "#2563eb"
            return (
              <div key={block.id ?? index} id={block.id} className="border border-rose-200 rounded-xl p-6 bg-rose-50/50">
                <div className="flex flex-col">
                  {ctaTitle && <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{ctaTitle}</h3>}
                  {ctaDesc && <p className="text-base text-gray-700 mb-4 text-left">{ctaDesc}</p>}
                  <div className="flex justify-center">
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-white px-5 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: accentColor }}
                    >
                      {ctaButtonText}
                    </a>
                  </div>
                </div>
              </div>
            )
          }

          default:
            return null
        }
      })}
    </div>
  )
}
