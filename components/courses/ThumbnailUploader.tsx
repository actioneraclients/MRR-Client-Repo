"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { updateCourseThumbnail } from "@/app/members/courses/builder/[courseId]/actions"
import { Button } from "@/components/ui/button"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

type Props = {
  courseId: string
  thumbnailUrl: string | null
  onUploadComplete?: (url: string) => void
}

export function ThumbnailUploader({ courseId, thumbnailUrl, onUploadComplete }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(thumbnailUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreviewUrl(thumbnailUrl)
  }, [thumbnailUrl])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.")
      e.target.value = ""
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("File must be 5MB or smaller.")
      e.target.value = ""
      return
    }

    setUploading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const ext = EXT_MAP[file.type] ?? "jpg"
      const timestamp = Math.floor(Date.now() / 1000)
      const path = `courses/${courseId}/thumbnail-${timestamp}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("course-images")
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("course-images").getPublicUrl(path)
      const publicUrl = data.publicUrl

      const result = await updateCourseThumbnail(courseId, publicUrl)
      if (!result.success) throw new Error(result.error)

      setPreviewUrl(publicUrl)
      onUploadComplete?.(publicUrl)
    } catch (err) {
      console.error("Thumbnail upload failed:", err)
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const displayUrl = previewUrl ?? thumbnailUrl

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">Thumbnail</label>
      <div className="max-w-[360px]">
        <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Course Thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No thumbnail
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button variant="secondary" onClick={handleClick} disabled={uploading} type="button">
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <i className="fa-solid fa-upload text-xs"></i>
              Upload Thumbnail
            </>
          )}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
