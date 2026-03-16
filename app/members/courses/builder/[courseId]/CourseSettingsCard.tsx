"use client"

import Link from "next/link"
import { useState } from "react"
import { useTransition } from "react"
import {
  updateCourse,
  submitCourseForReview,
} from "./actions"
import { ThumbnailUploader } from "@/components/courses/ThumbnailUploader"
import { CourseInstructionsModal } from "@/components/courses/CourseInstructionsModal"
import { CourseTaxonomyModal } from "@/components/courses/CourseTaxonomyModal"

type Course = {
  id: string
  title?: string | null
  description?: string | null
  thumbnail_url?: string | null
  hero_image_url?: string | null
  instructor_avatar?: string | null
  access_type?: string | null
  price?: number | string | null
  status?: string | null
  instructions?: string | null
  instruction_video?: string | null
  invite_code?: string | null
}

type TaxonomyOption = { id: string; name: string }

type Props = {
  course: Course
  courseId: string
  categories: TaxonomyOption[]
  tags: TaxonomyOption[]
  selectedCategoryId: string | null
  selectedCategoryName: string | null
  selectedTagIds: string[]
  selectedTagOptions: { id: string; name: string }[]
  canCreatePaidCourses: boolean
  remainingPaidCourses: number | null
}

function getStatusBadgeClass(status: string | null | undefined) {
  switch (status) {
    case "draft":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "approved":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function getStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "draft":
      return "Draft"
    case "pending":
      return "Pending Review"
    case "approved":
      return "Approved"
    default:
      return status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : "Draft"
  }
}

export function CourseSettingsCard({
  course,
  courseId,
  categories,
  tags,
  selectedCategoryId,
  selectedCategoryName,
  selectedTagIds,
  selectedTagOptions,
  canCreatePaidCourses,
  remainingPaidCourses,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [taxonomyOpen, setTaxonomyOpen] = useState(false)

  const handleBlur = (field: keyof Course, value: string | number | null) => {
    startTransition(async () => {
      await updateCourse(courseId, {
        [field]: typeof value === "number" ? value : value || null,
      })
    })
  }

  const handleSubmitForReview = () => {
    startTransition(async () => {
      await submitCourseForReview(courseId)
    })
  }

  const status = course.status ?? "draft"
  const isDraft = status === "draft"
  const hasSubmittedForReview = status === "pending"

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="space-y-4">
        {/* Thumbnail */}
        <ThumbnailUploader
          courseId={courseId}
          thumbnailUrl={course.thumbnail_url ?? null}
        />

        {/* Course Title */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Course Title</label>
          <input
            type="text"
            defaultValue={course.title ?? ""}
            onBlur={(e) => handleBlur("title", e.target.value)}
            placeholder="Enter course title"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
          <textarea
            rows={3}
            defaultValue={course.description ?? ""}
            onBlur={(e) => handleBlur("description", e.target.value)}
            placeholder="Describe what students will learn..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Categories & Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Categories & Tags
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategoryName && (
              <span className="px-2 py-1 text-xs bg-gray-800 text-white rounded-full">
                {selectedCategoryName}
              </span>
            )}

            {selectedTagOptions.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs bg-primary text-white rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setTaxonomyOpen(true)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Update Categories & Tags
          </button>
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Invite Code (Optional)
          </label>
          <div className="max-w-xs">
            <input
              type="text"
              defaultValue={course.invite_code ?? ""}
              onBlur={(e) => handleBlur("invite_code", e.target.value)}
              placeholder="Enter invite code"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Choose a one-word unique code. Letters and numbers allowed.
          </p>
        </div>

        {/* Course Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Course Instructions</label>
          <button
            type="button"
            onClick={() => setShowInstructionsModal(true)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Edit Course Instructions
          </button>
        </div>

        {/* Access Type */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Access Type</label>
          <select
            defaultValue={course.access_type ?? "free"}
            onChange={(e) => handleBlur("access_type", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="free">Free</option>
            <option
              value="paid"
              disabled={
                !canCreatePaidCourses && (course.access_type?.toLowerCase() ?? "") !== "paid"
              }
            >
              Paid{" "}
              {!canCreatePaidCourses && (course.access_type?.toLowerCase() ?? "") !== "paid"
                ? "(Limit Reached)"
                : ""}
            </option>
            <option value="plan">Plan</option>
          </select>
          {remainingPaidCourses === 0 &&
            (course.access_type?.toLowerCase() ?? "") !== "paid" && (
              <p className="text-xs text-amber-600 mt-1">
                You have reached your paid course limit.{" "}
                <Link href="/members/support" className="underline">
                  Contact Support
                </Link>{" "}
                to upgrade your plan.
              </p>
            )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Price</label>
          <input
            type="number"
            min={0}
            step={0.01}
            defaultValue={course.price != null ? String(course.price) : ""}
            onBlur={(e) => {
              const val = e.target.value
              handleBlur("price", val === "" ? null : parseFloat(val) || 0)
            }}
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Badge */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(status)}`}
          >
            {getStatusLabel(status)}
          </span>

          {isDraft && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Course for Review
              </button>
            </div>
          )}

          {hasSubmittedForReview && (
            <p className="text-sm text-gray-600 mt-3">
              This course has been submitted and is awaiting admin review.
            </p>
          )}
        </div>

        {isPending && (
          <p className="text-xs text-gray-500">Saving...</p>
        )}
      </div>

      <CourseInstructionsModal
        open={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        courseId={courseId}
        initialInstructions={course.instructions ?? null}
        initialVideoUrl={course.instruction_video ?? null}
      />

      <CourseTaxonomyModal
        open={taxonomyOpen}
        onOpenChange={setTaxonomyOpen}
        courseId={courseId}
        categories={categories}
        tags={tags}
        selectedCategoryId={selectedCategoryId}
        selectedTagIds={selectedTagIds}
      />
    </div>
  )
}
