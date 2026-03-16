"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  updateMasterclassAccess,
  getActivePlans,
  getMasterclassAccessPlanIds,
} from "@/app/admin/masterclasses/actions"
import { Checkbox } from "@/components/ui/checkbox"
import type { MasterclassRow } from "./MasterclassTable"

type Props = {
  masterclass: MasterclassRow
  onClose: () => void
}

export default function MasterclassAccessModal({ masterclass, onClose }: Props) {
  const router = useRouter()
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasExistingAccess, setHasExistingAccess] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [plansRes, accessRes] = await Promise.all([
        getActivePlans(),
        getMasterclassAccessPlanIds(masterclass.id),
      ])
      if (!mounted) return
      if (plansRes.success) setPlans(plansRes.plans)
      if (accessRes.success) {
        const ids = accessRes.planIds
        setHasExistingAccess(ids.length > 0)
        setSelectedPlanIds(new Set(ids))
      }
      setIsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [masterclass.id])

  const togglePlan = (planId: string) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) next.delete(planId)
      else next.add(planId)
      return next
    })
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)
    const planIds = Array.from(selectedPlanIds)
    const result = await updateMasterclassAccess(masterclass.id, planIds)
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error ?? "Failed to update access")
    }
    setIsSubmitting(false)
  }

  const checkboxListClass = plans.length > 8
    ? "max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2"
    : "space-y-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Masterclass Access — <span>{masterclass.title}</span>
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
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-gray-500">No active plans found.</p>
          ) : null}
          {!isLoading && plans.length > 0 && !hasExistingAccess && selectedPlanIds.size === 0 && (
            <p className="text-sm text-gray-600 mb-3">All plans currently have access.</p>
          )}
          {!isLoading && plans.length > 0 && (
            <div className={checkboxListClass}>
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className="flex items-center gap-2 cursor-pointer py-2 px-1 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    checked={selectedPlanIds.has(plan.id)}
                    onCheckedChange={() => togglePlan(plan.id)}
                  />
                  <span className="text-sm">{plan.name}</span>
                </label>
              ))}
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
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
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving…" : "Save Access"}
          </button>
        </div>
      </div>
    </div>
  )
}
