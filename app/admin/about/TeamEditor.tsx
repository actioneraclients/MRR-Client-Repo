"use client"

import { useState, useRef } from "react"
import type { TeamMember } from "./types"
import { uploadAboutImage } from "./actions"
import { BackgroundFields } from "./BackgroundFields"
import AboutModal from "@/app/about/AboutModal"

const INPUT_CLASS = "w-full border rounded p-2 text-sm"
const LABEL_CLASS = "block text-xs font-medium text-slate-600 mb-1"

export default function TeamEditor({
  section,
  updateSection,
}: {
  section: any
  updateSection: (updated: any) => void
}) {
  const c = section?.content || {}
  const members: TeamMember[] = Array.isArray(c.members)
    ? c.members.map((m: any) => ({
        id: m.id || crypto.randomUUID(),
        name: m.name || "",
        role: m.role || "",
        image_url: m.image_url || "",
        bio: m.bio || "",
      }))
    : []

  function updateHeading(v: string) {
    updateSection({
      ...section,
      content: { ...c, heading: v },
    })
  }

  function updateMember(index: number, updates: Partial<TeamMember>) {
    const next = [...members]
    next[index] = { ...next[index], ...updates }
    updateSection({
      ...section,
      content: { ...c, members: next },
    })
  }

  function addMember() {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: "",
      role: "",
      image_url: "",
      bio: "",
    }
    updateSection({
      ...section,
      content: { ...c, members: [...members, newMember] },
    })
  }

  function removeMember(index: number) {
    const next = members.filter((_, i) => i !== index)
    updateSection({
      ...section,
      content: { ...c, members: next },
    })
  }

  return (
    <div className="border rounded-lg p-6 bg-white space-y-6">
      <h3 className="font-semibold">Team</h3>

      <div>
        <label className={LABEL_CLASS}>Heading</label>
        <input
          type="text"
          value={(c.heading as string) || ""}
          onChange={(e) => updateHeading(e.target.value)}
          placeholder="Meet the Team"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLASS}>Team Members</label>
          <button
            type="button"
            onClick={addMember}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Add Team Member
          </button>
        </div>

        {members.map((member, i) => (
          <MemberCard
            key={member.id}
            member={member}
            onChange={(updates) => updateMember(i, updates)}
            onRemove={() => removeMember(i)}
          />
        ))}
      </div>

      <BackgroundFields
        section={section}
        updateRoot={(field, value) => updateSection({ ...section, [field]: value })}
      />
    </div>
  )
}

function MemberCard({
  member,
  onChange,
  onRemove,
}: {
  member: TeamMember
  onChange: (updates: Partial<TeamMember>) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size === 0) return
    const formData = new FormData()
    formData.append("file", file)
    setUploading(true)
    try {
      const res = await uploadAboutImage(formData)
      onChange({ image_url: res.url })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-slate-50">
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-slate-600">Member</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="space-y-2">
          <label className={LABEL_CLASS}>Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-hidden
          />
          {member.image_url ? (
            <div className="space-y-2">
              <img
                src={member.image_url}
                alt={member.name}
                className="rounded-md border max-h-24 max-w-24 object-cover"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "…" : "Replace"}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ image_url: "" })}
                  className="block px-2 py-1 text-xs font-medium border border-slate-300 rounded hover:bg-slate-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
                value={member.image_url || ""}
                onChange={(e) => onChange({ image_url: e.target.value })}
                placeholder="Paste URL"
                className={`${INPUT_CLASS} mt-1`}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input
              type="text"
              value={member.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Role</label>
            <input
              type="text"
              value={member.role}
              onChange={(e) => onChange({ role: e.target.value })}
              placeholder="Role"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Bio</label>
            <textarea
              value={member.bio || ""}
              onChange={(e) => onChange({ bio: e.target.value })}
              placeholder="Bio"
              className={INPUT_CLASS}
              rows={3}
            />
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-2 px-2 py-1 text-xs font-medium border border-slate-300 rounded hover:bg-slate-100"
            >
              Preview Bio Modal
            </button>
          </div>
        </div>
      </div>

      <AboutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={member.name}
        description={member.bio}
        imageUrl={member.image_url}
      />
    </div>
  )
}
