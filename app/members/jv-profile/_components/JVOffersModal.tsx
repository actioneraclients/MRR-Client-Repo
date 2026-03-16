"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface JVOffer {
  id: string
  profile_id: string
  jv_profile_id: string
  name: string
  type: string
  description: string | null
  url: string | null
  image_url: string | null
  resources: any
  status: string
  cost_struct: string | null
  commission_pct: number | null
  lead_price: number | null
  swap_notes: string | null
  cookie_days: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface JVOffersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JVOffersModal({ open, onOpenChange }: JVOffersModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [offers, setOffers] = useState<JVOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<JVOffer | null>(null)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "affiliate",
    description: "",
    url: "",
    cost_struct: "",
    commission_pct: "",
    lead_price: "",
    swap_notes: "",
    cookie_days: "",
    start_date: "",
    end_date: "",
    status: "draft",
  })

  useEffect(() => {
    if (open) {
      loadProfileAndOffers()
      setMode("create")
      setSelectedOffer(null)
      setFormData({
        name: "",
        type: "affiliate",
        description: "",
        url: "",
        cost_struct: "",
        commission_pct: "",
        lead_price: "",
        swap_notes: "",
        cookie_days: "",
        start_date: "",
        end_date: "",
        status: "draft",
      })
    }
  }, [open])

  const loadProfileAndOffers = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        toast({
          title: "Error",
          description: "Failed to get user information",
          variant: "destructive",
        })
        return
      }

      // Load JV profile
      const { data: profile, error: profileError } = await supabase
        .from("jv_profiles")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single()

      if (profileError || !profile) {
        setProfileId(null)
        setOffers([])
        return
      }

      setProfileId(profile.id)

      // Load offers
      const { data: offersData, error: offersError } = await supabase
        .from("jv_offers")
        .select("*")
        .or(`profile_id.eq.${profile.id},jv_profile_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })

      if (offersError) {
        toast({
          title: "Error",
          description: "Failed to load offers",
          variant: "destructive",
        })
        return
      }

      setOffers(offersData || [])
    } catch (error) {
      console.error("Error loading profile and offers:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNewOffer = () => {
    setMode("create")
    setSelectedOffer(null)
    setFormData({
      name: "",
      type: "affiliate",
      description: "",
      url: "",
      cost_struct: "",
      commission_pct: "",
      lead_price: "",
      swap_notes: "",
      cookie_days: "",
      start_date: "",
      end_date: "",
      status: "draft",
    })
  }

  const handleSelectOffer = (offer: JVOffer) => {
    setMode("edit")
    setSelectedOffer(offer)
    setFormData({
      name: offer.name || "",
      type: offer.type || "affiliate",
      description: offer.description || "",
      url: offer.url || "",
      cost_struct: offer.cost_struct || "",
      commission_pct: offer.commission_pct?.toString() || "",
      lead_price: offer.lead_price?.toString() || "",
      swap_notes: offer.swap_notes || "",
      cookie_days: offer.cookie_days?.toString() || "",
      start_date: offer.start_date || "",
      end_date: offer.end_date || "",
      status: offer.status || "draft",
    })
  }

  const handleSaveOffer = async () => {
    if (!profileId) {
      toast({
        title: "Error",
        description: "No JV profile found",
        variant: "destructive",
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Offer name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      const offerData = {
        profile_id: profileId,
        jv_profile_id: profileId,
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        url: formData.url || null,
        cost_struct: formData.cost_struct || null,
        commission_pct: formData.commission_pct ? Number.parseFloat(formData.commission_pct) : null,
        lead_price: formData.lead_price ? Number.parseFloat(formData.lead_price) : null,
        swap_notes: formData.swap_notes || null,
        cookie_days: formData.cookie_days ? Number.parseInt(formData.cookie_days) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
        resources: {},
      }

      if (mode === "create") {
        const { error } = await supabase.from("jv_offers").insert(offerData)

        if (error) {
          toast({
            title: "Error",
            description: "Failed to create offer",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "JV offer created successfully",
        })
      } else if (mode === "edit" && selectedOffer) {
        const { error } = await supabase
          .from("jv_offers")
          .update(offerData)
          .eq("id", selectedOffer.id)
          .or(`profile_id.eq.${profileId},jv_profile_id.eq.${profileId}`)

        if (error) {
          toast({
            title: "Error",
            description: "Failed to update offer",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Success",
          description: "JV offer updated successfully",
        })
      }

      // Refresh offers list
      await loadProfileAndOffers()
      handleNewOffer()
    } catch (error) {
      console.error("Error saving offer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOffer = async () => {
    if (!offerToDelete || !profileId) return

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from("jv_offers").delete().eq("id", offerToDelete)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete offer",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "JV offer deleted successfully",
      })

      // Refresh offers list and clear form
      await loadProfileAndOffers()
      handleNewOffer()
    } catch (error) {
      console.error("Error deleting offer:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteConfirmOpen(false)
      setOfferToDelete(null)
    }
  }

  const confirmDelete = (offerId: string) => {
    setOfferToDelete(offerId)
    setDeleteConfirmOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-[96vw] md:w-[88vw] lg:w-[72vw] xl:w-[68vw] !max-w-[72rem] p-0 bg-transparent"
          style={{ maxWidth: "72rem" }}
        >
          <div className="flex h-full max-h-[85vh] flex-col bg-white rounded-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-200 bg-white flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-900">JV Offers</h2>
              <p className="text-sm text-slate-500 mt-1">
                Add and manage the collaboration offers you want partners to see.
              </p>
            </div>

            {!profileId ? (
              <div className="px-6 py-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    You need to create your main JV Profile first. Save that, then add offers.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex gap-6 flex-1 min-h-0 px-6 py-6 bg-[#ebebeb]">
                <div className="w-[35%] flex flex-col bg-white rounded-2xl border border-slate-200/70 p-5">
                  <div className="mb-4 flex-shrink-0">
                    <Button
                      onClick={handleNewOffer}
                      className="w-full bg-[#2f91cf] hover:bg-[#2f91cf]/90 text-white"
                      disabled={loading}
                    >
                      <i className="fa-solid fa-plus mr-2"></i>
                      New Offer
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                    {loading && offers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">Loading offers...</p>
                    ) : offers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No offers yet. Create your first!</p>
                    ) : (
                      offers.map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            selectedOffer?.id === offer.id
                              ? "bg-[#2f91cf]/10 border-[#2f91cf]"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                          onClick={() => handleSelectOffer(offer)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate text-slate-900">{offer.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 capitalize">{offer.type}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 capitalize text-slate-700">
                                  {offer.status}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                confirmDelete(offer.id)
                              }}
                              className="text-red-600 hover:text-red-700 p-1"
                              disabled={loading}
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Offer Basics</h3>
                      <p className="text-xs text-slate-500 mt-1">Core details about this JV opportunity</p>
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                        Offer Name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Affiliate Program for Product X"
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type" className="text-sm font-medium text-slate-700">
                          Offer Type
                        </Label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          disabled={loading}
                        >
                          <option value="affiliate">Affiliate</option>
                          <option value="lead-swap">Lead Swap</option>
                          <option value="joint-webinar">Joint Webinar</option>
                          <option value="content">Content</option>
                          <option value="product">Product</option>
                          <option value="cross-promo">Cross Promo</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                          Status
                        </Label>
                        <select
                          id="status"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                          disabled={loading}
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your JV offer..."
                        rows={4}
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Promo & Assets</h3>
                      <p className="text-xs text-slate-500 mt-1">Where partners can find your materials</p>
                    </div>

                    <div>
                      <Label htmlFor="url" className="text-sm font-medium text-slate-700">
                        URL
                      </Label>
                      <Input
                        id="url"
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com/landing-page"
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                      <p className="text-xs text-slate-500 mt-1">Landing page, checkout, or overview URL</p>
                    </div>

                    <div>
                      <Label htmlFor="cost_struct" className="text-sm font-medium text-slate-700">
                        Cost Structure
                      </Label>
                      <Input
                        id="cost_struct"
                        value={formData.cost_struct}
                        onChange={(e) => setFormData({ ...formData, cost_struct: e.target.value })}
                        placeholder="e.g., rev share 50/50, $497 FE + 40%"
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Payout / Commission</h3>
                      <p className="text-xs text-slate-500 mt-1">Financial terms and tracking details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="commission_pct" className="text-sm font-medium text-slate-700">
                          Commission %
                        </Label>
                        <Input
                          id="commission_pct"
                          type="number"
                          step="0.01"
                          value={formData.commission_pct}
                          onChange={(e) => setFormData({ ...formData, commission_pct: e.target.value })}
                          placeholder="50"
                          disabled={loading}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lead_price" className="text-sm font-medium text-slate-700">
                          Offer Price
                        </Label>
                        <Input
                          id="lead_price"
                          type="number"
                          step="0.01"
                          value={formData.lead_price}
                          onChange={(e) => setFormData({ ...formData, lead_price: e.target.value })}
                          placeholder="25.00"
                          disabled={loading}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cookie_days" className="text-sm font-medium text-slate-700">
                        Cookie Days
                      </Label>
                      <Input
                        id="cookie_days"
                        type="number"
                        value={formData.cookie_days}
                        onChange={(e) => setFormData({ ...formData, cookie_days: e.target.value })}
                        placeholder="30"
                        disabled={loading}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                      />
                    </div>

                    {formData.type === "lead-swap" && (
                      <div>
                        <Label htmlFor="swap_notes" className="text-sm font-medium text-slate-700">
                          Lead Swap Notes
                        </Label>
                        <Textarea
                          id="swap_notes"
                          value={formData.swap_notes}
                          onChange={(e) => setFormData({ ...formData, swap_notes: e.target.value })}
                          placeholder="Details about the lead swap arrangement..."
                          rows={3}
                          disabled={loading}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/70 p-5 md:p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Launch / Availability</h3>
                      <p className="text-xs text-slate-500 mt-1">When this offer is available to partners</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date" className="text-sm font-medium text-slate-700">
                          Start Date
                        </Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          disabled={loading}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_date" className="text-sm font-medium text-slate-700">
                          End Date
                        </Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          disabled={loading}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f91cf]/80 focus-visible:ring-offset-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur px-6 py-4 flex justify-end gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Close
              </Button>
              {profileId && (
                <Button
                  onClick={handleSaveOffer}
                  disabled={loading || !formData.name.trim()}
                  className="bg-[#2f91cf] hover:bg-[#2f91cf]/90 text-white"
                >
                  {loading ? "Saving..." : mode === "create" ? "Create Offer" : "Update Offer"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete JV Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this JV offer from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOffer}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
