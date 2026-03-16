"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Search, Star } from "lucide-react"
import ChangeStatusModal from "./ChangeStatusModal"
import MasterclassAccessModal from "./MasterclassAccessModal"
import AdminMasterclassDetailsModal from "./AdminMasterclassDetailsModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  approveMasterclass,
  setMasterclassLive,
  completeMasterclass,
  toggleFeaturedMasterclass,
  sponsorMasterclass,
  unsponsorMasterclass,
  retireMasterclass,
  deleteMasterclass,
} from "@/app/admin/masterclasses/actions"

export type MasterclassRow = {
  id: string
  title: string
  description: string
  topics: string[]
  whoItsFor: string | null
  videoUrl: string | null
  imageUrl: string | null
  hostName: string
  hostAvatarUrl: string | null
  scheduledAtFormatted: string
  scheduledAt: string | null
  durationMinutes: number | null
  durationFormatted: string
  status: string
  isFeatured: boolean
  isSponsored: boolean
  creatorId: string | null
  attendeeCount: number
}

export type CreatorOption = {
  id: string
  fullName: string
}

type Props = {
  masterclasses: MasterclassRow[]
  creators: CreatorOption[]
}

export default function MasterclassTable({ masterclasses, creators }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedMasterclass, setSelectedMasterclass] = useState<MasterclassRow | null>(null)
  const [changeStatusRow, setChangeStatusRow] = useState<MasterclassRow | null>(null)
  const [accessRow, setAccessRow] = useState<MasterclassRow | null>(null)
  const [hostFilter, setHostFilter] = useState("")
  const [featuredFilter, setFeaturedFilter] = useState("")
  const [timeFilter, setTimeFilter] = useState("")

  const filteredMasterclasses = useMemo(() => {
    const now = new Date().toISOString()
    return masterclasses.filter((mc) => {
      if (search) {
        const q = search.toLowerCase()
        const matchTitle = mc.title.toLowerCase().includes(q)
        const matchHost = mc.hostName.toLowerCase().includes(q)
        if (!matchTitle && !matchHost) return false
      }
      if (statusFilter && mc.status !== statusFilter) return false
      if (hostFilter && mc.creatorId !== hostFilter) return false
      if (featuredFilter === "featured" && !mc.isFeatured) return false
      if (featuredFilter === "not_featured" && mc.isFeatured) return false
      if (timeFilter === "upcoming" && (!mc.scheduledAt || mc.scheduledAt <= now)) return false
      if (timeFilter === "past" && (!mc.scheduledAt || mc.scheduledAt >= now)) return false
      return true
    })
  }, [masterclasses, search, statusFilter, hostFilter, featuredFilter, timeFilter])

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setHostFilter("")
    setFeaturedFilter("")
    setTimeFilter("")
  }

  const hasActiveFilters = search || statusFilter || hostFilter || featuredFilter || timeFilter

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <section className="mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search masterclasses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
              <select
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="featured">Featured</option>
                <option value="not_featured">Not Featured</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium w-16">Thumbnail</th>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Host</th>
              <th className="text-left p-3 font-medium">Scheduled</th>
              <th className="text-left p-3 font-medium">Duration</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Featured</th>
              <th className="text-left p-3 font-medium">Attendees</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMasterclasses.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  {masterclasses.length === 0 ? "No masterclasses yet." : "No content matches your filters."}
                </td>
              </tr>
            ) : (
              filteredMasterclasses.map((row) => {
                const isLive = row.status === "live"
                return (
                  <tr key={row.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      {row.imageUrl ? (
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                          <img
                            src={row.imageUrl}
                            alt=""
                            width={48}
                            height={48}
                            className="object-cover w-12 h-12"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted" />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center shrink-0">
                          {row.isSponsored && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </span>
                        <span className="font-medium">{row.title ?? "—"}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {row.hostAvatarUrl ? (
                          <span className="relative block w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                            <img
                              src={row.hostAvatarUrl}
                              alt=""
                              width={24}
                              height={24}
                              className="object-cover w-6 h-6"
                            />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-muted shrink-0" />
                        )}
                        <span>{row.hostName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.scheduledAtFormatted}</td>
                    <td className="p-3">
                      {row.durationFormatted || "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{row.status ?? "—"}</Badge>
                    </td>
                    <td className="p-3">{row.isFeatured ? "Yes" : "No"}</td>
                    <td className="p-3">{row.attendeeCount}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isLive && (
                          <Button size="sm" asChild>
                            <Link
                              href={`/members/masterclasses/live/${row.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Live
                            </Link>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="More actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setSelectedMasterclass(row)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setChangeStatusRow(row)}>
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setAccessRow(row)}>
                              Access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <form>
                              {row.status === "pending" && (
                                <DropdownMenuItem asChild>
                                  <button
                                    type="submit"
                                    formAction={approveMasterclass.bind(null, row.id)}
                                    className="w-full cursor-default text-left"
                                  >
                                    Approve
                                  </button>
                                </DropdownMenuItem>
                              )}
                              {row.status === "approved" && (
                                <DropdownMenuItem asChild>
                                  <button
                                    type="submit"
                                    formAction={setMasterclassLive.bind(null, row.id)}
                                    className="w-full cursor-default text-left"
                                  >
                                    Set Live
                                  </button>
                                </DropdownMenuItem>
                              )}
                              {row.status === "live" && (
                                <DropdownMenuItem asChild>
                                  <button
                                    type="submit"
                                    formAction={completeMasterclass.bind(null, row.id)}
                                    className="w-full cursor-default text-left"
                                  >
                                    Mark Completed
                                  </button>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <button
                                  type="submit"
                                  formAction={toggleFeaturedMasterclass.bind(
                                    null,
                                    row.id,
                                    !row.isFeatured
                                  )}
                                  className="w-full cursor-default text-left"
                                >
                                  {row.isFeatured ? "Unfeature" : "Feature"}
                                </button>
                              </DropdownMenuItem>
                              {row.isSponsored ? (
                                <DropdownMenuItem
                                  onSelect={async () => {
                                    await unsponsorMasterclass(row.id)
                                    router.refresh()
                                  }}
                                >
                                  Remove Sponsor
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={async () => {
                                    await sponsorMasterclass(row.id)
                                    router.refresh()
                                  }}
                                >
                                  Sponsor
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <button
                                  type="submit"
                                  formAction={retireMasterclass.bind(null, row.id)}
                                  className="w-full cursor-default text-left"
                                >
                                  Retire
                                </button>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild variant="destructive">
                                <button
                                  type="submit"
                                  formAction={deleteMasterclass.bind(null, row.id)}
                                  className="w-full cursor-default text-left"
                                >
                                  Delete
                                </button>
                              </DropdownMenuItem>
                            </form>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <AdminMasterclassDetailsModal
        masterclass={selectedMasterclass}
        open={!!selectedMasterclass}
        onClose={() => setSelectedMasterclass(null)}
      />
      {changeStatusRow && (
        <ChangeStatusModal
          masterclass={changeStatusRow}
          onClose={() => setChangeStatusRow(null)}
        />
      )}
      {accessRow && (
        <MasterclassAccessModal
          masterclass={accessRow}
          onClose={() => setAccessRow(null)}
        />
      )}
    </div>
  )
}
