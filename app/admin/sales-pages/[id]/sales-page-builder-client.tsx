"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  GripVertical,
  ChevronDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { EditSectionModal } from "@/components/admin/sales-pages/EditSectionModal"
import { normalizePublicSlug } from "@/lib/slug"
import { updateSalesPageSections, updateSalesPageMetadata } from "../builder/sales-pages-actions"
import type { SalesPageSection } from "../builder/sales-pages-actions"

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  community_vision: "Community Vision",
  community_features: "Community Features",
  member_experience: "Member Experience",
  education_section: "Education",
  courses_section: "Courses",
  marketplace_section: "Marketplace",
  ai_mentors: "AI Mentors",
  tool_highlight: "Tool Highlight Section",
  masterclasses_highlight: "Masterclasses Highlight",
  membership_plans: "Membership Plans",
  founders_bridge: "Founders Bridge",
  cta: "CTA",
  generic: "Generic Section",
}

function PreviewModal({
  open,
  onOpenChange,
  pageId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0" showCloseButton={false}>
        <div className="w-full h-full flex flex-col">
          <div className="flex justify-between items-center p-4 border-b shrink-0">
            <h2 className="text-lg font-semibold">Page Preview</h2>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <iframe
              src={`/preview/${pageId}`}
              className="w-full h-full border-0"
              title="Page preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ADD_SECTION_OPTIONS = [
  { type: "hero", label: "Hero" },
  { type: "community_vision", label: "Community Vision" },
  { type: "community_features", label: "Community Features" },
  { type: "member_experience", label: "Member Experience" },
  { type: "education_section", label: "Education" },
  { type: "courses_section", label: "Courses" },
  { type: "marketplace_section", label: "Marketplace" },
  { type: "ai_mentors", label: "AI Mentors" },
  { type: "tool_highlight", label: "Tool Highlight Section" },
  { type: "masterclasses_highlight", label: "Masterclasses Highlight" },
  { type: "membership_plans", label: "Membership Plans" },
  { type: "founders_bridge", label: "Founders Bridge" },
  { type: "cta", label: "CTA" },
  { type: "generic", label: "Generic Section" },
]

interface Props {
  pageId: string
  pageTitle: string
  pageSlug: string
  isHomepage?: boolean
  initialSections: SalesPageSection[]
}

export function SalesPageBuilderClient({
  pageId,
  pageTitle,
  pageSlug,
  isHomepage = false,
  initialSections,
}: Props) {
  const [sections, setSections] = useState<SalesPageSection[]>(initialSections)
  const [pageName, setPageName] = useState(pageTitle)
  const [slug, setSlug] = useState(pageSlug)

  useEffect(() => {
    setPageName(pageTitle)
  }, [pageTitle])
  const [saving, setSaving] = useState(false)
  const [editingSection, setEditingSection] = useState<SalesPageSection | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const initialSectionsRef = useRef(initialSections)

  const saveSections = useCallback(
    async (newSections: SalesPageSection[]) => {
      setSaving(true)
      await updateSalesPageSections(pageId, newSections)
      setSaving(false)
    },
    [pageId]
  )

  useEffect(() => {
    if (JSON.stringify(sections) === JSON.stringify(initialSectionsRef.current)) {
      return
    }
    const id = setTimeout(() => {
      saveSections(sections)
    }, 500)
    return () => clearTimeout(id)
  }, [sections, saveSections])

  const toggleEnabled = (index: number) => {
    const section = sections[index]
    const updated = [...sections]
    updated[index] = { ...section, enabled: !section.enabled }
    setSections(updated)
  }

  const duplicateSection = (index: number) => {
    const section = sections[index]
    const copy: SalesPageSection = {
      ...JSON.parse(JSON.stringify(section)),
      id: `${section.type}-${crypto.randomUUID().slice(0, 8)}`,
      content: section.content ?? {},
      settings: section.settings ?? {},
    }
    const reordered = [...sections]
    reordered.splice(index + 1, 0, copy)
    setSections(reordered)
  }

  const deleteSection = (index: number) => {
    const reordered = sections.filter((_, i) => i !== index)
    setSections(reordered)
  }

  const addSection = (type: string) => {
    const newSection: SalesPageSection = {
      id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
      type,
      enabled: true,
      settings: {},
      content: {},
    }
    setSections((prev) => [...prev, newSection])
  }

  const handleSaveSection = (updatedSection: SalesPageSection) => {
    setSections((prev) =>
      prev.map((s) => (s.id === updatedSection.id ? updatedSection : s))
    )
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDropIndex(index)
  }

  const handleDragLeave = () => {
    setDropIndex(null)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDragIndex(null)
    setDropIndex(null)
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (fromIndex === toIndex || isNaN(fromIndex)) return
    const reordered = [...sections]
    const [removed] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, removed)
    setSections(reordered)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

  const saveSlug = useCallback(
    async (newSlug: string) => {
      const normalized = normalizePublicSlug(newSlug)
      if (!normalized) return
      const result = await updateSalesPageMetadata(pageId, { slug: normalized })
      if (result.success) {
        setSlug(normalized)
        toast.success("URL updated")
      } else {
        toast.error(result.error ?? "Failed to update URL")
      }
    },
    [pageId]
  )

  const handleSlugBlur = () => {
    const normalized = normalizePublicSlug(slug)
    if (normalized && normalized !== normalizePublicSlug(pageSlug)) {
      saveSlug(normalized)
    }
  }

  const handlePageNameBlur = async () => {
    const trimmed = pageName.trim()
    if (!trimmed || trimmed === pageTitle) return
    const result = await updateSalesPageMetadata(pageId, { title: trimmed })
    if (result.success) {
      toast.success("Page name updated")
    } else {
      toast.error(result.error ?? "Failed to update page name")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Page Name
              </label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                onBlur={handlePageNameBlur}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Sales Page Name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Page URL
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  onBlur={handleSlugBlur}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="page-slug"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This controls the public page URL. {isHomepage && "(Currently set as homepage)"}
              </p>
            </div>
          </div>
          <Link
            href="/admin/sales-pages"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to list
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ADD_SECTION_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.type}
                  onSelect={() => addSection(opt.type)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            Preview Page
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm
              ${section.enabled === false ? "opacity-60" : ""}
              ${dropIndex === i ? "ring-2 ring-blue-300" : ""}
              ${dragIndex === i ? "opacity-70" : ""}
            `}
          >
            <span
              className="shrink-0 text-gray-400 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
              title="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </span>

            <div className="flex-1 min-w-0">
              <span
                className={
                  section.enabled !== false
                    ? "font-medium text-gray-900"
                    : "font-medium text-gray-400 line-through"
                }
              >
                {SECTION_LABELS[section.type] || section.type}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.enabled !== false}
                  onChange={() => toggleEnabled(i)}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-600">Enable</span>
              </label>
              <button
                type="button"
                onClick={() => setEditingSection(section)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => duplicateSection(i)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteSection(i)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <EditSectionModal
        isOpen={editingSection !== null}
        onClose={() => setEditingSection(null)}
        section={editingSection}
        pageId={pageId}
        onSave={handleSaveSection}
      />

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pageId={pageId}
      />
    </div>
  )
}
