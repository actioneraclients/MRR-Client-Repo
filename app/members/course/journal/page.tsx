"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function CourseSubNav() {
  const pathname = usePathname()

  const tabs = [
    { label: "Overview", href: "/members/course", isActive: (p: string) => p === "/members/course" },
    {
      label: "Modules",
      href: "/members/course/modules",
      isActive: (p: string) => p.startsWith("/members/course/modules"),
    },
    { label: "Journal", href: "/members/course/journal", isActive: (p: string) => p === "/members/course/journal" },
  ]

  return (
    // Sub-Navigation
    <div id="sub-navigation" className="sticky top-16 bg-gray-50 z-40 border-b border-gray-200 mb-8">
      <div className="flex space-x-4 overflow-x-auto py-3" role="tablist" aria-label="Course sub-navigation">
        {tabs.map((t) => {
          const active = t.isActive(pathname)
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={active}
              className={
                active
                  ? "px-4 py-2 bg-primary text-white rounded-full font-medium shadow"
                  : "px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium"
              }
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function JournalPage() {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [entryModalOpen, setEntryModalOpen] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())
  const [entryText, setEntryText] =
    useState(`My initial thoughts on building an MRR platform: I'm excited about the potential but also nervous about the technical aspects. The key insights from this lesson were understanding the difference between one-time products and recurring revenue models.

The instructor emphasized that MRR isn't just about subscription pricing - it's about creating ongoing value that customers are willing to pay for month after month. This resonates with my experience as a customer of various SaaS tools.

Key takeaways:
1. Focus on solving a recurring problem, not a one-time issue
2. Build systems that deliver value consistently
3. Think about customer success from day one
4. Automation is crucial for scalability

I need to reflect more on what recurring problem I can solve uniquely. My background in project management and automation could be valuable here.`)
  const [lastSaved, setLastSaved] = useState("2 minutes ago")
  const [wordCount, setWordCount] = useState(342)

  // Auto-save simulation
  useEffect(() => {
    const words = entryText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    setWordCount(words)

    const saveTimeout = setTimeout(() => {
      setLastSaved("just now")
    }, 2000)

    return () => clearTimeout(saveTimeout)
  }, [entryText])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (entryModalOpen) setEntryModalOpen(false)
        if (exportModalOpen) setExportModalOpen(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && entryModalOpen) {
        e.preventDefault()
        console.log("[v0] Entry saved")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [entryModalOpen, exportModalOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (entryModalOpen || exportModalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [entryModalOpen, exportModalOpen])

  const toggleEntrySelection = (id: number) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
  }

  return (
    <div className="px-8 pb-12">
      <CourseSubNav />

      {/* Journal Header & Intro */}
      <div id="journal-header" className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Journal</h1>
            <p className="text-gray-600">All your saved reflections, organized by module and lesson.</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 p-4 rounded-xl">
              <i className="fa-solid fa-book-open text-2xl text-primary"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls Row */}
      <div id="journal-filters" className="bg-white rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Side Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[250px]">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search your entries..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {/* Module Filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                <option value="">All Modules</option>
                <option value="1">Foundation: Platform Strategy</option>
                <option value="2">Offer & Audience</option>
                <option value="3">Build & Integrate</option>
                <option value="4">Content & Marketing</option>
                <option value="5">Sales Funnels</option>
                <option value="6">Customer Success</option>
                <option value="7">Analytics</option>
                <option value="8">Scale & Expand</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>

            {/* Lesson Filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                <option value="">All Lessons</option>
                <option value="1">Welcome & Orientation</option>
                <option value="2">Choosing Your Revenue Path</option>
                <option value="3">Market Research Deep Dive</option>
                <option value="4">Understanding Your Audience</option>
                <option value="5">Crafting Your Value Proposition</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-4 text-sm text-gray-500">
          <i className="fa-solid fa-info-circle mr-1"></i>
          Use the filters above to find specific journal entries quickly
        </div>
      </div>

      {/* Journal Entries by Module */}
      <div id="journal-entries" className="space-y-8">
        {/* Module 1 Entries */}
        <div id="module-1-entries" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-accent/10 to-green-600/10 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Foundation: Platform Strategy</h3>
              </div>
              <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm font-medium">4 entries</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Entry Card 1 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(1)}
                    onChange={() => toggleEntrySelection(1)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Final
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Welcome & Orientation</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  My initial thoughts on building an MRR platform: I'm excited about the potential but also nervous
                  about the technical aspects. The key insights from this lesson were understanding the difference
                  between...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 15, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>2:30 PM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>342 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Entry Card 2 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(2)}
                    onChange={() => toggleEntrySelection(2)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Final
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Choosing Your Revenue Path</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  After analyzing different revenue models, I'm leaning towards a subscription-based approach with
                  tiered pricing. The SaaS model seems most aligned with my technical background and target audience...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 16, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>10:15 AM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>287 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Entry Card 3 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(3)}
                    onChange={() => toggleEntrySelection(3)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                      Draft
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Market Research Deep Dive</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  Still working on this analysis. Initial findings show strong demand in the productivity tools space,
                  especially for small business owners. Need to dig deeper into competitor pricing strategies...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 17, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>4:45 PM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>156 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Entry Card 4 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(4)}
                    onChange={() => toggleEntrySelection(4)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Final
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Strategy Worksheet</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  Completed the strategic planning worksheet. Key decisions: Target market - small business owners and
                  solopreneurs. Primary value prop - automation that saves 10+ hours per week. Revenue goal...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 18, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>7:20 PM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>423 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2 Entries */}
        <div id="module-2-entries" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Offer & Audience</h3>
              </div>
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">2 entries</span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Entry Card 1 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(5)}
                    onChange={() => toggleEntrySelection(5)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Final
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Understanding Your Audience</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  Deep dive into my target customer persona: Sarah, 35-45, small business owner, tech-savvy but
                  time-constrained. Pain points include manual processes, scattered tools, lack of automation. She
                  values efficiency...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 20, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>9:30 AM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>398 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>

              {/* Entry Card 2 */}
              <div className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors border border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(6)}
                    onChange={() => toggleEntrySelection(6)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                      Draft
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fa-solid fa-ellipsis-vertical text-gray-400"></i>
                    </button>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Crafting Your Value Proposition</h4>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  Working on my unique value proposition. Current draft: "Transform your business chaos into automated
                  success with our all-in-one platform that saves 15+ hours per week." Need to refine this further...
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    <i className="fa-regular fa-calendar mr-1"></i>Dec 21, 2024
                  </span>
                  <span>
                    <i className="fa-solid fa-clock mr-1"></i>3:15 PM
                  </span>
                  <span>
                    <i className="fa-solid fa-pen-to-square mr-1"></i>234 words
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEntryModalOpen(true)}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    View/Edit
                  </button>
                  <button className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Copy
                  </button>
                  <button className="text-red-500 hover:text-red-700 p-1.5">
                    <i className="fa-solid fa-trash text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Load More Button */}
        <div className="text-center">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
            <i className="fa-solid fa-plus mr-2"></i>
            Load More Entries
          </button>
        </div>
      </div>

      {/* Empty State (Hidden by default) */}
      <div id="empty-state" className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm hidden">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-book-open text-3xl text-primary"></i>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No journal entries yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Start by opening a lesson and answering the prompts. Your reflections will appear here for easy access and
          review.
        </p>
        <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <i className="fa-solid fa-arrow-right mr-2"></i>
          Go to Modules
        </button>
      </div>

      {/* Journal Statistics */}
      <div id="journal-stats" className="bg-white rounded-2xl p-6 mt-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Journal Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">6</div>
            <div className="text-sm text-gray-500">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-1">4</div>
            <div className="text-sm text-gray-500">Final Entries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-1">1,840</div>
            <div className="text-sm text-gray-500">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">7</div>
            <div className="text-sm text-gray-500">Days Active</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div id="recent-activity" className="bg-white rounded-2xl p-6 mt-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-green-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">Completed entry for "Strategy Worksheet"</p>
              <p className="text-xs text-gray-500">Module 1 • Dec 18, 2024 at 7:20 PM</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-edit text-yellow-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">Updated draft for "Crafting Your Value Proposition"</p>
              <p className="text-xs text-gray-500">Module 2 • Dec 21, 2024 at 3:15 PM</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-plus text-blue-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-medium">Started new entry for "Understanding Your Audience"</p>
              <p className="text-xs text-gray-500">Module 2 • Dec 20, 2024 at 9:30 AM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Writing Tips */}
      <div
        id="writing-tips"
        className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-2xl p-6 mt-8 border border-primary/10"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fa-solid fa-lightbulb text-secondary mr-2"></i>
          Journaling Tips for Better Learning
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Be Honest and Authentic</h4>
                <p className="text-sm text-gray-600">
                  Write your genuine thoughts and reactions. Raw insights lead to better learning outcomes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Connect to Your Experience</h4>
                <p className="text-sm text-gray-600">
                  Relate new concepts to your personal or professional experiences for deeper understanding.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Ask Questions</h4>
                <p className="text-sm text-gray-600">
                  Note down questions that arise during lessons. They often lead to valuable insights.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Review Regularly</h4>
                <p className="text-sm text-gray-600">
                  Revisit your entries weekly to track progress and reinforce learning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options Modal */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setExportModalOpen(false)
          }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export Journal Entries</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setExportModalOpen(false)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-pdf text-red-500"></i>
                  <span className="font-medium text-gray-900">PDF Document</span>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-400"></i>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-word text-blue-600"></i>
                  <span className="font-medium text-gray-900">Word Document</span>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-400"></i>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                onClick={() => setExportModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Modal */}
      {entryModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEntryModalOpen(false)
          }}
        >
          <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <span>Module 1</span>
                  <i className="fa-solid fa-chevron-right mx-2"></i>
                  <span>Foundation: Platform Strategy</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Welcome & Orientation</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setEntryModalOpen(false)}>
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder="Write your thoughts and reflections here..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
              />
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  <i className="fa-solid fa-pen-to-square mr-1"></i>
                  {wordCount} words
                </span>
                <span>
                  <i className="fa-solid fa-clock mr-1"></i>Last saved: {lastSaved}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button className="text-primary hover:text-primary/80 font-medium">Go to Lesson</button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  Copy to Clipboard
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                  Save Changes
                </button>
                <button className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors">
                  Save as Final
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg font-medium"
                  onClick={() => setEntryModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
