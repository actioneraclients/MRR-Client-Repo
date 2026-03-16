"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createCourse } from "./actions"

type TaxonomyOption = { id: string; name: string }

type Props = {
  categories: TaxonomyOption[]
  tags: TaxonomyOption[]
  canCreatePaidCourses: boolean
  remainingPaidCourses: number | null
}

const inputClasses =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
const labelClasses = "block text-sm font-medium text-gray-900 mb-2"

export function NewCourseForm({ categories, tags, canCreatePaidCourses, remainingPaidCourses }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [courseName, setCourseName] = useState("")
  const [groupName, setGroupName] = useState("")
  const [groupNameEdited, setGroupNameEdited] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [listingImagePreview, setListingImagePreview] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [headerPreview, setHeaderPreview] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagFilter, setTagFilter] = useState("")
  const [termsCheck1, setTermsCheck1] = useState(false)
  const [termsCheck2, setTermsCheck2] = useState(false)

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
      if (listingImagePreview) URL.revokeObjectURL(listingImagePreview)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      if (headerPreview) URL.revokeObjectURL(headerPreview)
    }
  }, [thumbnailPreview, listingImagePreview, avatarPreview, headerPreview])

  function handleCourseNameChange(value: string) {
    setCourseName(value)
    if (!groupNameEdited) {
      setGroupName(value ? `${value} Community` : "")
    }
  }

  function handleGroupNameChange(value: string) {
    setGroupName(value)
    setGroupNameEdited(true)
  }

  function addTag(id: string) {
    if (!selectedTagIds.includes(id)) {
      setSelectedTagIds((prev) => [...prev, id])
    }
  }

  function removeTag(id: string) {
    setSelectedTagIds((prev) => prev.filter((t) => t !== id))
  }

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagFilter.toLowerCase()) &&
      !selectedTagIds.includes(t.id)
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!termsCheck1 || !termsCheck2) {
      setError("You must accept both course terms to continue.")
      return
    }
    setError(null)
    setIsPending(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set("course_name", courseName)
    formData.set("group_name", groupName)
    // Clear existing tag_ids and add selected (server expects getAll)
    formData.delete("tag_ids")
    selectedTagIds.forEach((id) => formData.append("tag_ids", id))
    const result = await createCourse(formData)
    if (result.error) {
      setError(result.error)
      setIsPending(false)
    }
    // If success, createCourse redirects
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Card 1 — Course Basics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Basics</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="course_name" className={labelClasses}>
              Course Name
            </label>
            <input
              id="course_name"
              name="course_name"
              type="text"
              required
              placeholder="Enter course name"
              value={courseName}
              onChange={(e) => handleCourseNameChange(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe what students will learn..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div>
            <label className={labelClasses}>Course Thumbnail (16:9 recommended)</label>
            <div className="mt-2">
              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Course thumbnail preview"
                  className="w-40 aspect-video object-cover rounded-lg border mb-2"
                />
              )}
              <input
                name="course_thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
                    setThumbnailPreview(URL.createObjectURL(file))
                  } else {
                    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
                    setThumbnailPreview(null)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="access_type" className={labelClasses}>
              Access Type
            </label>
            <select id="access_type" name="access_type" className={inputClasses}>
              <option value="free">Free</option>
              <option value="plan">Plan</option>
              <option value="paid" disabled={!canCreatePaidCourses}>
                Paid {!canCreatePaidCourses ? "(Upgrade Required)" : ""}
              </option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Cost for paid courses will be set on the Course Overview page. Courses attached to subscription plans are configured by site administrators.
            </p>
            {remainingPaidCourses === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                You have reached your paid course limit.{" "}
                <Link href="/members/support" className="underline">
                  Contact Support
                </Link>{" "}
                to upgrade your plan.
              </p>
            )}
            {!canCreatePaidCourses && remainingPaidCourses !== 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Your plan does not allow paid courses.{" "}
                <Link href="/members/support" className="underline ml-1">
                  Contact support
                </Link>{" "}
                to upgrade your plan.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="category" className={labelClasses}>
              Category
            </label>
            <select id="category_id" name="category_id" className={inputClasses}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tag_filter" className={labelClasses}>
              Tags
            </label>
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id)
                  return (
                    <span
                      key={id}
                      className="px-2 py-1 text-xs rounded bg-gray-200 flex items-center gap-1"
                    >
                      {tag?.name ?? id}
                      <button
                        type="button"
                        onClick={() => removeTag(id)}
                        className="hover:text-red-600"
                        aria-label="Remove tag"
                      >
                        <i className="fa-solid fa-times text-[10px]"></i>
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <input
              id="tag_filter"
              type="text"
              placeholder="Type to filter tags..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className={inputClasses}
            />
            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {filteredTags.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  {tagFilter ? "No matching tags" : "All tags selected or no tags available"}
                </p>
              ) : (
                filteredTags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addTag(t.id)}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                  >
                    {t.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Community Group */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Group</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="group_name" className={labelClasses}>
              Group Name
            </label>
            <input
              id="group_name"
              name="group_name"
              type="text"
              placeholder="e.g. Course Discussion"
              value={groupName}
              onChange={(e) => handleGroupNameChange(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="group_description" className={labelClasses}>
              Group Description
            </label>
            <textarea
              id="group_description"
              name="group_description"
              rows={3}
              placeholder="Describe the community..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div>
            <label className={labelClasses}>Group Image (Listing Image)</label>
            <div className="mt-2">
              {listingImagePreview && (
                <img
                  src={listingImagePreview}
                  alt="Group listing image preview"
                  className="w-40 aspect-video object-cover rounded-lg border mb-2"
                />
              )}
              <input
                name="group_listing_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (listingImagePreview) URL.revokeObjectURL(listingImagePreview)
                    setListingImagePreview(URL.createObjectURL(file))
                  } else {
                    if (listingImagePreview) URL.revokeObjectURL(listingImagePreview)
                    setListingImagePreview(null)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Group Icon / Avatar</label>
            <div className="mt-2">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Group avatar preview"
                  className="w-16 h-16 object-cover rounded-full border mb-2"
                />
              )}
              <input
                name="group_avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
                    setAvatarPreview(URL.createObjectURL(file))
                  } else {
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
                    setAvatarPreview(null)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Group Header</label>
            <div className="mt-2">
              {headerPreview && (
                <img
                  src={headerPreview}
                  alt="Group header preview"
                  className="w-48 aspect-video object-cover rounded-lg border mb-2"
                />
              )}
              <input
                name="group_header"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (headerPreview) URL.revokeObjectURL(headerPreview)
                    setHeaderPreview(URL.createObjectURL(file))
                  } else {
                    if (headerPreview) URL.revokeObjectURL(headerPreview)
                    setHeaderPreview(null)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Terms */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Terms</h2>
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 mb-4 text-sm text-gray-700 space-y-2">
          <p>
            Creating this course means you are allowing members of this community to access or purchase the course.
          </p>
          <p>
            If you later stop offering the course, existing students will retain access and the course cannot be deleted from the system.
          </p>
          <p>
            Stopping a course offering will retire the course and remove editing access.
          </p>
        </div>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsCheck1}
              onChange={(e) => setTermsCheck1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I understand that once users access or purchase this course it cannot be deleted and will only be retired.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsCheck2}
              onChange={(e) => setTermsCheck2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              The content in this course is my own or I have permission to use it. This community is not responsible for copyright or intellectual property violations.
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/members/courses/builder"
          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || !termsCheck1 || !termsCheck2}
          className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "Create Course"}
        </button>
      </div>
    </form>
  )
}
