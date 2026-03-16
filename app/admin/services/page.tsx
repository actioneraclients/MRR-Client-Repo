import { getAdminServices } from "./actions"
import AdminServicesClient from "./services-client"

export default async function AdminServicesPage() {
  const res = await getAdminServices()
  const initialItems = res?.items ?? []

  return (
    <AdminServicesClient
      initialItems={initialItems}
    />
  )
}
