"use client"

import { useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { DndContext, closestCenter } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { BackgroundFields } from "./BackgroundFields"
import TeamEditor from "./TeamEditor"

const INPUT_CLASS = "w-full border rounded p-2 text-sm"
const LABEL_CLASS = "block text-xs font-medium text-slate-600 mb-1"

type OfferItem = {
  title?: string
  description?: string
  image_url?: string
  icon?: string
  badge?: string
  bullets?: string[]
  cta?: {
    mode: "community" | "external"
    label: string
    url?: string
  }
}

type OfferCategory = {
  title?: string
  layout?: "grid" | "feature"
  items?: OfferItem[]
}

function updateOfferItem(
  c: Record<string, unknown>,
  catIndex: number,
  itemIndex: number,
  updates: Partial<OfferItem>
): OfferCategory[] {
  const categories = JSON.parse(JSON.stringify((c.categories as OfferCategory[]) || []))
  while (categories.length <= catIndex) categories.push({ title: "", layout: "grid", items: [] })
  if (!categories[catIndex]) categories[catIndex] = { title: "", layout: "grid", items: [] }
  if (!categories[catIndex].items) categories[catIndex].items = []
  categories[catIndex].items[itemIndex] = { ...categories[catIndex].items[itemIndex], ...updates }
  return categories
}

function removeOfferItem(c: Record<string, unknown>, catIndex: number, itemIndex: number): OfferCategory[] {
  const categories = JSON.parse(JSON.stringify((c.categories as OfferCategory[]) || []))
  if (categories[catIndex]?.items) {
    categories[catIndex].items = categories[catIndex].items.filter((_: OfferItem, i: number) => i !== itemIndex)
  }
  return categories
}

function reorderOfferItems(
  c: Record<string, unknown>,
  catIndex: number,
  oldIndex: number,
  newIndex: number
): OfferCategory[] {
  const categories = JSON.parse(JSON.stringify((c.categories as OfferCategory[]) || []))
  if (!categories[catIndex]?.items) return categories
  categories[catIndex].items = arrayMove(categories[catIndex].items, oldIndex, newIndex)
  return categories
}

function SortableOfferCard({
  id,
  item,
  expanded,
  onToggle,
  children,
}: {
  id: string
  item: OfferItem
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="mb-3">
      <div className="border rounded-lg bg-gray-50 overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-100 hover:bg-gray-200"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <div
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
            >
              ⋮⋮
            </div>
            <span className="font-medium text-sm">
              {item.title || "New Offer Card"}
            </span>
          </div>
          <span className="text-gray-400">
            {expanded ? "▾" : "▸"}
          </span>
        </div>
        {expanded && (
          <div className="p-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

function OfferCardEditor({
  item,
  catIndex,
  itemIndex,
  c,
  updateField,
}: {
  item: OfferItem
  catIndex: number
  itemIndex: number
  c: Record<string, unknown>
  updateField: (field: string, value: unknown) => void
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Title"
        value={item.title || ""}
        onChange={(e) => updateField("categories", updateOfferItem(c, catIndex, itemIndex, { title: e.target.value }))}
        className="w-full border rounded p-2"
      />
      <textarea
        placeholder="Description"
        value={item.description || ""}
        onChange={(e) => updateField("categories", updateOfferItem(c, catIndex, itemIndex, { description: e.target.value }))}
        className="w-full border rounded p-2"
      />

      <div className="space-y-3">
        <label className="text-sm font-medium">Image</label>
        <div className="flex items-start gap-4">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              className="w-32 h-20 object-cover rounded border"
            />
          ) : (
            <div className="w-32 h-20 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">
              No Image
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="inline-block cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm rounded border">
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const fileName = `${Date.now()}-${file.name}`
                  const { error } = await supabase.storage
                    .from("about")
                    .upload(fileName, file)
                  if (error) {
                    console.error("Image upload failed", error)
                    return
                  }
                  const { data } = supabase.storage
                    .from("about")
                    .getPublicUrl(fileName)
                  updateField("categories", updateOfferItem(c, catIndex, itemIndex, { image_url: data.publicUrl }))
                  e.target.value = ""
                }}
              />
            </label>
            {item.image_url && (
              <button
                type="button"
                onClick={() =>
                  updateField("categories", updateOfferItem(c, catIndex, itemIndex, { image_url: "" }))
                }
                className="text-xs text-red-500"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bullets</label>
        {(item.bullets || []).map((bullet, bulletIndex) => (
          <input
            key={bulletIndex}
            type="text"
            value={bullet}
            onChange={(e) => {
              const bullets = [...(item.bullets || [])]
              bullets[bulletIndex] = e.target.value
              updateField("categories", updateOfferItem(c, catIndex, itemIndex, { bullets }))
            }}
            className="w-full border rounded p-2"
          />
        ))}
        <button
          type="button"
          onClick={() => {
            const bullets = [...(item.bullets || []), ""]
            updateField("categories", updateOfferItem(c, catIndex, itemIndex, { bullets }))
          }}
          className="text-sm text-blue-600"
        >
          + Add Bullet
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">CTA Label</label>
        <input
          type="text"
          value={item.cta?.label || ""}
          onChange={(e) =>
            updateField("categories", updateOfferItem(c, catIndex, itemIndex, {
              cta: { ...item.cta, mode: item.cta?.mode || "community", label: e.target.value, url: item.cta?.url },
            }))
          }
          className="w-full border rounded p-2"
        />
        <label className="text-sm font-medium">CTA Mode</label>
        <select
          value={item.cta?.mode || "community"}
          onChange={(e) =>
            updateField("categories", updateOfferItem(c, catIndex, itemIndex, {
              cta: { ...item.cta, mode: e.target.value as "community" | "external", label: item.cta?.label || "Learn More", url: item.cta?.url },
            }))
          }
          className="w-full border rounded p-2"
        >
          <option value="community">Community Page</option>
          <option value="external">External Link</option>
        </select>
        {item.cta?.mode === "external" && (
          <input
            type="text"
            placeholder="External URL"
            value={item.cta?.url || ""}
            onChange={(e) =>
              updateField("categories", updateOfferItem(c, catIndex, itemIndex, {
                cta: { ...item.cta, url: e.target.value, mode: "external", label: item.cta?.label || "Learn More" },
              }))
            }
            className="w-full border rounded p-2"
          />
        )}
      </div>

      <input
        type="text"
        placeholder="Badge (optional)"
        value={item.badge || ""}
        onChange={(e) => updateField("categories", updateOfferItem(c, catIndex, itemIndex, { badge: e.target.value }))}
        className="w-full border rounded p-2"
      />

      <button
        type="button"
        onClick={() => updateField("categories", removeOfferItem(c, catIndex, itemIndex))}
        className="text-red-600 text-sm"
      >
        Remove Card
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
        rows={3}
      />
    </div>
  )
}

function ImageUploadField({
  label,
  section,
  updateSection,
}: {
  label: string
  section: any
  updateSection: (updated: any) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrl = (section?.content?.image_url as string) || ""

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size === 0) return

    setUploading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const ext = file.name.split(".").pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from("about")
        .upload(filename, file, {
          upsert: true,
          contentType: file.type,
        })

      if (error) throw error

      const { data } = supabase.storage
        .from("about")
        .getPublicUrl(filename)

      updateSection({
        ...section,
        content: {
          ...section.content,
          image_url: data.publicUrl,
        },
      })
    } catch (err) {
      console.error("Image upload failed", err)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function removeImage() {
    updateSection({
      ...section,
      content: {
        ...section.content,
        image_url: "",
      },
    })
  }

  return (
    <div className="space-y-2">
      <label className={LABEL_CLASS}>{label}</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden
      />

      {imageUrl ? (
        <div className="space-y-2">
          <img
            src={imageUrl}
            alt="Preview"
            className="rounded-md border max-h-48 w-auto max-w-full object-cover"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Replace Image"}
            </button>
            <button
              type="button"
              onClick={removeImage}
              className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
            >
              Remove Image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload Image"}
        </button>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced (URL)
        </button>
        {showAdvanced && (
          <input
            type="text"
            value={imageUrl}
            onChange={(e) =>
              updateSection({
                ...section,
                content: {
                  ...section.content,
                  image_url: e.target.value,
                },
              })
            }
            placeholder="Paste image URL"
            className={`${INPUT_CLASS} mt-1`}
          />
        )}
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function SectionEditor({
  section,
  selectedIndex,
  updateSection,
}: {
  section: any
  selectedIndex: number | null
  updateSection: (updated: any) => void
}) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  function toggleCard(key: string) {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (!section) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        Select a section to edit.
      </div>
    )
  }

  function updateField(field: string, value: any) {
    updateSection({
      ...section,
      content: {
        ...section.content,
        [field]: value,
      },
    })
  }

  function updateRoot(field: string, value: any) {
    updateSection({ ...section, [field]: value })
  }

  function updateContent(content: Record<string, unknown>) {
    updateSection({ ...section, content: { ...section.content, ...content } })
  }

  const c = section.content || {}

  // --- HERO ---
  if (section.type === "hero") {
    const ctas = Array.isArray(c.ctas) ? c.ctas : []
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Hero</h3>

        <Field
          label="Headline"
          value={(c.headline as string) || ""}
          onChange={(v) => updateField("headline", v)}
          placeholder="Headline"
        />
        <TextAreaField
          label="Subheadline"
          value={(c.subheadline as string) || ""}
          onChange={(v) => updateField("subheadline", v)}
          placeholder="Subheadline"
        />
        <ImageUploadField label="Image" section={section} updateSection={updateSection} />

        <div>
          <label className={LABEL_CLASS}>CTAs</label>
          {ctas.map((cta: any, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={cta?.label || ""}
                onChange={(e) => {
                  const n = [...ctas]
                  n[i] = { ...n[i], label: e.target.value }
                  updateField("ctas", n)
                }}
                placeholder="Label"
                className="flex-1 border rounded p-2 text-sm"
              />
              <input
                type="text"
                value={cta?.href || ""}
                onChange={(e) => {
                  const n = [...ctas]
                  n[i] = { ...n[i], href: e.target.value }
                  updateField("ctas", n)
                }}
                placeholder="href"
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("ctas", ctas.filter((_: any, j: number) => j !== i))}
                className="px-2 text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("ctas", [...ctas, { label: "", href: "" }])}
            className="text-sm text-blue-600"
          >
            Add CTA
          </button>
        </div>

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- PHILOSOPHY ---
  if (section.type === "philosophy") {
    const paras = Array.isArray(c.paragraphs) ? c.paragraphs : []
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Philosophy</h3>

        <Field
          label="Heading"
          value={(c.heading as string) || ""}
          onChange={(v) => updateField("heading", v)}
        />

        <div>
          <label className={LABEL_CLASS}>Paragraphs</label>
          {paras.map((p: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <textarea
                value={p}
                onChange={(e) => {
                  const n = [...paras]
                  n[i] = e.target.value
                  updateField("paragraphs", n)
                }}
                rows={2}
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("paragraphs", paras.filter((_: string, j: number) => j !== i))}
                className="px-2 text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("paragraphs", [...paras, ""])}
            className="text-sm text-blue-600"
          >
            Add Paragraph
          </button>
        </div>

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- STORY ---
  if (section.type === "story") {
    const paras = Array.isArray(c.paragraphs) ? c.paragraphs : []
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Story</h3>

        <Field label="Heading" value={(c.heading as string) || ""} onChange={(v) => updateField("heading", v)} />
        <ImageUploadField label="Image" section={section} updateSection={updateSection} />

        <div>
          <label className={LABEL_CLASS}>Paragraphs</label>
          {paras.map((p: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <textarea
                value={p}
                onChange={(e) => {
                  const n = [...paras]
                  n[i] = e.target.value
                  updateField("paragraphs", n)
                }}
                rows={2}
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("paragraphs", paras.filter((_: string, j: number) => j !== i))}
                className="px-2 text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("paragraphs", [...paras, ""])}
            className="text-sm text-blue-600"
          >
            Add Paragraph
          </button>
        </div>

        <TextAreaField
          label="Pull Quote"
          value={(c.pull_quote as string) || ""}
          onChange={(v) => updateField("pull_quote", v)}
        />

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- COMMUNITY_INTRO ---
  if (section.type === "community_intro") {
    const bullets = Array.isArray(c.bullets) ? c.bullets : []
    const cta = c.cta || {}
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Community Intro</h3>

        <Field label="Subheading" value={(c.subheading as string) || ""} onChange={(v) => updateField("subheading", v)} />
        <Field label="Heading" value={(c.heading as string) || ""} onChange={(v) => updateField("heading", v)} />
        <TextAreaField label="Body" value={(c.body as string) || ""} onChange={(v) => updateField("body", v)} />

        <div>
          <label className={LABEL_CLASS}>Bullets</label>
          {bullets.map((b: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const n = [...bullets]
                  n[i] = e.target.value
                  updateField("bullets", n)
                }}
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("bullets", bullets.filter((_: string, j: number) => j !== i))}
                className="px-2 text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("bullets", [...bullets, ""])}
            className="text-sm text-blue-600"
          >
            Add Bullet
          </button>
        </div>

        <ImageUploadField label="Image" section={section} updateSection={updateSection} />
        <Field label="Video URL" value={(c.video_url as string) || ""} onChange={(v) => updateField("video_url", v)} />

        <SelectField
          label="Layout"
          value={(c.layout as string) || "image-right"}
          onChange={(v) => updateField("layout", v)}
          options={[
            { value: "image-left", label: "Image Left" },
            { value: "image-right", label: "Image Right" },
            { value: "video-left", label: "Video Left" },
            { value: "video-right", label: "Video Right" },
          ]}
        />

        <div className="border-t pt-4">
          <label className={LABEL_CLASS}>CTA</label>
          <SelectField
            label="CTA Mode"
            value={(cta.mode as string) || "community"}
            onChange={(v) => updateField("cta", { ...cta, mode: v })}
            options={[
              { value: "community", label: "Community" },
              { value: "external", label: "External" },
            ]}
          />
          <Field
            label="Label"
            value={(cta.label as string) || ""}
            onChange={(v) => updateField("cta", { ...cta, label: v })}
          />
          {(cta.mode as string) === "external" && (
            <Field
              label="URL"
              value={(cta.url as string) || ""}
              onChange={(v) => updateField("cta", { ...cta, url: v })}
            />
          )}
        </div>

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- VISUAL_BREAK ---
  if (section.type === "visual_break") {
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Visual Break</h3>

        <Field label="Headline" value={(c.headline as string) || ""} onChange={(v) => updateField("headline", v)} />
        <TextAreaField
          label="Subheadline"
          value={(c.subheadline as string) || ""}
          onChange={(v) => updateField("subheadline", v)}
        />

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- COMMUNITY_CTA ---
  if (section.type === "community_cta") {
    const paras = Array.isArray(c.paragraphs) ? c.paragraphs : []
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Community CTA</h3>

        <Field label="Heading" value={(c.heading as string) || ""} onChange={(v) => updateField("heading", v)} />

        <div>
          <label className={LABEL_CLASS}>Paragraphs</label>
          {paras.map((p: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <textarea
                value={p}
                onChange={(e) => {
                  const n = [...paras]
                  n[i] = e.target.value
                  updateField("paragraphs", n)
                }}
                rows={2}
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("paragraphs", paras.filter((_: string, j: number) => j !== i))}
                className="px-2 text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("paragraphs", [...paras, ""])}
            className="text-sm text-blue-600"
          >
            Add Paragraph
          </button>
        </div>

        <Field label="CTA Text" value={(c.cta_text as string) || ""} onChange={(v) => updateField("cta_text", v)} />
        <Field label="CTA URL" value={(c.cta_url as string) || ""} onChange={(v) => updateField("cta_url", v)} />
        <Field label="Icon (Font Awesome class)" value={(c.icon as string) || ""} onChange={(v) => updateField("icon", v)} />

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- TEAM ---
  if (section.type === "team") {
    return <TeamEditor section={section} updateSection={updateSection} />
  }

  // --- GENERIC ---
  if (section.type === "generic") {
    const bullets = Array.isArray(c.bullets) ? c.bullets : []
    return (
      <div className="border rounded-lg p-6 bg-white space-y-4">
        <h3 className="font-semibold">Generic</h3>

        <Field label="Headline" value={(c.headline as string) || ""} onChange={(v) => updateField("headline", v)} />
        <TextAreaField label="Body" value={(c.body as string) || ""} onChange={(v) => updateField("body", v)} />

        <div>
          <label className={LABEL_CLASS}>Bullets</label>
          {bullets.map((b: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={b}
                onChange={(e) => {
                  const n = [...bullets]
                  n[i] = e.target.value
                  updateField("bullets", n)
                }}
                className="flex-1 border rounded p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => updateField("bullets", bullets.filter((_: string, j: number) => j !== i))}
                className="px-2 text-red-600 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => updateField("bullets", [...bullets, ""])}
            className="text-sm text-blue-600"
          >
            Add Bullet
          </button>
        </div>

        <ImageUploadField label="Image" section={section} updateSection={updateSection} />
        <Field label="Video URL" value={(c.video_url as string) || ""} onChange={(v) => updateField("video_url", v)} />

        <SelectField
          label="Layout"
          value={(c.layout as string) || "image_left"}
          onChange={(v) => updateField("layout", v)}
          options={[
            { value: "image_left", label: "Image Left" },
            { value: "image_right", label: "Image Right" },
            { value: "video_left", label: "Video Left" },
            { value: "video_right", label: "Video Right" },
          ]}
        />

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- OFFERS ---
  if (section.type === "offers") {
    const sources = c.sources || {
      masterclasses: true,
      tools: true,
      services: true,
    }

    const labels = c.labels || {
      masterclasses: "Masterclasses",
      tools: "Tools & Resources",
      services: "Coaching",
    }

    const limits = c.limits || {
      masterclasses: 3,
      tools: 3,
      services: 3,
    }

    return (
      <div className="border rounded-lg p-6 bg-white space-y-6">
        <h3 className="font-semibold">Offers</h3>

        <Field
          label="Heading"
          value={(c.heading as string) || ""}
          onChange={(v) => updateField("heading", v)}
        />

        <TextAreaField
          label="Subheading"
          value={(c.subheading as string) || ""}
          onChange={(v) => updateField("subheading", v)}
        />

        {/* MASTERCLASSES */}
        <div className="border rounded-md p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Masterclasses</h4>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sources.masterclasses}
              onChange={(e) =>
                updateField("sources", {
                  ...sources,
                  masterclasses: e.target.checked,
                })
              }
            />
            Enable Masterclasses
          </label>

          <Field
            label="Label"
            value={labels.masterclasses}
            onChange={(v) =>
              updateField("labels", { ...labels, masterclasses: v })
            }
          />

          <Field
            label="Max Items"
            type="number"
            value={String(limits.masterclasses)}
            onChange={(v) =>
              updateField("limits", { ...limits, masterclasses: Number(v) })
            }
          />

          <button
            type="button"
            onClick={() => {
              const categories = [...(c.categories || [])]
              while (categories.length <= 0) categories.push({ title: labels.masterclasses, layout: "grid", items: [] } as OfferCategory)
              if (!categories[0]) categories[0] = { title: labels.masterclasses, layout: "grid", items: [] }
              const items = [...(categories[0].items || [])]
              const newIndex = items.length
              items.push({
                title: "",
                description: "",
                bullets: [],
                cta: { mode: "community", label: "Learn More" },
              })
              categories[0] = { ...categories[0], items }
              updateField("categories", categories)
              setExpandedCards((prev) => ({ ...prev, [`0-${newIndex}`]: true }))
            }}
            className="text-sm bg-gray-100 px-4 py-2 rounded"
          >
            Add Offer Card
          </button>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event
              if (!over || active.id === over.id) return
              const items = c.categories?.[0]?.items || []
              const oldIndex = items.findIndex((_, i) => i.toString() === active.id)
              const newIndex = items.findIndex((_, i) => i.toString() === over.id)
              if (oldIndex === -1 || newIndex === -1) return
              updateField("categories", reorderOfferItems(c, 0, oldIndex, newIndex))
            }}
          >
            <SortableContext
              items={(c.categories?.[0]?.items || []).map((_, i) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              {(c.categories?.[0]?.items || []).map((item, itemIndex) => (
                <SortableOfferCard
                  id={itemIndex.toString()}
                  key={itemIndex}
                  item={item}
                  expanded={!!expandedCards[`0-${itemIndex}`]}
                  onToggle={() => toggleCard(`0-${itemIndex}`)}
                >
                  <OfferCardEditor
                    item={item}
                    catIndex={0}
                    itemIndex={itemIndex}
                    c={c}
                    updateField={updateField}
                  />
                </SortableOfferCard>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* TOOLS */}
        <div className="border rounded-md p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">
            Tools & Resources
          </h4>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sources.tools}
              onChange={(e) =>
                updateField("sources", {
                  ...sources,
                  tools: e.target.checked,
                })
              }
            />
            Enable Tools
          </label>

          <Field
            label="Label"
            value={labels.tools}
            onChange={(v) => updateField("labels", { ...labels, tools: v })}
          />

          <Field
            label="Max Items"
            type="number"
            value={String(limits.tools)}
            onChange={(v) =>
              updateField("limits", { ...limits, tools: Number(v) })
            }
          />

          <button
            type="button"
            onClick={() => {
              const categories = [...(c.categories || [])]
              while (categories.length <= 1) categories.push({ title: labels.tools, layout: "grid", items: [] } as OfferCategory)
              if (!categories[1]) categories[1] = { title: labels.tools, layout: "grid", items: [] }
              const items = [...(categories[1].items || [])]
              const newIndex = items.length
              items.push({
                title: "",
                description: "",
                bullets: [],
                cta: { mode: "community", label: "Learn More" },
              })
              categories[1] = { ...categories[1], items }
              updateField("categories", categories)
              setExpandedCards((prev) => ({ ...prev, [`1-${newIndex}`]: true }))
            }}
            className="text-sm bg-gray-100 px-4 py-2 rounded"
          >
            Add Offer Card
          </button>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event
              if (!over || active.id === over.id) return
              const items = c.categories?.[1]?.items || []
              const oldIndex = items.findIndex((_, i) => i.toString() === active.id)
              const newIndex = items.findIndex((_, i) => i.toString() === over.id)
              if (oldIndex === -1 || newIndex === -1) return
              updateField("categories", reorderOfferItems(c, 1, oldIndex, newIndex))
            }}
          >
            <SortableContext
              items={(c.categories?.[1]?.items || []).map((_, i) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              {(c.categories?.[1]?.items || []).map((item, itemIndex) => (
                <SortableOfferCard
                  id={itemIndex.toString()}
                  key={itemIndex}
                  item={item}
                  expanded={!!expandedCards[`1-${itemIndex}`]}
                  onToggle={() => toggleCard(`1-${itemIndex}`)}
                >
                  <OfferCardEditor
                    item={item}
                    catIndex={1}
                    itemIndex={itemIndex}
                    c={c}
                    updateField={updateField}
                  />
                </SortableOfferCard>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* SERVICES */}
        <div className="border rounded-md p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">
            Services / Coaching
          </h4>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sources.services}
              onChange={(e) =>
                updateField("sources", {
                  ...sources,
                  services: e.target.checked,
                })
              }
            />
            Enable Services
          </label>

          <Field
            label="Label"
            value={labels.services}
            onChange={(v) =>
              updateField("labels", { ...labels, services: v })
            }
          />

          <Field
            label="Max Items"
            type="number"
            value={String(limits.services)}
            onChange={(v) =>
              updateField("limits", { ...limits, services: Number(v) })
            }
          />

          <button
            type="button"
            onClick={() => {
              const categories = [...(c.categories || [])]
              while (categories.length <= 2) categories.push({ title: labels.services, layout: "grid", items: [] } as OfferCategory)
              if (!categories[2]) categories[2] = { title: labels.services, layout: "grid", items: [] }
              const items = [...(categories[2].items || [])]
              const newIndex = items.length
              items.push({
                title: "",
                description: "",
                bullets: [],
                cta: { mode: "community", label: "Learn More" },
              })
              categories[2] = { ...categories[2], items }
              updateField("categories", categories)
              setExpandedCards((prev) => ({ ...prev, [`2-${newIndex}`]: true }))
            }}
            className="text-sm bg-gray-100 px-4 py-2 rounded"
          >
            Add Offer Card
          </button>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              const { active, over } = event
              if (!over || active.id === over.id) return
              const items = c.categories?.[2]?.items || []
              const oldIndex = items.findIndex((_, i) => i.toString() === active.id)
              const newIndex = items.findIndex((_, i) => i.toString() === over.id)
              if (oldIndex === -1 || newIndex === -1) return
              updateField("categories", reorderOfferItems(c, 2, oldIndex, newIndex))
            }}
          >
            <SortableContext
              items={(c.categories?.[2]?.items || []).map((_, i) => i.toString())}
              strategy={verticalListSortingStrategy}
            >
              {(c.categories?.[2]?.items || []).map((item, itemIndex) => (
                <SortableOfferCard
                  id={itemIndex.toString()}
                  key={itemIndex}
                  item={item}
                  expanded={!!expandedCards[`2-${itemIndex}`]}
                  onToggle={() => toggleCard(`2-${itemIndex}`)}
                >
                  <OfferCardEditor
                    item={item}
                    catIndex={2}
                    itemIndex={itemIndex}
                    c={c}
                    updateField={updateField}
                  />
                </SortableOfferCard>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <BackgroundFields section={section} updateRoot={updateRoot} />
      </div>
    )
  }

  // --- FALLBACK ---
  return (
    <div className="border rounded-lg p-6 bg-white space-y-4">
      <h3 className="font-semibold capitalize mb-4">{section.type}</h3>
      <p className="text-sm text-slate-500">No editor for this section type yet.</p>
      <BackgroundFields section={section} updateRoot={updateRoot} />
    </div>
  )
}

