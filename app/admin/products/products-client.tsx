"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MoreVertical, Eye, Power, Star, Sparkles } from "lucide-react"
import {
  getAdminProducts,
  getProductBySlug,
  toggleProductActive,
  featureProduct,
  unfeatureProduct,
  sponsorProduct,
  unsponsorProduct,
  type ProductAdminListItem,
} from "./actions"
import ProductProfileModal from "@/components/products/ProductProfileModal"
import type { ProductProfile } from "@/components/products/ProductProfileModal"

type Props = {
  initialItems: ProductAdminListItem[]
}

export default function AdminProductsClient({ initialItems }: Props) {
  const [products, setProducts] = useState<ProductAdminListItem[]>(initialItems)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [viewingProduct, setViewingProduct] = useState<ProductProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const fetchProducts = async () => {
    const res = await getAdminProducts()
    const items = res?.items ?? []
    setProducts((prev) => {
      if (items.length > 0) return items
      if (prev.length > 0) return prev
      return items
    })
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (openDropdown) {
        const currentRef = dropdownRefs.current[openDropdown]
        if (currentRef && !currentRef.contains(target)) {
          setOpenDropdown(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  const toggleDropdown = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdown((prev) => (prev === productId ? null : productId))
  }

  const handleViewProduct = async (slug: string) => {
    setOpenDropdown(null)
    const profile = await getProductBySlug(slug)
    if (!profile) return
    setViewingProduct(profile)
  }

  const handleToggleActive = async (product: ProductAdminListItem) => {
    setOpenDropdown(null)
    setIsLoading(true)
    const result = await toggleProductActive({ id: product.id, is_active: !product.is_active })
    if (result.success) await fetchProducts()
    setIsLoading(false)
  }

  const getStatusColor = (isActive: boolean) =>
    isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const name = (p.name ?? "").toLowerCase()
    const slug = (p.slug ?? "").toLowerCase()
    const about = (p.short_description ?? "").toLowerCase()
    const owner = (p.owner_name ?? "").toLowerCase()
    return name.includes(q) || slug.includes(q) || about.includes(q) || owner.includes(q)
  })

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage products shown in Product &amp; Services</p>
          </div>
        </div>

        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {products.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-lg font-medium text-gray-900 mb-2">No products yet</p>
                <p className="text-gray-500">Products will appear here when added.</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products or members…"
                    className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Search products or members"
                  />
                </div>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
                    <p className="text-gray-500">Try a different search term.</p>
                  </div>
                ) : (
                  <table className="w-full table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          About
                        </th>
                        <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                        <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="w-[15%] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center min-w-0">
                          <div className="w-24 flex-shrink-0 mr-3 aspect-video overflow-hidden bg-gray-100 rounded flex items-center justify-center">
                            <img
                              src={product.image_url || "/placeholder.svg?height=72&width=128&query=product"}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 flex shrink-0 items-center justify-center">
                                {product.is_sponsored && (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                )}
                              </span>
                              <span className="font-medium text-gray-900 truncate">{product.name}</span>
                            </div>
                            <div className="text-sm text-gray-500 truncate">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 line-clamp-2 min-w-0">
                          {product.short_description?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 truncate min-w-0">
                          {product.owner_name?.trim() || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            product.is_active,
                          )}`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block" ref={(el) => (dropdownRefs.current[product.id] = el)}>
                          <button
                            onClick={(e) => toggleDropdown(product.id, e)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            aria-label="Open actions"
                            disabled={isLoading}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {openDropdown === product.id && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                              <span
                                onClick={() => handleViewProduct(product.slug)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                                View Product
                              </span>
                              <span
                                onClick={() => handleToggleActive(product)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                              >
                                <Power className="w-4 h-4 mr-2 text-gray-400" />
                                {product.is_active ? "Deactivate" : "Activate"}
                              </span>
                              {product.is_featured ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unfeatureProduct(product.id)
                                    if (result.success) await fetchProducts()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                                  Remove Feature
                                </span>
                              ) : (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await featureProduct(product.id)
                                    if (result.success) await fetchProducts()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Star className="w-4 h-4 mr-2 text-gray-400" />
                                  Feature
                                </span>
                              )}
                              {product.is_sponsored ? (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await unsponsorProduct(product.id)
                                    if (result.success) await fetchProducts()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 mr-2 text-gray-400" />
                                  Remove Sponsor
                                </span>
                              ) : (
                                <span
                                  onClick={async () => {
                                    setOpenDropdown(null)
                                    setIsLoading(true)
                                    const result = await sponsorProduct(product.id)
                                    if (result.success) await fetchProducts()
                                    setIsLoading(false)
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 mr-2 text-gray-400" />
                                  Sponsor
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {viewingProduct && (
        <ProductProfileModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
    </div>
  )
}
