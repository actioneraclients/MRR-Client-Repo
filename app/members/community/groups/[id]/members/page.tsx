import { Suspense } from "react"
import GroupMembersContent from "./group-members-content"

export default function GroupMembersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading members...</div>
        </div>
      }
    >
      <GroupMembersContent />
    </Suspense>
  )
}
