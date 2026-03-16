import AdminContentClient from "./content-client"
import { getAdminContentList } from "./actions"

export default async function ContentPage() {
  const { items } = await getAdminContentList()

  return <AdminContentClient initialItems={items} />
}
