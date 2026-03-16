"use client"

import { useState, useTransition } from "react"
import { redeemCourseInviteCode } from "@/app/actions/courses/redeemCourseInviteCode"
import { useRouter } from "next/navigation"

type Props = {
  open: boolean
  onClose: () => void
}

export default function CourseInviteModal({ open, onClose }: Props) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const submitCode = () => {
    startTransition(async () => {
      const result = await redeemCourseInviteCode(code)

      if (result.success) {
        setMessage(result.message)

        if (result.courseId) {
          router.push(`/members/courses/${result.courseId}`)
        } else {
          router.refresh()
        }
      } else {
        setMessage(result.message)
      }
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[420px] p-6">
        <h2 className="text-lg font-semibold mb-2">
          Enroll with Invite Code
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          If you were given an invite code to access a course for free, enter it below to enroll instantly.
        </p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter invite code"
          className="w-full border rounded-md px-3 py-2 mb-3"
        />

        {message && (
          <div className="text-sm text-gray-600 mb-3">
            {message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded"
          >
            Cancel
          </button>

          <button
            onClick={submitCode}
            disabled={isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  )
}
