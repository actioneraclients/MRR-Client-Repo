import { Suspense } from "react"
import { getCommunityEvents } from "./actions"
import { canUserCreateEvents } from "./can-user-create-events"
import { EventsPageContent } from "./events-page-content"
import { createClient } from "@/lib/supabase/server"

export default async function CommunityEventsPage() {
  const supabase = await createClient()
  const { data: siteSettings } = await supabase
    .from("site_settings")
    .select("upgrade_link")
    .limit(1)
    .maybeSingle()
  const upgradeLink = siteSettings?.upgrade_link ?? null

  const [events, canCreateEvents] = await Promise.all([
    getCommunityEvents(),
    canUserCreateEvents(),
  ])
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  return (
    <Suspense fallback={null}>
      <EventsPageContent
        events={events}
        canCreateEvents={canCreateEvents}
        currentUserId={currentUserId}
        upgradeLink={upgradeLink}
      />
    </Suspense>
  )
}
