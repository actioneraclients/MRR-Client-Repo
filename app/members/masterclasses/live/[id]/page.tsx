import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function LiveMasterclassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const search = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user?.id
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null }
  const displayName = profile?.full_name?.trim() || "Participant"

  const { data: masterclass } = await supabase
    .from("masterclasses")
    .select("*")
    .eq("id", id)
    .single()

  if (!masterclass) {
    return (
      <div className="p-8 text-center">
        Masterclass not found.
      </div>
    )
  }

  if (masterclass.status !== "live") {
    return (
      <div className="p-8 text-center">
        This masterclass is not live right now.
      </div>
    )
  }

  // meetingNumber: 1) masterclass.zoom_meeting_number, 2) URL ?mn=, 3) env
  const mnParam = search?.mn
  const pwdParam = search?.pwd
  const meetingNumber =
    (masterclass as { zoom_meeting_number?: string })?.zoom_meeting_number ||
    (typeof mnParam === "string" ? mnParam : mnParam?.[0]) ||
    process.env.ZOOM_MEETING_NUMBER ||
    ""
  const passcode =
    (masterclass as { zoom_passcode?: string })?.zoom_passcode ||
    (typeof pwdParam === "string" ? pwdParam : pwdParam?.[0]) ||
    process.env.ZOOM_MEETING_PASSCODE ||
    ""

  return (
    <div className="fixed inset-0 z-[9999] min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white shrink-0">
        {/* LEFT SIDE */}
        <div>
          <a
            href={`https://zoom.us/wc/${meetingNumber}/join?prefer=1&uname=${encodeURIComponent(displayName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition"
          >
            Open in Zoom Web
          </a>
        </div>

        {/* CENTER */}
        <div className="font-medium">
          Live Masterclass
        </div>

        {/* RIGHT SIDE */}
        <div>
          <Link
            href="/members/masterclasses"
            className="text-sm px-3 py-1 bg-white text-black rounded hover:opacity-80"
          >
            Back to Masterclasses
          </Link>
        </div>
      </div>
      {/* Zoom iframe full height */}
      <div className="flex-1 min-h-0">
        <iframe
          src={`/zoom.html?mn=${meetingNumber}&pwd=${passcode}&sdk=${process.env.NEXT_PUBLIC_ZOOM_SDK_KEY}&uname=${encodeURIComponent(displayName)}&leave=/members/masterclasses`}
          className="w-full h-full"
          allow="camera; microphone; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  )
}
