"use client"

import { useState, useTransition } from "react"
import { updateCourse } from "./actions"

type Course = {
  id: string
  drip_enabled?: boolean | null
}

type Props = {
  course: Course
  courseId: string
}

export function LessonAccessOptionsCard({ course, courseId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [dripEnabled, setDripEnabled] = useState(course.drip_enabled ?? false)

  const handleDripToggle = (checked: boolean) => {
    setDripEnabled(checked)
    startTransition(async () => {
      await updateCourse(courseId, { drip_enabled: checked })
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Lesson Access Options
      </h3>

      <div className="space-y-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={dripEnabled}
            onChange={(e) => handleDripToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-900">
            Enable Drip Lessons
          </span>
        </label>

        <p className="text-sm text-gray-600">
          When drip lessons are enabled, lessons are released gradually instead of all being available immediately.
          You can control lesson availability using:
        </p>
        <p className="text-sm text-gray-600">
          • Drip Delay (days)
          <br />
          • Release Date
        </p>
        <p className="text-sm text-gray-600">
          If both are set, Release Date takes priority.
        </p>

        {isPending && (
          <p className="text-xs text-gray-500">Saving...</p>
        )}
      </div>
    </div>
  )
}
