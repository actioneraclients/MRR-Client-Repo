"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateCourseTaxonomies } from "@/app/members/courses/builder/[courseId]/actions"

type TaxonomyOption = { id: string; name: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  categories: TaxonomyOption[]
  tags: TaxonomyOption[]
  selectedCategoryId: string | null
  selectedTagIds: string[]
}

export function CourseTaxonomyModal({
  open,
  onOpenChange,
  courseId,
  categories,
  tags,
  selectedCategoryId,
  selectedTagIds,
}: Props) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategoryId)
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds)

  useEffect(() => {
    if (open) {
      setCategoryId(selectedCategoryId)
      setTagIds(selectedTagIds)
    }
  }, [open, selectedCategoryId, selectedTagIds])

  const addTag = (tagId: string) => {
    if (!tagIds.includes(tagId)) {
      setTagIds((prev) => [...prev, tagId])
    }
  }

  const removeTag = (tagId: string) => {
    setTagIds((prev) => prev.filter((id) => id !== tagId))
  }

  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsPending(true)
    try {
      const result = await updateCourseTaxonomies(formData)
      if (result?.success) {
        router.refresh()
        onOpenChange(false)
      } else if (result?.error) {
        alert(result.error)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Course Categories & Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1 — Category */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="h-9 w-full border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section 2 — Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tags
            </label>
            <select
              value=""
              onChange={(e) => {
                const tagId = e.target.value
                if (tagId) {
                  addTag(tagId)
                  e.target.value = ""
                }
              }}
              className="h-9 w-full border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            >
              <option value="">Add tag</option>
              {tags
                .filter((t) => !tagIds.includes(t.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>

            {/* Selected tags as badges */}
            {tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tagIds.map((id) => {
                  const tag = tags.find((t) => t.id === id)
                  return (
                    <span
                      key={id}
                      className="px-2 py-1 text-xs bg-primary text-white rounded-full flex items-center gap-1"
                    >
                      {tag?.name ?? id}
                      <button
                        type="button"
                        onClick={() => removeTag(id)}
                        className="ml-1 text-white/80 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="categoryId" value={categoryId ?? ""} />
            <input type="hidden" name="tagIds" value={JSON.stringify(tagIds)} />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
