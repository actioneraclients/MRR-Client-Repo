"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateMasterclassStatus } from "@/app/admin/masterclasses/actions"
import type { MasterclassRow } from "./MasterclassTable"

const STATUS_OPTIONS = ["Pending", "Approved", "Live", "Completed", "Retired"] as const

type Props = {
  masterclass: MasterclassRow
  onClose: () => void
}

export default function ChangeStatusModal({ masterclass, onClose }: Props) {
  const router = useRouter()
  const normalizeStatus = (s: string) => {
    const lower = s.toLowerCase()
    return STATUS_OPTIONS.find((o) => o.toLowerCase() === lower) ?? "Pending"
  }
  const [selectedStatus, setSelectedStatus] = useState(() =>
    normalizeStatus(masterclass.status)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async () => {
    setIsSubmitting(true)
    setError(null)
    const statusValue = selectedStatus.toLowerCase()
    const result = await updateMasterclassStatus(masterclass.id, statusValue)
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error ?? "Failed to update status")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Change Status — <span>{masterclass.title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating…" : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  )
}
