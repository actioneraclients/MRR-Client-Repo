"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, MoreVertical, ExternalLink, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getAdminGroups,
  pauseGroup,
  reassignGroupOwner,
  deleteGroup,
  getGroupMembers,
  getGroupCategories,
  type AdminGroup,
  type GroupCategory,
} from "./actions"

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [filteredGroups, setFilteredGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<GroupCategory[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all")

  // Modals
  const [detailsModalGroup, setDetailsModalGroup] = useState<AdminGroup | null>(null)
  const [reassignModalGroup, setReassignModalGroup] = useState<AdminGroup | null>(null)
  const [deleteModalGroup, setDeleteModalGroup] = useState<AdminGroup | null>(null)

  // Reassign modal state
  const [groupMembers, setGroupMembers] = useState<
    { id: string; full_name: string | null; avatar_url: string | null }[]
  >([])
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>("")
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
    fetchCategories()
  }, [])

  useEffect(() => {
    let filtered = [...groups]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((g) => g.name.toLowerCase().includes(query))
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((g) => g.status !== "paused")
    } else if (statusFilter === "paused") {
      filtered = filtered.filter((g) => g.status === "paused")
    }

    setFilteredGroups(filtered)
  }, [groups, searchQuery, statusFilter])

  const fetchGroups = async () => {
    setLoading(true)
    const { data, error } = await getAdminGroups()
    if (error) {
      console.error("[Admin Groups] Failed to fetch groups:", error)
    }
    setGroups(data || [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data, error } = await getGroupCategories()
    if (error) {
      console.error("[Admin Groups] Failed to fetch categories:", error)
    }
    setCategories(data || [])
  }

  const handlePauseToggle = async (group: AdminGroup) => {
    setActionLoading(group.group_id)
    const shouldPause = group.status !== "paused"
    const { success, error } = await pauseGroup(group.group_id, shouldPause)
    if (success) {
      await fetchGroups()
    } else {
      alert(`Failed to ${shouldPause ? "pause" : "unpause"} group: ${error}`)
    }
    setActionLoading(null)
  }

  const handleOpenReassignModal = async (group: AdminGroup) => {
    setReassignModalGroup(group)
    setSelectedNewOwner("")
    setLoadingMembers(true)
    const { data } = await getGroupMembers(group.group_id)
    setGroupMembers(data || [])
    setLoadingMembers(false)
  }

  const handleReassignOwner = async () => {
    if (!reassignModalGroup || !selectedNewOwner) return
    setActionLoading(reassignModalGroup.group_id)
    const { success, error } = await reassignGroupOwner(reassignModalGroup.group_id, selectedNewOwner)
    if (success) {
      await fetchGroups()
      setReassignModalGroup(null)
    } else {
      alert(`Failed to reassign group: ${error}`)
    }
    setActionLoading(null)
  }

  const handleDeleteGroup = async () => {
    if (!deleteModalGroup) return
    setActionLoading(deleteModalGroup.group_id)
    const { success, error } = await deleteGroup(deleteModalGroup.group_id)
    if (success) {
      await fetchGroups()
      setDeleteModalGroup(null)
    } else {
      alert(`Failed to delete group: ${error}`)
    }
    setActionLoading(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Business: "bg-amber-50 text-amber-700",
      Marketing: "bg-blue-50 text-blue-700",
      Technology: "bg-purple-50 text-purple-700",
      Design: "bg-emerald-50 text-emerald-700",
      General: "bg-gray-50 text-gray-700",
    }
    return colors[category] || "bg-gray-50 text-gray-700"
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <section id="page-header" className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Groups</h1>
            <p className="text-gray-600">Manage existing groups or create your own for your members.</p>
          </div>
        </section>

        {/* Filters and Search */}
        <section id="filters-section" className="mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused")}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Filter className="w-4 h-4 mr-2" />
                Showing {filteredGroups.length} of {groups.length} groups
              </div>
            </div>
          </div>
        </section>

        {/* Groups Table */}
        <section id="groups-table-section">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                      Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started When
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Loading groups...
                      </td>
                    </tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No groups found
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr key={group.group_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 max-w-[300px]">
                          <div className="flex items-center gap-3">
                            {group.avatar_url ? (
                              <img
                                src={group.avatar_url || "/placeholder.svg"}
                                alt={group.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{group.name}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {group.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {group.owner_avatar_url ? (
                              <img
                                src={group.owner_avatar_url || "/placeholder.svg"}
                                alt={group.owner_name || "Owner"}
                                className="w-6 h-6 rounded-full mr-2 object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                                <span className="text-white text-xs font-medium">
                                  {(group.owner_name || "?")[0]?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-gray-900">{group.owner_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(group.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {group.status === "paused" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                            {group.visibility}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                          {group.members_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                aria-label="Open actions"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsModalGroup(group)}>
                                View Group Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePauseToggle(group)}>
                                {group.status === "paused" ? "Unpause Group" : "Pause Group"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenReassignModal(group)}>
                                Re-Assign Group
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteModalGroup(group)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* View Group Details Modal */}
      {detailsModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Group Details</h3>
              <button onClick={() => setDetailsModalGroup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {detailsModalGroup.avatar_url ? (
                  <img
                    src={detailsModalGroup.avatar_url || "/placeholder.svg"}
                    alt={detailsModalGroup.name}
                    className="w-16 h-16 rounded-xl object-cover mx-auto"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                    <Users className="text-blue-600 w-6 h-6" />
                  </div>
                )}
                <h4 className="text-xl font-semibold text-gray-900 mt-4">{detailsModalGroup.name}</h4>
                <p className="text-gray-600 mt-1">{detailsModalGroup.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <span className="text-gray-500">Owner</span>
                  <div className="font-medium text-gray-900">{detailsModalGroup.owner_name || "Unknown"}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <div className="font-medium text-gray-900">{formatDate(detailsModalGroup.created_at)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Visibility</span>
                  <div className="font-medium text-gray-900 capitalize">
                    {detailsModalGroup.visibility}
                    {detailsModalGroup.visibility === "private" &&
                      "invite_code" in detailsModalGroup &&
                      detailsModalGroup.invite_code && (
                        <span className="text-gray-500 ml-1">({detailsModalGroup.invite_code})</span>
                      )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <div>
                    {detailsModalGroup.status === "paused" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Members</span>
                  <div className="font-medium text-gray-900">{detailsModalGroup.members_count} members</div>
                </div>
              </div>

              <a
                href={`/members/community/groups/${detailsModalGroup.group_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Group Page
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Re-Assign Group Modal */}
      {reassignModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Re-Assign Group Owner</h3>
              <button onClick={() => setReassignModalGroup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Current owner: <strong>{reassignModalGroup.owner_name || "Unknown"}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Owner</label>
                {loadingMembers ? (
                  <p className="text-gray-500 text-sm">Loading members...</p>
                ) : groupMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members found</p>
                ) : (
                  <select
                    value={selectedNewOwner}
                    onChange={(e) => setSelectedNewOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a member</option>
                    {groupMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || "Unnamed Member"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setReassignModalGroup(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignOwner}
                  disabled={!selectedNewOwner || actionLoading === reassignModalGroup.group_id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === reassignModalGroup.group_id ? "Reassigning..." : "Reassign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {deleteModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Delete Group</h3>
              <button onClick={() => setDeleteModalGroup(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deleteModalGroup.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModalGroup(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={actionLoading === deleteModalGroup.group_id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === deleteModalGroup.group_id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
