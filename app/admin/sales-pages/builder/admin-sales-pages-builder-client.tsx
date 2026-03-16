"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { getSalesPages, createSalesPage, duplicateSalesPage, setSalesPageHomepage, type SalesPage } from "./sales-pages-actions"

export function AdminSalesPagesBuilderClient() {
  const router = useRouter()
  const [pages, setPages] = useState<SalesPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isHomepage, setIsHomepage] = useState(false)

  const fetchPages = async () => {
    setIsLoading(true)
    const result = await getSalesPages()
    if (result.success && result.data) {
      setPages(result.data)
    } else {
      setPages([])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const openModal = () => {
    setModalOpen(true)
    setTitle("")
    setSlug("")
    setIsHomepage(false)
    setSubmitError(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSubmitError(null)
  }

  const handleCreate = async () => {
    setSubmitError(null)
    const trimmedTitle = title.trim()
    const normalizedSlug = slug.replace(/^\/+/, "").trim()

    if (!trimmedTitle) {
      setSubmitError("Page title is required")
      return
    }
    if (!normalizedSlug) {
      setSubmitError("Slug is required")
      return
    }

    setIsSubmitting(true)
    const result = await createSalesPage({
      title: trimmedTitle,
      slug: normalizedSlug,
      is_homepage: isHomepage,
    })
    setIsSubmitting(false)

    if (result.success) {
      closeModal()
      await fetchPages()
    } else {
      setSubmitError(result.error ?? "Failed to create page")
    }
  }

  return (
    <div className="flex-1 overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Pages</h2>
          <p className="text-gray-600 mt-1">Manage dynamic sales pages from the builder</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </button>
      </div>

      {/* Table / Empty State */}
      <section>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16 px-4">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-lg font-medium text-gray-900 mb-2">No sales pages created yet.</p>
              <p className="text-gray-500 mb-6">Create your first dynamic sales page to get started.</p>
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Page
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Homepage
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 truncate">{page.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 truncate font-mono">
                        {page.is_homepage ? "/" : `/${page.slug}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{page.is_homepage ? "Yes" : "No"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-2 hover:bg-gray-100 rounded"
                            aria-label="Open actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => router.push(`/admin/sales-pages/${page.id}`)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              window.open(
                                `${typeof window !== "undefined" ? window.location.origin : ""}${page.is_homepage ? "/" : `/${page.slug}`}`,
                                "_blank"
                              )
                            }
                          >
                            View Page
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              navigator.clipboard.writeText(
                                `${typeof window !== "undefined" ? window.location.origin : ""}${page.is_homepage ? "/" : `/${page.slug}`}`
                              )
                            }
                          >
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              const result = await duplicateSalesPage(page.id)
                              if (result.success) {
                                toast.success("Page duplicated")
                                router.push(`/admin/sales-pages/${result.data.id}`)
                              } else {
                                toast.error(result.error ?? "Failed to duplicate")
                              }
                            }}
                          >
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              const result = await setSalesPageHomepage(page.id)
                              if (result.success) {
                                toast.success("Set as homepage")
                                router.refresh()
                              } else {
                                toast.error(result.error ?? "Failed to set homepage")
                              }
                            }}
                          >
                            Set as Homepage
                          </DropdownMenuItem>
                          <DropdownMenuItem>Deactivate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Create Page Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md rounded-xl border shadow-lg">
          <DialogHeader>
            <DialogTitle>Create Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Authors Page"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. authors"
                className="w-full font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will create the URL for the page. Example: /authors
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="is-homepage"
                checked={isHomepage}
                onCheckedChange={(checked) => setIsHomepage(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="is-homepage"
                  className="text-sm font-medium text-gray-700 cursor-pointer leading-none"
                >
                  Set as Homepage
                </label>
                <p className="text-xs text-gray-500">
                  This page will become the main site homepage (/)
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
