"use client"

import { useState, useEffect } from "react"
import {
  createSiteUpdate,
  getSiteUpdates,
  updateSiteUpdate,
  deleteSiteUpdate,
  getMemberStats,
  getRecentMembers,
  getMembersByPlan, // Added getMembersByPlan import
} from "./actions"

export default function AdminDashboardPage() {
  const [showUpdatesModal, setShowUpdatesModal] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updates, setUpdates] = useState<Array<{ id: string; title: string | null; body: string; created_at: string }>>(
    [],
  )
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")

  const [memberStats, setMemberStats] = useState<{ total: number; active: number; suspended: number } | null>(null)
  const [statsError, setStatsError] = useState(false)

  const [recentMembers, setRecentMembers] = useState<
    Array<{
      id: string
      full_name: string
      email: string
      avatar_url: string | null
      created_at: string
      plan_name: string
    }>
  >([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  const [planMembers, setPlanMembers] = useState<
    Array<{
      planId: string
      planName: string
      memberCount: number
    }>
  >([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getMemberStats()
        setMemberStats(stats)
      } catch (error) {
        console.error("Failed to load member stats:", error)
        setStatsError(true)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    async function loadRecentMembers() {
      setIsLoadingMembers(true)
      try {
        const members = await getRecentMembers()
        setRecentMembers(members)
      } catch (error) {
        console.error("Failed to load recent members:", error)
      } finally {
        setIsLoadingMembers(false)
      }
    }
    loadRecentMembers()
  }, [])

  useEffect(() => {
    async function loadPlanMembers() {
      setIsLoadingPlans(true)
      try {
        const plans = await getMembersByPlan()
        setPlanMembers(plans)
      } catch (error) {
        console.error("Failed to load plan members:", error)
      } finally {
        setIsLoadingPlans(false)
      }
    }
    loadPlanMembers()
  }, [])

  const handleSubmit = async () => {
    if (!body.trim()) return

    setIsSubmitting(true)
    try {
      await createSiteUpdate({
        title: title.trim() || undefined,
        body: body.trim(),
      })
      setTitle("")
      setBody("")
      alert("Site update published successfully!")
    } catch (error) {
      alert("Failed to publish update: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenModal = async () => {
    setShowUpdatesModal(true)
    setIsLoadingUpdates(true)
    try {
      const data = await getSiteUpdates()
      setUpdates(data)
    } catch (error) {
      alert("Failed to load updates: " + (error as Error).message)
    } finally {
      setIsLoadingUpdates(false)
    }
  }

  const handleEditClick = (update: { id: string; title: string | null; body: string }) => {
    setEditingId(update.id)
    setEditTitle(update.title || "")
    setEditBody(update.body)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editBody.trim()) return

    try {
      await updateSiteUpdate({
        id,
        title: editTitle.trim() || undefined,
        body: editBody.trim(),
      })
      const data = await getSiteUpdates()
      setUpdates(data)
      setEditingId(null)
      setEditTitle("")
      setEditBody("")
    } catch (error) {
      alert("Failed to update: " + (error as Error).message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return

    try {
      await deleteSiteUpdate(id)
      const data = await getSiteUpdates()
      setUpdates(data)
    } catch (error) {
      alert("Failed to delete: " + (error as Error).message)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return "Unknown"
    }
  }

  const getPlanIconColors = (planName: string) => {
    const plan = planName.toLowerCase()
    if (plan.includes("free")) return { bg: "bg-gray-100", icon: "text-gray-600", bar: "bg-gray-600" }
    if (plan.includes("pro")) return { bg: "bg-blue-100", icon: "text-blue-600", bar: "bg-blue-600" }
    if (plan.includes("enterprise")) return { bg: "bg-emerald-100", icon: "text-emerald-600", bar: "bg-emerald-600" }
    return { bg: "bg-purple-100", icon: "text-purple-600", bar: "bg-purple-600" }
  }

  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page title - screen reader only */}
      <h1 className="sr-only">Admin Dashboard</h1>

      {/* SECTION 1: Stats Overview */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Members */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 640 512">
                    <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {memberStats ? memberStats.total.toLocaleString() : statsError ? "—" : "..."}
              </p>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 640 512">
                    <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {memberStats ? memberStats.active.toLocaleString() : statsError ? "—" : "..."}
              </p>
            </div>
          </div>

          {/* Suspended Members */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 640 512">
                    <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L353.3 251.6C407.9 237 448 187.2 448 128C448 57.3 390.7 0 320 0C250.2 0 193.5 55.8 192 125.2L38.8 5.1zM264.3 304.3C170.5 309.4 96 387.2 96 482.3c0 16.4 13.3 29.7 29.7 29.7H514.3c3.9 0 7.6-.7 11-2.1l-261-205.6z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Suspended Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {memberStats ? memberStats.suspended.toLocaleString() : statsError ? "—" : "..."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Site Updates */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Post a Site Update</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="update-title" className="block text-sm font-medium text-gray-700 mb-2">
                Update Title
              </label>
              <input
                type="text"
                id="update-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter update title..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="update-body" className="block text-sm font-medium text-gray-700 mb-2">
                Update Body
              </label>
              <textarea
                id="update-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your site update message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleOpenModal}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                View Previous Updates
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !body.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Publishing..." : "Publish Update"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Members by Plan */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Member Count by Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingPlans ? (
            <div className="col-span-full text-center py-12 text-gray-500">Loading plans...</div>
          ) : planMembers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No active plans found</div>
          ) : (
            planMembers.map((plan) => {
              const colors = getPlanIconColors(plan.planName)
              const totalMembers = memberStats?.total ?? 1
              const percentage = calculatePercentage(plan.memberCount, totalMembers)

              return (
                <div key={plan.planId} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${colors.icon}`} fill="currentColor" viewBox="0 0 512 512">
                        <circle cx="256" cy="256" r="64" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{plan.planName}</h3>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{plan.memberCount.toLocaleString()}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${colors.bar} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* SECTION 4: Recent Members */}
      <section className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recently Joined Members</h2>
            <p className="text-sm text-gray-600 mt-1">Last 10 members who joined the platform</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingMembers ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading members...
                    </td>
                  </tr>
                ) : recentMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  recentMembers.map((member) => {
                    const planColors = getPlanIconColors(member.plan_name)
                    return (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url || "/placeholder.svg"}
                                alt={member.full_name}
                                className="w-10 h-10 rounded-full mr-3 object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                                {getInitials(member.full_name)}
                              </div>
                            )}
                            <div className="font-medium text-gray-900">{member.full_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${planColors.bg} ${planColors.text}`}
                          >
                            {member.plan_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                          {formatDate(member.created_at)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-gray-500">© 2026 Your Company Name. All rights reserved.</p>
      </footer>

      {/* Site Updates Archive Modal */}
      {showUpdatesModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpdatesModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Site Updates Archive</h3>
              <button
                onClick={() => setShowUpdatesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {isLoadingUpdates ? (
                <div className="text-center py-8 text-gray-500">Loading updates...</div>
              ) : updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No updates yet.</div>
              ) : (
                <div className="space-y-4">
                  {updates.map((update) => (
                    <div key={update.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {editingId === update.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Update title..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(update.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setEditTitle("")
                                setEditBody("")
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 flex-1">{update.title || "Untitled Update"}</h4>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditClick(update)}
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit update"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
                                  <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32s-14.3-32-32-32H96z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(update.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete update"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                                  <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{update.body}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(update.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowUpdatesModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
