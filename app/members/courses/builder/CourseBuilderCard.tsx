"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { retireCourse } from "./actions/retire-course"
import type { BuilderCourse } from "./actions"

export function CourseBuilderCard({ course }: { course: BuilderCourse }) {
  const router = useRouter()
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false)
  const [isRetiring, setIsRetiring] = useState(false)

  const isRetired = course.status === "Retired"

  const handleRetireConfirm = async () => {
    setIsRetiring(true)
    const result = await retireCourse(course.id)
    setIsRetiring(false)
    if (result.success) {
      setIsRetireModalOpen(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to retire course")
    }
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-video w-full overflow-hidden">
          {course.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="aspect-video object-cover rounded-t-xl w-full"
            />
          ) : (
            <div className="aspect-video w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl flex items-center justify-center">
              <i className="fa-solid fa-book-open text-white text-4xl opacity-80"></i>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="text-base font-semibold text-gray-900 truncate flex-1">{course.title}</h2>
            <span
              className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                course.status === "Published"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : course.status === "Retired"
                    ? "bg-gray-50 text-gray-600 border border-gray-200"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}
            >
              {course.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-folder text-gray-400"></i>
              {course.modules} modules
            </span>
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-book-open text-gray-400"></i>
              {course.lessons} lessons
            </span>
          </div>

          {/* Button area */}
          {!isRetired ? (
            <div className="flex flex-col gap-2">
              <Link
                href={`/members/courses/builder/${course.id}`}
                className="block w-full py-2 px-3 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-pen text-xs"></i>
                Edit Course
              </Link>
              <Button
                variant="outline"
                onClick={() => setIsRetireModalOpen(true)}
                className="w-full border border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
              >
                Stop Offering Course
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
              This course has been retired. Existing students will retain access.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRetireModalOpen} onOpenChange={(open) => !open && setIsRetireModalOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stop Offering Course</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-600">
            You are about to stop offering this course in the community.
            <br />
            <br />
            Existing students will still retain access, but the course will no longer be available for new users.
            <br />
            <br />
            This action cannot be undone.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRetireModalOpen(false)} disabled={isRetiring}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRetireConfirm}
              disabled={isRetiring}
            >
              {isRetiring ? "Retiring..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
