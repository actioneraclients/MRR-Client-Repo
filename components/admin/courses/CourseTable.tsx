"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MoreHorizontal, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import {
  approveCourse,
  retireCourse,
  restoreCourse,
  toggleFeaturedCourse,
  deleteCourse,
  sponsorCourse,
  unsponsorCourse,
  updateCourseStatus,
  updateCourseStripeDetails,
  updateCoursePlans,
  updateCourseAccessType,
  getActivePlans,
  getCourseAccessPlanIds,
} from "@/app/admin/courses/actions"

type CourseRow = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: string | null
  access_type: string | null
  price: number | null
  stripe_price_id?: string | null
  payment_url?: string | null
  created_by: string | null
  created_at: string | null
  featured?: boolean | null
  is_sponsored?: boolean | null
}

interface CourseTableProps {
  courses: CourseRow[]
}

export default function CourseTable({ courses }: CourseTableProps) {
  const router = useRouter()
  const [statusCourse, setStatusCourse] = useState<CourseRow | null>(null)
  const [plansCourse, setPlansCourse] = useState<CourseRow | null>(null)
  const [stripeCourse, setStripeCourse] = useState<CourseRow | null>(null)
  const [accessCourse, setAccessCourse] = useState<CourseRow | null>(null)
  const [accessType, setAccessType] = useState<string>("free")

  return (
    <>
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="p-3">Thumbnail</th>
            <th className="p-3">Title</th>
            <th className="p-3">Access</th>
            <th className="p-3">Price</th>
            <th className="p-3">Status</th>
            <th className="p-3">Created</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="border-t">
              <td className="p-3 w-[90px]">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={64}
                    height={40}
                    className="rounded object-cover"
                  />
                ) : (
                  <div className="w-[64px] h-[40px] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </td>

              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    {course.is_sponsored && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                  </span>
                  <a
                    href={`/members/courses/${course.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {course.title}
                  </a>
                </div>
                {course.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
                    {course.description}
                  </div>
                )}
              </td>

              <td className="p-3">

                {course.access_type === "free" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Free
                  </Badge>
                )}

                {course.access_type === "paid" && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Paid
                  </Badge>
                )}

                {course.access_type === "plan" && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Plan
                  </Badge>
                )}

              </td>

              <td className="p-3">
                {course.price ? `$${course.price}` : "—"}
              </td>

              <td className="p-3">

                {course.status === "draft" && (
                  <Badge variant="secondary">
                    Draft
                  </Badge>
                )}

                {course.status === "pending" && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending
                  </Badge>
                )}

                {course.status === "approved" && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Approved
                  </Badge>
                )}

                {course.status === "retired" && (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                    Retired
                  </Badge>
                )}

              </td>

              <td className="p-3 text-xs text-muted-foreground">
                {course.created_at
                  ? new Date(course.created_at).toLocaleDateString()
                  : ""}
              </td>

              <td className="p-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded">
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">

                    <DropdownMenuItem asChild>
                      <a
                        href={`/members/courses/${course.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Course
                      </a>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {course.status === "pending" && (
                      <DropdownMenuItem onClick={() => approveCourse(course.id)}>
                        Approve Course
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() =>
                        toggleFeaturedCourse(course.id, course.featured || false)
                      }
                    >
                      Toggle Featured
                    </DropdownMenuItem>

                    {course.is_sponsored ? (
                      <DropdownMenuItem
                        onClick={async () => {
                          await unsponsorCourse(course.id)
                          router.refresh()
                        }}
                      >
                        Remove Sponsor
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={async () => {
                          await sponsorCourse(course.id)
                          router.refresh()
                        }}
                      >
                        Sponsor
                      </DropdownMenuItem>
                    )}

                    {course.status === "approved" && (
                      <DropdownMenuItem onClick={() => retireCourse(course.id)}>
                        Retire Course
                      </DropdownMenuItem>
                    )}

                    {course.status === "retired" && (
                      <DropdownMenuItem onClick={() => restoreCourse(course.id)}>
                        Restore Course
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => setStatusCourse(course)}
                    >
                      Change Status
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setPlansCourse(course)}
                    >
                      Assign Plans
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => setStripeCourse(course)}
                    >
                      Payment Details
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        setAccessCourse(course)
                        setAccessType(course.access_type || "free")
                      }}
                    >
                      Change Access Type
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteCourse(course.id)}
                    >
                      Delete Course
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}

          {courses.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground">
                No courses found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Status Modal */}
    <Dialog open={!!statusCourse} onOpenChange={(open) => !open && setStatusCourse(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status — {statusCourse?.title}</DialogTitle>
        </DialogHeader>
        {statusCourse && (
          <StatusModalContent
            course={statusCourse}
            onClose={() => setStatusCourse(null)}
            onSuccess={() => {
              router.refresh()
              setStatusCourse(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Plans Modal */}
    <Dialog open={!!plansCourse} onOpenChange={(open) => !open && setPlansCourse(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Plans — {plansCourse?.title}</DialogTitle>
        </DialogHeader>
        {plansCourse && (
          <PlansModalContent
            course={plansCourse}
            onClose={() => setPlansCourse(null)}
            onSuccess={() => {
              router.refresh()
              setPlansCourse(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Stripe Payment Modal */}
    <Dialog open={!!stripeCourse} onOpenChange={(open) => !open && setStripeCourse(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Details — {stripeCourse?.title}</DialogTitle>
        </DialogHeader>
        {stripeCourse && (
          <StripeModalContent
            course={stripeCourse}
            onClose={() => setStripeCourse(null)}
            onSuccess={() => {
              router.refresh()
              setStripeCourse(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Access Type Modal */}
    <Dialog open={!!accessCourse} onOpenChange={(open) => !open && setAccessCourse(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Course Access Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          <select
            className="w-full border rounded p-2"
            value={accessType}
            onChange={(e) => setAccessType(e.target.value)}
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="plan">Plan Required</option>
          </select>

        </div>

        <DialogFooter>

          <button
            className="px-4 py-2 rounded border"
            onClick={() => setAccessCourse(null)}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 rounded bg-primary text-white"
            onClick={async () => {
              if (!accessCourse) return

              await updateCourseAccessType(
                accessCourse.id,
                accessType as "free" | "paid" | "plan"
              )

              router.refresh()
              setAccessCourse(null)
            }}
          >
            Save
          </button>

        </DialogFooter>

      </DialogContent>
    </Dialog>
    </>
  )
}

function StatusModalContent({
  course,
  onClose,
  onSuccess,
}: {
  course: CourseRow
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedStatus, setSelectedStatus] = useState(course.status || "draft")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const STATUS_OPTIONS = ["draft", "pending", "approved", "retired"]

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await updateCourseStatus(course.id, selectedStatus)
    onSuccess()
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update Status"}
        </Button>
      </DialogFooter>
    </div>
  )
}

function PlansModalContent({
  course,
  onClose,
  onSuccess,
}: {
  course: CourseRow
  onClose: () => void
  onSuccess: () => void
}) {
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([])
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [plansRes, accessRes] = await Promise.all([
        getActivePlans(),
        getCourseAccessPlanIds(course.id),
      ])
      if (!mounted) return
      if (plansRes.success) setPlans(plansRes.plans)
      if (accessRes.success) {
        setSelectedPlanIds(new Set(accessRes.planIds))
      }
      setIsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [course.id])

  const togglePlan = (planId: string) => {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) next.delete(planId)
      else next.add(planId)
      return next
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await updateCoursePlans(course.id, Array.from(selectedPlanIds))
    onSuccess()
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active plans found.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className="flex items-center gap-2 cursor-pointer py-2 px-1 hover:bg-muted rounded"
            >
              <Checkbox
                checked={selectedPlanIds.has(plan.id)}
                onCheckedChange={() => togglePlan(plan.id)}
              />
              <span className="text-sm">{plan.name}</span>
            </label>
          ))}
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Saving…" : "Save Plans"}
        </Button>
      </DialogFooter>
    </div>
  )
}

function StripeModalContent({
  course,
  onClose,
  onSuccess,
}: {
  course: CourseRow
  onClose: () => void
  onSuccess: () => void
}) {
  const [price, setPrice] = useState<string>(course.price != null ? String(course.price) : "")
  const [stripePriceId, setStripePriceId] = useState(course.stripe_price_id || "")
  const [paymentUrl, setPaymentUrl] = useState(course.payment_url || "")
  const [siteDomain, setSiteDomain] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadSiteDomain() {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data } = await supabase
        .from("site_settings")
        .select("site_domain")
        .limit(1)
        .maybeSingle()
      setSiteDomain(data?.site_domain ?? "")
    }
    loadSiteDomain()
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const priceNum = price.trim() ? parseFloat(price) : null
    await updateCourseStripeDetails(
      course.id,
      priceNum,
      stripePriceId.trim() || null,
      paymentUrl.trim() || null
    )
    onSuccess()
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Price</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Stripe Price ID</label>
        <input
          type="text"
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          placeholder="price_xxx"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Stripe Payment URL</label>
        <input
          type="url"
          value={paymentUrl}
          onChange={(e) => setPaymentUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Stripe Return URL</label>
        {(() => {
          const baseUrl = siteDomain
            ? siteDomain.startsWith("http")
              ? siteDomain
              : `https://${siteDomain}`
            : ""
          const returnUrl = baseUrl
            ? `${baseUrl}/members/courses/purchase-success?course_id=${course.id}`
            : ""
          return (
            <div className="flex gap-2">
              <input
                readOnly
                value={returnUrl}
                placeholder={!siteDomain ? "Configure site_domain in Settings" : undefined}
                className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-700"
              />
              <button
                type="button"
                onClick={() => returnUrl && navigator.clipboard.writeText(returnUrl)}
                disabled={!returnUrl}
                className="px-3 py-2 border rounded-md hover:bg-gray-100 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy"
              >
                Copy
              </button>
            </div>
          )
        })()}
        <p className="text-xs text-gray-500 mt-1">
          Paste this URL into the Stripe Payment Link &quot;After payment → Redirect to website&quot; setting.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </div>
  )
}
