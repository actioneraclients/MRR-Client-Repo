import { joinPrivateGroup } from "./actions"

export default function GroupJoinPage({
  searchParams,
}: {
  searchParams?: { id?: string; error?: string }
}) {
  const groupId = searchParams?.id

  if (!groupId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="max-w-md bg-white rounded-lg shadow-md p-8 text-center text-red-600">
          ❌ Missing group ID in invite link.
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Join Private Group</h1>

        <p className="text-gray-600">You've been invited to join this private group.</p>

        {searchParams?.error && <p className="text-sm text-red-600">Unable to join group. Please try again.</p>}

        <form action={joinPrivateGroup.bind(null, groupId)}>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
          >
            Join Group
          </button>
        </form>
      </div>
    </div>
  )
}
