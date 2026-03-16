"use client"

import { useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

type Props = {
  pageId: string
  value: string
  onChange: (url: string) => void
}

export function ImageUploader({ pageId, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const uploadFile = async (file: File) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, WebP, or GIF image.")
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError("File must be 5MB or smaller.")
      return
    }

    setUploading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const path = `${pageId}/${timestamp}-${sanitizedName}`

      const { error: uploadError } = await supabase.storage
        .from("sales-pages")
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("sales-pages").getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (err) {
      console.error("Image upload failed:", err)
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    e.target.value = ""
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          flex flex-col items-center justify-center min-h-[120px] rounded-lg border-2 border-dashed cursor-pointer transition-colors
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}
          ${value ? "p-2" : "p-6"}
        `}
      >
        {value ? (
          <div className="relative w-full max-w-[200px]">
            <img
              src={value}
              alt="Preview"
              className="w-full h-auto max-h-32 object-cover rounded-lg"
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            {uploading ? (
              <span className="text-sm text-gray-600">Uploading...</span>
            ) : (
              <>
                <p className="text-sm text-gray-600">Drag and drop or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF (max 5MB)</p>
              </>
            )}
          </div>
        )}
      </div>
      {value && !uploading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClick}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
