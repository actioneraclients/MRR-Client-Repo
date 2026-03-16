import { getAdminProducts } from "./actions"
import AdminProductsClient from "./products-client"

export default async function AdminProductsPage() {
  const res = await getAdminProducts()
  const initialItems = res?.items ?? []

  return (
    <AdminProductsClient
      initialItems={initialItems}
    />
  )
}
