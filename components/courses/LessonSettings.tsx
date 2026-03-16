"use client"

import { useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type Lesson = {
  id?: string
  title?: string
  description?: string
  thumbnail_url?: string
  drip_days?: number
  release_date?: string
  requires_previous_completion?: boolean
  content_blocks?: unknown[]
}

type Props = {
  lesson: Lesson
  setLesson: (lesson: Lesson) => void
}

export default function LessonSettings({ lesson, setLesson }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const supabase = createClient()

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !lesson.id) return

    const filePath = `lessons/${lesson.id}/${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from("course-images")
      .upload(filePath, file)

    if (!error && data) {
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-images/${data.path}`

      setLesson({
        ...lesson,
        thumbnail_url: publicUrl,
      })
    }
    e.target.value = ""
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Lesson Title</label>
        <input
          type="text"
          value={lesson.title ?? ""}
          onChange={(e) =>
            setLesson({ ...lesson, title: e.target.value })
          }
          className="w-full mt-1 rounded-md border border-gray-200 p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mt-4 block">
          Description
        </label>
        <textarea
          rows={3}
          value={lesson.description ?? ""}
          onChange={(e) =>
            setLesson({ ...lesson, description: e.target.value })
          }
          className="w-full mt-1 rounded-md border border-gray-200 p-2 text-sm resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium mt-4 block">
          Thumbnail Image
        </label>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleThumbnailUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition mt-1"
        >
          Upload Thumbnail
        </button>
        <p className="text-xs text-gray-500 mt-1">
          Recommended size: 16:9 (1280x720)
        </p>
        {lesson.thumbnail_url && (
          <div className="mt-3">
            <img
              src={lesson.thumbnail_url}
              alt="Lesson Thumbnail"
              className="w-full max-w-[220px] rounded-md border"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mt-4 block">
          Drip Delay (days)
        </label>
        <input
          type="number"
          value={lesson.drip_days ?? 0}
          onChange={(e) =>
            setLesson({
              ...lesson,
              drip_days: Number(e.target.value),
            })
          }
          className="w-full mt-1 rounded-md border border-gray-200 p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mt-4 block">
          Release Date
        </label>
        <input
          type="datetime-local"
          value={
            lesson.release_date
              ? new Date(lesson.release_date)
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setLesson({
              ...lesson,
              release_date: e.target.value,
            })
          }
          className="w-full mt-1 rounded-md border border-gray-200 p-2 text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={lesson.requires_previous_completion ?? false}
            onChange={(e) =>
              setLesson({
                ...lesson,
                requires_previous_completion: e.target.checked,
              })
            }
            className="rounded border-gray-300"
          />
          Require previous lesson completion before unlocking this lesson
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Students must complete the previous lesson before accessing this one.
        </p>
      </div>
    </div>
  )
}
