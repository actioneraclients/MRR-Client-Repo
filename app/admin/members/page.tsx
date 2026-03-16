"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"
import { updateMemberPlan, updateMemberStatus, updateMemberAdminAccess } from "./actions"
import { sendAdminMessage } from "@/app/admin/actions/send-message"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Member = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone_number: string | null
  plan_id: string | null
  plan_name: string | null
  is_active: boolean
  is_creator: boolean
  created_at: string
}

interface Plan {
  id: string
  name: string
}

export default function AdminMembersPage() {
  const [membersData, setMembersData] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [newPlanId, setNewPlanId] = useState<string>("")
  const [loading, setLoading] = useState(true) // Added loading state
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [messageModalMember, setMessageModalMember] = useState<Member | null>(null)
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [messageSending, setMessageSending] = useState(false)

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"suspend" | "unsuspend" | "delete" | null>(null)
  const [confirmMember, setConfirmMember] = useState<Member | null>(null)

  const [adminConfirmOpen, setAdminConfirmOpen] = useState(false)
  const [adminConfirmMember, setAdminConfirmMember] = useState<Member | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Fetch plans first - no filtering on is_active
      const { data: plansData, error: plansError } = await supabase.from("plans").select("id, name")

      if (plansError) {
        console.error("[Admin Members] Failed to fetch plans:", plansError.message)
      }

      // Create a map of plan_id -> plan_name for efficient lookup
      const plansMap = new Map<string, string>()
      if (plansData) {
        plansData.forEach((plan) => {
          plansMap.set(plan.id, plan.name)
        })
        // Store plans for dropdowns
        setAvailablePlans(plansData)
      }

      // Fetch members from profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, full_name, phone_number, plan_id, is_active, is_creator, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[Admin Members] Failed to fetch members:", error.message)
        setLoading(false)
        setMembersData([])
        setFilteredMembers([])
        return
      }

      if (data) {
        const members: Member[] = data.map((profile) => ({
          id: profile.id,
          email: profile.email || "",
          first_name: profile.first_name ?? null,
          last_name: profile.last_name ?? null,
          full_name: profile.full_name,
          phone_number: profile.phone_number ?? null,
          plan_id: profile.plan_id,
          plan_name: profile.plan_id
            ? plansMap.get(profile.plan_id) || (plansError ? "Unknown Plan" : "No Plan")
            : "No Plan",
          is_active: profile.is_active ?? true,
          is_creator: profile.is_creator ?? false,
          created_at: profile.created_at,
        }))

        setMembersData(members)
        setFilteredMembers(members)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // Filter members whenever search or filter values change
  useEffect(() => {
    const filtered = membersData.filter((member) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        (member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())

      // Plan filter
      const matchesPlan = planFilter === "all" || (member.plan_id !== null && member.plan_id === planFilter)

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && member.is_active) ||
        (statusFilter === "suspended" && !member.is_active)

      return matchesSearch && matchesPlan && matchesStatus
    })

    setFilteredMembers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, planFilter, statusFilter, membersData])

  const planCounts = filteredMembers.reduce(
    (acc, member) => {
      const planName = member.plan_name || "Unknown"
      acc[planName] = (acc[planName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMembers = filteredMembers.slice(startIndex, endIndex)

  const handleChangePlan = async (member: Member) => {
    if (!newPlanId) return

    const result = await updateMemberPlan(member.id, newPlanId)

    if (result.success) {
      // Update local state
      const updatedMembers = membersData.map((m) => {
        if (m.id === member.id) {
          const newPlan = availablePlans.find((p) => p.id === newPlanId)
          return {
            ...m,
            plan_id: newPlanId,
            plan_name: newPlan?.name || null,
          }
        }
        return m
      })
      setMembersData(updatedMembers)
      setSelectedMember(null)
      setNewPlanId("")
    } else {
      alert(`Failed to update plan: ${result.error}`)
    }
  }

  const handleToggleStatus = async (member: Member) => {
    const newIsActive = !member.is_active

    const result = await updateMemberStatus(member.id, newIsActive)

    if (result.success) {
      // Update local state on success
      const updatedMembers = membersData.map((m) => (m.id === member.id ? { ...m, is_active: newIsActive } : m))
      setMembersData(updatedMembers)
    } else {
      console.error("[Admin Members] Failed to toggle status:", result.error)
      // Leave state unchanged on error
      alert(`Failed to ${newIsActive ? "unsuspend" : "suspend"} member: ${result.error}`)
    }
  }

  const totalMembers = membersData.length
  const activeMembers = membersData.filter((m) => m.is_active).length
  const suspendedMembers = membersData.filter((m) => !m.is_active).length

  // Handlers for modals
  const handleSendMessage = (member: Member) => {
    setMessageModalMember(member)
    setMessageSubject("")
    setMessageBody("")
    setMessageModalOpen(true)
  }

  const handleSendMessageSubmit = async () => {
    if (!messageModalMember || !messageBody.trim()) return

    setMessageSending(true)

    const result = await sendAdminMessage({
      recipientId: messageModalMember.id,
      subject: messageSubject.trim() || undefined,
      body: messageBody.trim(),
    })

    setMessageSending(false)

    if (result.success) {
      setMessageModalOpen(false)
      setMessageModalMember(null)
      setMessageSubject("")
      setMessageBody("")
      alert("Message sent successfully!")
    } else {
      alert(`Failed to send message: ${result.error}`)
    }
  }

  const handleOpenChangePlan = (member: Member) => {
    setSelectedMember(member)
    setNewPlanId(member.plan_id || "")
  }

  const handleSuspendUnsuspend = (member: Member) => {
    setConfirmMember(member)
    setConfirmAction(member.is_active ? "suspend" : "unsuspend")
    setConfirmModalOpen(true)
  }

  const handleConfirmSuspendUnsuspend = () => {
    if (!confirmMember) return
    handleToggleStatus(confirmMember)
    setConfirmModalOpen(false)
    setConfirmMember(null)
    setConfirmAction(null)
  }

  const handleDeleteMember = (member: Member) => {
    setConfirmMember(member)
    setConfirmAction("delete")
    setConfirmModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!confirmMember) return
    console.log("Deleting member:", confirmMember.id)
    const updatedMembers = membersData.filter((m) => m.id !== confirmMember.id)
    setMembersData(updatedMembers)
    setConfirmModalOpen(false)
    setConfirmMember(null)
    setConfirmAction(null)
  }

  const handleToggleAdminAccess = (member: Member) => {
    setAdminConfirmMember(member)
    setAdminConfirmOpen(true)
  }

  const handleDownloadCSV = () => {
    if (!filteredMembers || filteredMembers.length === 0) return

    const headers = [
      "first_name",
      "last_name",
      "full_name",
      "email",
      "phone_number",
      "plan_name"
    ]

    const rows = filteredMembers.map((member) => [
      member.first_name ?? "",
      member.last_name ?? "",
      member.full_name ?? "",
      member.email ?? "",
      member.phone_number ?? "",
      member.plan_name ?? ""
    ])

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url

    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `members-export-${today}.csv`)

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
  }

  const handleConfirmAdminAccess = async () => {
    if (!adminConfirmMember) return

    const makeAdmin = !adminConfirmMember.is_creator
    const result = await updateMemberAdminAccess(adminConfirmMember.id, makeAdmin)

    if (result.success) {
      setMembersData((prev) =>
        prev.map((m) => (m.id === adminConfirmMember.id ? { ...m, is_creator: makeAdmin } : m)),
      )
      setAdminConfirmOpen(false)
      setAdminConfirmMember(null)
    } else {
      alert(`Failed to update admin access: ${result.error}`)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Member Management</h1>
          <p className="text-gray-600">Manage user accounts, subscriptions and access permissions.</p>
        </div>

        {/* Stats: Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Members</h3>
              <div className="text-3xl font-bold text-gray-900">{totalMembers}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 00-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Active Members</h3>
              <div className="text-3xl font-bold text-gray-900">{activeMembers}</div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Suspended</h3>
              <div className="text-3xl font-bold text-gray-900">{suspendedMembers}</div>
            </div>
          </div>
        </section>

        {/* Plan Breakdown */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(planCounts).length > 0 ? (
                Object.entries(planCounts)
                  .sort(([, a], [, b]) => b - a) // Sort by count descending
                  .map(([planName, count]) => (
                    <div
                      key={planName}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        // Find the plan ID by name to filter correctly
                        const plan = availablePlans.find((p) => p.name === planName)
                        if (plan) {
                          setPlanFilter(plan.id)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="font-medium text-gray-900">{planName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{count}</span>
                        <span className="text-sm text-gray-500">{count === 1 ? "member" : "members"}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-4 text-gray-500">No members assigned to plans yet</div>
              )}
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Plans</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setPlanFilter("all")
                    setStatusFilter("all")
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Download CSV ({filteredMembers.length})
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Members List */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-500">Loading members...</p>
              </div>
            ) : currentMembers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No members found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {(member.full_name || member.email).charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.full_name || "No name"}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {member.plan_name || "No Plan"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                member.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {member.is_active ? "Active" : "Suspended"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(member.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                  </svg>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSendMessage(member)}>
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenChangePlan(member)}>
                                  Change Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAdminAccess(member)}>
                                  {member.is_creator ? "Remove Admin Access" : "Give Admin Access"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSuspendUnsuspend(member)}>
                                  {member.is_active ? "Suspend Member" : "Unsuspend Member"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMember(member)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  Delete Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Pagination */}
        <section className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span>
              Showing {startIndex + 1}–{Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === index + 1
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {/* Send Message Modal */}
      {messageModalOpen && messageModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Message to {messageModalMember.full_name || messageModalMember.email}
              </h3>
              <button onClick={() => setMessageModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Message subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={5}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your message here..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setMessageModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessageSubmit}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                disabled={messageSending}
              >
                {messageSending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspend/Unsuspend/Delete */}
      {confirmModalOpen && confirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === "delete"
                  ? "Delete Member"
                  : confirmAction === "suspend"
                    ? "Suspend Member"
                    : "Unsuspend Member"}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                {confirmAction === "delete" && (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong>{confirmMember.full_name || confirmMember.email}</strong>? This action cannot be undone and
                    will remove all member data.
                  </>
                )}
                {confirmAction === "suspend" && (
                  <>
                    Are you sure you want to suspend <strong>{confirmMember.full_name || confirmMember.email}</strong>?
                    They will lose access to their account.
                  </>
                )}
                {confirmAction === "unsuspend" && (
                  <>
                    Are you sure you want to unsuspend <strong>{confirmMember.full_name || confirmMember.email}</strong>
                    ? They will regain access to their account.
                  </>
                )}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmModalOpen(false)
                  setConfirmMember(null)
                  setConfirmAction(null)
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction === "delete" ? handleConfirmDelete : handleConfirmSuspendUnsuspend}
                className={`px-4 py-2 text-white rounded-lg ${
                  confirmAction === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmAction === "delete" ? "Delete" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Access Confirmation Modal */}
      {adminConfirmOpen && adminConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {adminConfirmMember.is_creator ? "Remove Admin Access" : "Grant Admin Access"}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                {adminConfirmMember.is_creator
                  ? "This will remove admin access from this user."
                  : "This will give this user full admin access to the platform."}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setAdminConfirmOpen(false)
                  setAdminConfirmMember(null)
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdminAccess}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Change Plan — <span>{selectedMember.full_name || "N/A"}</span>
              </h3>
              <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
                <select
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a plan...</option>
                  {availablePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Changing plan updates access and billing on next cycle.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button onClick={() => setSelectedMember(null)} className="px-4 py-2 text-gray-700 hover:text-gray-900">
                Cancel
              </button>
              <button
                onClick={() => handleChangePlan(selectedMember)}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
