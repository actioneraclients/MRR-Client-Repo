"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Wrench, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/browser"
import { getMemberTools, type MemberTool } from "./actions"

export default function ToolsPage() {
  const [tools, setTools] = useState<MemberTool[]>([])
  const [selectedTool, setSelectedTool] = useState<MemberTool | null>(null)
  const [upgradeModalTool, setUpgradeModalTool] = useState<MemberTool | null>(null)
  const [loading, setLoading] = useState(true)

  const [brandAccentColor, setBrandAccentColor] = useState<string | null>(null)
  const [brandBackgroundColor, setBrandBackgroundColor] = useState<string | null>(null)
  const [upgradeLink, setUpgradeLink] = useState<string | null>(null)
  const [pageTitle, setPageTitle] = useState("Tools and Resources")

  const supabase = createClient()

  useEffect(() => {
    const loadTools = async () => {
      setLoading(true)
      const data = await getMemberTools()
      setTools(data)
      setLoading(false)
    }
    loadTools()
  }, [])

  useEffect(() => {
    const loadBrandSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("brand_accent_color, brand_background_color, upgrade_link, member_navigation")
        .single()

      if (data) {
        if (data.brand_accent_color) setBrandAccentColor(data.brand_accent_color)
        if (data.brand_background_color) setBrandBackgroundColor(data.brand_background_color)
        if (data.upgrade_link) setUpgradeLink(data.upgrade_link)

        if (data.member_navigation) {
          let parsedNav: Array<{ id?: string; label?: string }> = []

          if (typeof data.member_navigation === "string") {
            try {
              parsedNav = JSON.parse(data.member_navigation)
            } catch {
              parsedNav = []
            }
          } else if (Array.isArray(data.member_navigation)) {
            parsedNav = data.member_navigation
          }

          const toolsNavItem = parsedNav.find((item) => item.id === "tools")
          if (toolsNavItem?.label) {
            setPageTitle(toolsNavItem.label)
          }
        }
      }
    }
    loadBrandSettings()
  }, [supabase])

  const handleLaunchClick = (tool: MemberTool) => {
    if (tool.isAvailable && tool.launch_url) {
      window.open(tool.launch_url, "_blank", "noopener,noreferrer")
    } else if (!tool.isAvailable) {
      setUpgradeModalTool(tool)
    }
  }

  const handleUpgradeClick = () => {
    if (upgradeLink) {
      window.open(upgradeLink, "_blank", "noopener,noreferrer")
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (tools.length === 0) {
    return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600 max-w-xl">
            Powerful tools to help you plan, create, and grow your business
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Tools Available</h2>
            <p className="text-slate-500 max-w-md">
              There are no tools available at this time. Check back later for new resources.
            </p>
          </div>
      </div>
    </div>
  )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
          <p className="text-gray-600 max-w-xl">
            Powerful tools to help you plan, create, and grow your business
          </p>
        </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="relative w-full h-36 bg-slate-100">
                <Image
                  src={tool.image_url || "/placeholder.svg?height=144&width=400&query=tool"}
                  alt={tool.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">{tool.name}</h3>
                  {tool.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Sparkles className="h-3 w-3" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      <Lock className="h-3 w-3" />
                      Upgrade Needed
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 flex-1">
                  {tool.short_description || "No description available."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 bg-transparent"
                    style={{
                      backgroundColor: brandBackgroundColor || "transparent",
                      color: "#374151",
                    }}
                    onClick={() => setSelectedTool(tool)}
                  >
                    More Details
                  </Button>
                  <Button
                    variant="default"
                    className="w-full sm:flex-1"
                    style={{
                      backgroundColor: brandAccentColor || "#0f172a",
                      color: "#ffffff",
                    }}
                    onClick={() => handleLaunchClick(tool)}
                  >
                    Launch Tool
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
          <DialogContent className="w-[95vw] max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col">
            {selectedTool && (
              <div className="flex flex-col h-full min-h-0">
                <div className="relative w-full h-40 sm:h-48 bg-slate-100 flex-shrink-0">
                  <Image
                    src={selectedTool.image_url || "/placeholder.svg?height=192&width=512&query=tool"}
                    alt={selectedTool.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-3">
                      <DialogTitle className="text-xl font-semibold text-slate-900">{selectedTool.name}</DialogTitle>
                      {selectedTool.isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <Sparkles className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          <Lock className="h-3 w-3" />
                          Upgrade Needed
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed pt-2 whitespace-pre-line">
                      {selectedTool.full_description || selectedTool.short_description || "No description available."}
                    </div>
                  </DialogHeader>

                  <div className="pt-2 border-t border-slate-100">
                    {selectedTool.isAvailable ? (
                      <>
                        <p className="text-sm text-emerald-700 mb-4">This tool is included with your current plan.</p>
                        <Button
                          className="w-full"
                          style={{
                            backgroundColor: brandAccentColor || "#0f172a",
                            color: "#ffffff",
                          }}
                          onClick={() => {
                            if (selectedTool.launch_url) {
                              window.open(selectedTool.launch_url, "_blank", "noopener,noreferrer")
                            }
                          }}
                        >
                          Launch Tool
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-amber-800 mb-1">Upgrade Required</h4>
                          <p className="text-sm text-amber-700 leading-relaxed">
                            This tool is not included in your current plan. Upgrade to unlock access to this and other
                            premium features.
                          </p>
                        </div>
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={handleUpgradeClick}
                        >
                          Upgrade Now
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!upgradeModalTool} onOpenChange={(open) => !open && setUpgradeModalTool(null)}>
          <DialogContent className="w-[92vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-900">Upgrade Required</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 leading-relaxed pt-2">
                {upgradeModalTool && (
                  <>
                    <strong>{upgradeModalTool.name}</strong> is not available on your current plan.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Upgrade your membership to unlock this tool and gain access to additional premium features designed to
                help grow your business.
              </p>
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleUpgradeClick}>
                Upgrade Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
