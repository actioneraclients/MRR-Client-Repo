import { getAdminCommunityEvents } from "./actions"
import AdminEventsClient from "./events-client"

interface Event {
  id: string
  title: string
  short_description: string
  header_image_url: string | null
  organizer: {
    full_name: string
    avatar_url: string | null
    email: string | null
  } | null
  start_date: string
  end_date: string | null
  time_label: string
  event_type: string
  is_published: boolean
  cost_label: string | null
  event_url: string
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  const filters = {
    search: typeof params.search === "string" ? params.search : undefined,
    eventType: typeof params.eventType === "string" ? params.eventType : undefined,
    status:
      typeof params.status === "string" && (params.status === "published" || params.status === "unpublished")
        ? params.status
        : undefined,
  }

  const events = await getAdminCommunityEvents(filters)

  return <AdminEventsClient events={events} initialFilters={filters} />
}
