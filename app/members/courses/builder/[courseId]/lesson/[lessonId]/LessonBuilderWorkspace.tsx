"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DndContext, closestCenter } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { insertBlockAtTop, reorderBlocks, deleteBlock, saveLesson } from "./actions"
import VideoBlock from "@/components/course-blocks/VideoBlock"
import TextBlock from "@/components/course-blocks/TextBlock"
import DownloadBlock from "@/components/course-blocks/DownloadBlock"
import ExternalLinkBlock from "@/components/course-blocks/ExternalLinkBlock"
import CTABlock from "@/components/course-blocks/CTABlock"
import CalloutBlock from "@/components/course-blocks/CalloutBlock"
import ImageBlock from "@/components/course-blocks/ImageBlock"
import AudioBlock from "@/components/course-blocks/AudioBlock"
import EmbedBlock from "@/components/course-blocks/EmbedBlock"
import DividerBlock from "@/components/course-blocks/DividerBlock"
import HeadlineBlock from "@/components/course-blocks/HeadlineBlock"
import SectionHeaderBlock from "@/components/course-blocks/SectionHeaderBlock"
import JournalBlock from "@/components/course-blocks/JournalBlock"
import BlockPicker from "./BlockPicker"
import LessonSettings from "@/components/courses/LessonSettings"

type Lesson = {
  id?: string
  title?: string
  description?: string
  thumbnail_url?: string
  drip_days?: number
  release_date?: string
  content_blocks?: unknown[]
}
type Block = { id?: string; type?: string; [key: string]: unknown }

const PALETTE_BLOCKS = [
  {
    type: "headline",
    label: "Headline",
    desc: "Large centered headline",
    className: "from-fuchsia-50 to-fuchsia-100 border-fuchsia-200 hover:border-fuchsia-300",
    iconBg: "bg-fuchsia-500",
    icon: "fa-heading"
  },
  {
    type: "section",
    label: "Section Header",
    desc: "Organize lesson sections",
    className: "from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300",
    iconBg: "bg-indigo-600",
    icon: "fa-bars"
  },
  {
    type: "text",
    label: "Text",
    desc: "Rich text editor",
    className: "from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300",
    iconBg: "bg-purple-500",
    icon: "fa-align-left"
  },
  {
    type: "video",
    label: "Video",
    desc: "Embed videos",
    className: "from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300",
    iconBg: "bg-blue-500",
    icon: "fa-play"
  },
  {
    type: "image",
    label: "Image",
    desc: "Add images",
    className: "from-pink-50 to-pink-100 border-pink-200 hover:border-pink-300",
    iconBg: "bg-pink-500",
    icon: "fa-image"
  },
  {
    type: "journal",
    label: "Journal Question",
    desc: "Student reflection question",
    className: "from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300",
    iconBg: "bg-orange-500",
    icon: "fa-pen"
  },
  {
    type: "audio",
    label: "Audio",
    desc: "Audio files",
    className: "from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300",
    iconBg: "bg-indigo-500",
    icon: "fa-headphones"
  },
  {
    type: "external_link",
    label: "External Link",
    desc: "Link to outside resource",
    className: "from-sky-50 to-sky-100 border-sky-200 hover:border-sky-300",
    iconBg: "bg-sky-500",
    icon: "fa-up-right-from-square"
  },
  {
    type: "cta",
    label: "Call To Action",
    desc: "Button link for next step",
    className: "from-rose-50 to-rose-100 border-rose-200 hover:border-rose-300",
    iconBg: "bg-rose-500",
    icon: "fa-bullhorn"
  },
  {
    type: "download",
    label: "Download",
    desc: "File downloads",
    className: "from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-300",
    iconBg: "bg-emerald-500",
    icon: "fa-file-arrow-down"
  },
  {
    type: "callout",
    label: "Callout",
    desc: "Highlight text",
    className: "from-amber-50 to-amber-100 border-amber-200 hover:border-amber-300",
    iconBg: "bg-amber-500",
    icon: "fa-lightbulb"
  },
  {
    type: "embed",
    label: "Embed",
    desc: "Embed content",
    className: "from-cyan-50 to-cyan-100 border-cyan-200 hover:border-cyan-300",
    iconBg: "bg-cyan-500",
    icon: "fa-code"
  },
  {
    type: "divider",
    label: "Divider",
    desc: "Visual separator",
    className: "from-gray-50 to-gray-100 border-gray-200 hover:border-gray-300",
    iconBg: "bg-gray-500",
    icon: "fa-minus"
  }
] as const

export default function LessonBuilderWorkspace({
  lessonId,
  courseId,
  lesson,
  blocks,
}: {
  lessonId: string
  courseId: string
  lesson: Lesson
  blocks: Block[]
}) {
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks)
  const [localLesson, setLocalLesson] = useState<Lesson>(lesson)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const prevBlocksRef = useRef(JSON.stringify(blocks))
  const prevLessonRef = useRef(JSON.stringify(lesson))
  const router = useRouter()

  useEffect(() => {
    setLocalBlocks(blocks)
    setLocalLesson(lesson)
  }, [lessonId])

  useEffect(() => {
    const blocksChanged = JSON.stringify(localBlocks) !== prevBlocksRef.current
    const lessonChanged = JSON.stringify({
      title: localLesson.title,
      description: localLesson.description,
      thumbnail_url: localLesson.thumbnail_url,
      drip_days: localLesson.drip_days,
      release_date: localLesson.release_date,
      requires_previous_completion: localLesson.requires_previous_completion,
    }) !== prevLessonRef.current

    if (!blocksChanged && !lessonChanged) return

    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true)
        await saveLesson(lessonId, courseId, localBlocks, {
          title: localLesson.title,
          description: localLesson.description,
          thumbnail_url: localLesson.thumbnail_url,
          drip_days: localLesson.drip_days,
          release_date: localLesson.release_date,
          requires_previous_completion: localLesson.requires_previous_completion,
        })
        prevBlocksRef.current = JSON.stringify(localBlocks)
        prevLessonRef.current = JSON.stringify({
          title: localLesson.title,
          description: localLesson.description,
          thumbnail_url: localLesson.thumbnail_url,
          drip_days: localLesson.drip_days,
          release_date: localLesson.release_date,
          requires_previous_completion: localLesson.requires_previous_completion,
        })
        setLastSavedAt(new Date())
      } catch (err) {
        console.error("Autosave failed", err)
      } finally {
        setIsSaving(false)
      }
    }, 2000)

    return () => clearTimeout(timeout)
  }, [localBlocks, localLesson, lessonId, courseId])

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const supabase = createClient()
    if (!supabase) return null

    const filePath = `lessons/${lessonId}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, file)

    if (error) {
      console.error(error)
      return null
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  }

  const updateBlock = (blockId: string, updates: Record<string, unknown>) => {
    setLocalBlocks((prev) =>
      prev.map((b, i) =>
        ((b.id as string) ?? `block-${i}`) === blockId ? { ...b, ...updates } : b
      )
    )
  }

  const handleInsertBlock = async (type: string) => {
    const result = await insertBlockAtTop(lessonId, courseId, type)
    if (result?.newBlock) {
      setLocalBlocks((prev) => [result.newBlock as Block, ...prev])
    } else {
      router.refresh()
    }
  }

  const handleDuplicateBlock = (blockId: string) => {
    const index = localBlocks.findIndex(
      (b, i) => ((b.id as string) ?? `block-${i}`) === blockId
    )
    if (index === -1) return
    const block = localBlocks[index]
    const duplicate = {
      ...block,
      id: crypto.randomUUID()
    }
    setLocalBlocks((prev) => [
      ...prev.slice(0, index + 1),
      duplicate,
      ...prev.slice(index + 1)
    ])
  }

  const handleDeleteBlock = async (blockId: string) => {
    setLocalBlocks((prev) => prev.filter((b) => (b.id ?? b) !== blockId))
    setSelectedBlockId(null)
    await deleteBlock(lessonId, courseId, blockId)
    router.refresh()
  }

  const handleSortEnd = async (event: {
    active: { id: string | number }
    over: { id: string | number } | null
  }) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const getId = (b: Block, i: number) => (b.id as string) ?? `block-${i}`
    const oldIndex = localBlocks.findIndex((b, i) => getId(b, i) === active.id)
    const newIndex = localBlocks.findIndex((b, i) => getId(b, i) === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localBlocks, oldIndex, newIndex)
    setLocalBlocks(reordered)
    await reorderBlocks(lessonId, courseId, reordered)
    router.refresh()
  }

  const handleManualSave = async () => {
    await saveLesson(lessonId, courseId, localBlocks, {
      title: localLesson.title,
      description: localLesson.description,
      thumbnail_url: localLesson.thumbnail_url,
      drip_days: localLesson.drip_days,
      release_date: localLesson.release_date,
      requires_previous_completion: localLesson.requires_previous_completion,
    })
    toast.success("Lesson saved")
    router.refresh()
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleSortEnd}>
      <div className="flex h-full">
        {/* LEFT PALETTE */}
        <div
          id="block-library-sidebar"
          className="w-[260px] border-r border-gray-200 bg-gray-50 flex-shrink-0 hidden lg:flex flex-col h-screen sticky top-0"
        >
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Blocks</h3>
            <p className="text-xs text-gray-500 mt-1">Click to insert</p>
          </div>

          <div className="p-4 space-y-2 overflow-y-auto flex-1">
            {PALETTE_BLOCKS.map(({ type, label, desc, className, iconBg, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleInsertBlock(type)}
                className={`w-full text-left transition-all hover:-translate-y-0.5 bg-gradient-to-br ${className} rounded-lg p-4 border hover:shadow-md`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fa-solid ${icon} text-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-600">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <LessonCanvas
          blocks={localBlocks}
          lessonId={lessonId}
          courseId={courseId}
          selectedBlockId={selectedBlockId}
          setSelectedBlockId={setSelectedBlockId}
          onDeleteBlock={handleDeleteBlock}
          onManualSave={handleManualSave}
          onInsertBlock={handleInsertBlock}
          updateBlock={updateBlock}
          uploadFile={uploadFile}
          onDuplicateBlock={handleDuplicateBlock}
          onDeleteBlock={handleDeleteBlock}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onToggleSettings={() => setSettingsOpen(!settingsOpen)}
        />

        {/* RIGHT LESSON SETTINGS */}
        {settingsOpen && (
          <div className="w-[320px] border-l border-gray-200 bg-white p-6 flex-shrink-0 transition-all duration-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Lesson Settings</h3>
            <LessonSettings
              lesson={localLesson}
              setLesson={setLocalLesson}
            />
          </div>
        )}
      </div>
    </DndContext>
  )
}

function LessonCanvas({
  blocks,
  lessonId,
  courseId,
  selectedBlockId,
  setSelectedBlockId,
  onDeleteBlock,
  onManualSave,
  onInsertBlock,
  updateBlock,
  uploadFile,
  onDuplicateBlock,
  isSaving,
  lastSavedAt,
  onToggleSettings,
}: {
  blocks: Block[]
  lessonId: string
  courseId: string
  selectedBlockId: string | null
  setSelectedBlockId: (id: string | null) => void
  onDeleteBlock: (blockId: string) => Promise<void>
  onManualSave: () => Promise<void>
  onInsertBlock: (type: string) => Promise<void>
  updateBlock: (blockId: string, updates: Record<string, unknown>) => void
  uploadFile: (file: File, bucket: string) => Promise<string | null>
  onDuplicateBlock: (blockId: string) => void
  isSaving?: boolean
  lastSavedAt?: Date | null
  onToggleSettings?: () => void
}) {
  const blockIds = blocks
    .map((b, i) => (b.id as string) ?? `block-${i}`)
    .filter(Boolean)

  return (
    <div id="lesson-canvas-main" className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8 space-y-3">
        <Link
          href={`/members/courses/builder/${courseId}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-3"
        >
          <i className="fa-solid fa-arrow-left text-xs"></i>
          Back to Overview
        </Link>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Lesson Builder
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Build your lesson using the content blocks on the left. Add blocks, enter your content, and arrange them in the order you want by dragging blocks up or down.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-6 shrink-0">
            {isSaving && (
              <span className="text-xs text-gray-500">
                Saving...
              </span>
            )}
            {!isSaving && lastSavedAt && (
              <span className="text-xs text-gray-400">
                Saved
              </span>
            )}
            {onToggleSettings && (
              <button
                type="button"
                onClick={onToggleSettings}
                className="p-2 rounded-md hover:bg-gray-100 transition"
                title="Lesson Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onManualSave}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
            >
              Save Lesson
            </button>
          </div>
        </div>

        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-500">
              <p className="text-sm font-medium">Start building your lesson</p>
              <p className="text-xs mt-1 mb-4">Click a block from the left or add one below</p>
              <div className="flex justify-center">
                <BlockPicker lessonId={lessonId} courseId={courseId} variant="empty" onInsertBlock={onInsertBlock} />
              </div>
            </div>
          ) : (
            blocks.map((block: Block, index: number) => {
              const blockId = (block.id as string) ?? `block-${index}`

              let BlockComponent = null
              if (block.type === "video") {
                BlockComponent = <VideoBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "text") {
                BlockComponent = <TextBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "external_link") {
                BlockComponent = (
                  <ExternalLinkBlock
                    block={block}
                    updateBlock={updateBlock}
                    onDuplicateBlock={onDuplicateBlock}
                    onDeleteBlock={onDeleteBlock}
                  />
                )
              } else if (block.type === "cta") {
                BlockComponent = (
                  <CTABlock
                    block={block}
                    updateBlock={updateBlock}
                    onDuplicateBlock={onDuplicateBlock}
                    onDeleteBlock={onDeleteBlock}
                  />
                )
              } else if (block.type === "download") {
                BlockComponent = <DownloadBlock block={block} updateBlock={updateBlock} uploadFile={uploadFile} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "callout") {
                BlockComponent = <CalloutBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "image") {
                BlockComponent = <ImageBlock block={block} updateBlock={updateBlock} uploadFile={uploadFile} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "audio") {
                BlockComponent = <AudioBlock block={block} updateBlock={updateBlock} uploadFile={uploadFile} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "embed") {
                BlockComponent = <EmbedBlock block={block} updateBlock={updateBlock} />
              } else if (block.type === "divider") {
                BlockComponent = <DividerBlock />
              } else if (block.type === "headline") {
                BlockComponent = <HeadlineBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "section") {
                BlockComponent = <SectionHeaderBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else if (block.type === "journal") {
                BlockComponent = <JournalBlock block={block} updateBlock={updateBlock} onDuplicateBlock={onDuplicateBlock} onDeleteBlock={onDeleteBlock} />
              } else {
                return null
              }

              return (
                <SortableBlockWrapper
                  key={blockId}
                  id={blockId}
                  isSelected={selectedBlockId === blockId}
                  onSelect={() => setSelectedBlockId(blockId)}
                  onDelete={block.id ? () => onDeleteBlock(block.id as string) : undefined}
                >
                  {BlockComponent}
                </SortableBlockWrapper>
              )
            })
          )}
        </SortableContext>
      </div>
    </div>
  )
}

function SortableBlockWrapper({
  id,
  children,
  isSelected,
  onSelect,
  onDelete,
}: {
  id: string
  children: React.ReactNode
  isSelected: boolean
  onSelect: () => void
  onDelete?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const child = React.Children.only(children) as React.ReactElement
  const childWithDragProps = React.cloneElement(child, {
    dragListeners: listeners,
    dragAttributes: attributes,
  } as Record<string, unknown>)

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative rounded-xl bg-white border border-gray-200 shadow-sm transition-all ${
        isDragging ? "opacity-50 z-50" : ""
      } ${
        isSelected
          ? "ring-2 ring-blue-500"
          : "hover:ring-1 hover:ring-gray-300"
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-red-600 shadow-sm hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
      {childWithDragProps}
    </div>
  )
}
