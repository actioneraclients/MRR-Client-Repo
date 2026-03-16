"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { getPlans, updateContentPlanAccess } from "@/app/admin/content/actions"

type Props = {
  content: {
    id: string
    title: string
    plan_ids: string[] | null
  }
  onClose: () => void
}

export function PlanAccessModal({ content, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [selectedPlans, setSelectedPlans] = useState<string[]>(content.plan_ids ?? [])

  useEffect(() => {
    getPlans().then((data) => {
      setPlans(data ?? [])
    })
  }, [])

  useEffect(() => {
    setSelectedPlans(content.plan_ids ?? [])
  }, [content.id, content.plan_ids])

  const togglePlan = (planId: string) => {
    setSelectedPlans((prev) =>
      prev.includes(planId) ? prev.filter((id) => id !== planId) : [...prev, planId],
    )
  }

  const handleSave = () => {
    startTransition(async () => {
      await updateContentPlanAccess(content.id, selectedPlans)
      router.refresh()
      onClose()
    })
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Plan Access</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600">
            Choose which plans can access this content. If no plans are selected the content will be visible to all
            members.
          </p>

          <p className="text-sm font-medium text-gray-900 mt-3">Content: {content.title}</p>

          <div className="space-y-2 mt-4 max-h-60 overflow-y-auto mb-6">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={selectedPlans.includes(plan.id)}
                  onChange={() => togglePlan(plan.id)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-900 font-medium">{plan.name}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Access"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
