"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { JoinRequestRow } from "../actions/get-admin-join-requests"
import { approveJoinRequest, denyJoinRequest } from "../actions/group-join-moderation"
import { DirectoryProfileModal } from "../../directory/directory-profile-modal"

function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "?"
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString()
}

interface AdminJoinRequestsListProps {
  requests: JoinRequestRow[]
}

export function AdminJoinRequestsList({ requests: initialRequests }: AdminJoinRequestsListProps) {
  const [requests, setRequests] = useState<JoinRequestRow[]>(initialRequests)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewProfileUserId, setViewProfileUserId] = useState<string | null>(null)

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await approveJoinRequest(requestId)
    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    } else {
      console.error("Failed to approve join request:", result.error)
      alert(result.error || "Failed to approve join request")
    }
    setActionLoading(null)
  }

  const handleDeny = async (requestId: string) => {
    setActionLoading(requestId)
    const result = await denyJoinRequest(requestId)
    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
    } else {
      console.error("Failed to deny join request:", result.error)
      alert(result.error || "Failed to deny join request")
    }
    setActionLoading(null)
  }

  if (requests.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-gray-500">No pending join requests.</div>
      </div>
    )
  }

  const groupedRequests = requests.reduce(
    (acc, req) => {
      if (!acc[req.group_id]) {
        acc[req.group_id] = {
          group_name: req.group_name,
          requests: [],
        }
      }
      acc[req.group_id].requests.push(req)
      return acc
    },
    {} as Record<string, { group_name: string; requests: JoinRequestRow[] }>,
  )

  return (
    <div className="space-y-8">
      {Object.entries(groupedRequests).map(([groupId, { group_name, requests: groupRequests }]) => (
        <div key={groupId} className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{group_name}</h3>
          <div className="space-y-3">
            {groupRequests.map((request) => {
              const displayName = request.full_name || "Unknown User"
              const isLoading = actionLoading === request.id

              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {request.avatar_url && (
                        <AvatarImage src={request.avatar_url || "/placeholder.svg"} alt={displayName} />
                      )}
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">Requested {formatRelativeTime(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewProfileUserId(request.user_id)}
                      disabled={isLoading}
                    >
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeny(request.id)} disabled={isLoading}>
                      Deny
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(request.id)} disabled={isLoading}>
                      Approve
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {viewProfileUserId && (
        <DirectoryProfileModal
          userId={viewProfileUserId}
          open={true}
          onClose={() => setViewProfileUserId(null)}
          mode="moderation"
        />
      )}
    </div>
  )
}
