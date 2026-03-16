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

export default function CourseModulesPage() {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "module-2": true, // Module 2 is expanded by default
  })
  const [showBackToTop, setShowBackToTop] = useState(false)

  const toggleAccordion = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="px-8 pb-12">
      <CourseSubNav />

      {/* Breadcrumb */}
      <div id="breadcrumb" className="flex items-center text-sm text-gray-500 mb-6">
        <span className="hover:text-primary cursor-pointer">Home</span>
        <i className="fa-solid fa-chevron-right mx-2"></i>
        <span className="hover:text-primary cursor-pointer">Course</span>
        <i className="fa-solid fa-chevron-right mx-2"></i>
        <span className="text-gray-900">Modules</span>
      </div>

      {/* Page Title */}
      <div id="page-title" className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Modules & Lessons</h1>
        <div className="flex items-center space-x-4">
          {/* Filter Controls */}
          <div id="filter-controls" className="flex bg-white rounded-lg border border-gray-200 shadow-sm">
            <button className="px-4 py-2 bg-primary text-white rounded-l-lg font-medium text-sm">All</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium text-sm">Not Started</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium text-sm">In Progress</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium text-sm">Completed</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-r-lg font-medium text-sm">
              Locked
            </button>
          </div>
          {/* View Toggle */}
          <div id="view-toggle" className="flex bg-white rounded-lg border border-gray-200 shadow-sm">
            <button className="p-2 bg-primary text-white rounded-l-lg">
              <i className="fa-solid fa-list"></i>
            </button>
            <button className="p-2 text-gray-700 hover:bg-gray-50 rounded-r-lg">
              <i className="fa-solid fa-grip"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Course Progress Overview */}
      <div id="progress-overview" className="bg-blue-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Course Progress</h2>
          <span className="text-2xl font-bold text-primary">12%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full" style={{ width: "12%" }}></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">1</div>
            <div className="text-sm text-gray-500">Modules Completed</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-sm text-gray-500">Lessons Completed</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">2h 15m</div>
            <div className="text-sm text-gray-500">Time Spent</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">6h 45m</div>
            <div className="text-sm text-gray-500">Time Remaining</div>
          </div>
        </div>
        <div className="flex justify-end">
          <Link
            href="/members/course/lesson"
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continue Course
          </Link>
        </div>
      </div>

      {/* Modules List */}
      <div id="modules-list" className="space-y-4">
        {/* Module 1 */}
        <div id="module-1" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-1")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-green-600 rounded-xl flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Foundation: Your Platform Strategy</h3>
                  <p className="text-gray-600 mb-2">
                    Define your niche, understand your audience, and map your revenue streams.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-accent/10 text-accent px-2 py-1 rounded-full">4 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">45-60 min</span>
                    <span className="text-gray-500">Last updated: 2 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-accent h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">100% Complete</span>
                </div>
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-medium text-sm">Completed</span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-1"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>

          <div
            className={`accordion-content bg-gray-50 overflow-hidden transition-all duration-300 ${
              expandedModules["module-1"] ? "max-h-[1000px]" : "max-h-0"
            }`}
          >
            <div className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-play text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Welcome & Orientation</h4>
                    <span className="text-sm text-gray-500">Video • 7:32</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Review</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-text text-secondary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Choosing Your Revenue Path</h4>
                    <span className="text-sm text-gray-500">Reading • 6 min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Review</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-headphones text-purple-500"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Market Research Deep Dive</h4>
                    <span className="text-sm text-gray-500">Audio • 12:45</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Review</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-download text-indigo-500"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Strategy Worksheet</h4>
                    <span className="text-sm text-gray-500">Download • PDF</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2 */}
        <div id="module-2" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-2")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Offer & Audience</h3>
                  <p className="text-gray-600 mb-2">
                    Create compelling offers that resonate with your target audience.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">6 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">75-90 min</span>
                    <span className="text-gray-500">Started 3 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "33%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">33% Complete</span>
                </div>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium text-sm">
                  In Progress
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-2"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>

          <div
            className={`accordion-content bg-gray-50 overflow-hidden transition-all duration-300 ${
              expandedModules["module-2"] ? "max-h-[1000px]" : "max-h-0"
            }`}
          >
            <div className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-play text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Understanding Your Audience</h4>
                    <span className="text-sm text-gray-500">Video • 15:22</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Review</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-text text-secondary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Crafting Your Value Proposition</h4>
                    <span className="text-sm text-gray-500">Reading • 8 min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-check text-accent"></i>
                  <button className="text-primary hover:text-primary/80 font-medium">Review</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 bg-primary/5">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-play text-primary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Pricing Strategies That Work</h4>
                    <span className="text-sm text-gray-500">Video • 18:05</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-play text-white text-xs"></i>
                  </div>
                  <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium">Resume</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 opacity-60">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-headphones text-purple-500"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Competitive Analysis</h4>
                    <span className="text-sm text-gray-500">Audio • 22:15</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-lock text-gray-400" title="Complete prior lesson"></i>
                  <span className="text-gray-400">Locked</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 opacity-60">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-text text-secondary"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Market Positioning Framework</h4>
                    <span className="text-sm text-gray-500">Reading • 10 min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-lock text-gray-400" title="Complete prior lesson"></i>
                  <span className="text-gray-400">Locked</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 opacity-60">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-download text-indigo-500"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Offer Creation Template</h4>
                    <span className="text-sm text-gray-500">Download • PDF</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-lock text-gray-400" title="Complete prior lesson"></i>
                  <span className="text-gray-400">Locked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3 */}
        <div id="module-3" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-3")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Build & Integrate</h3>
                  <p className="text-gray-600 mb-2">
                    Set up your tech stack and integrate essential tools for automation.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">8 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">120-150 min</span>
                    <span className="text-gray-500">Locked until Module 2 complete</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-3"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>

          <div
            className={`accordion-content bg-gray-50 overflow-hidden transition-all duration-300 ${
              expandedModules["module-3"] ? "max-h-[1000px]" : "max-h-0"
            }`}
          >
            <div className="p-6 pt-0 space-y-3">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 opacity-60">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-play text-gray-400"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Tech Stack Overview</h4>
                    <span className="text-sm text-gray-500">Video • 12:30</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-lock text-gray-400" title="Complete Module 2 to unlock"></i>
                  <span className="text-gray-400">Locked</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 opacity-60">
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-file-text text-gray-400"></i>
                  <div>
                    <h4 className="font-medium text-gray-900">Platform Selection Guide</h4>
                    <span className="text-sm text-gray-500">Reading • 15 min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fa-solid fa-lock text-gray-400" title="Complete Module 2 to unlock"></i>
                  <span className="text-gray-400">Locked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 4 */}
        <div id="module-4" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-4")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Content Creation & Marketing</h3>
                  <p className="text-gray-600 mb-2">
                    Develop compelling content and marketing strategies to attract customers.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">7 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">95-120 min</span>
                    <span className="text-gray-500">Locked</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-4"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        {/* Module 5 */}
        <div id="module-5" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-5")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  5
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Sales Funnels & Automation</h3>
                  <p className="text-gray-600 mb-2">
                    Build automated sales funnels that convert visitors into customers.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">6 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">85-105 min</span>
                    <span className="text-gray-500">Locked</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-5"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        {/* Module 6 */}
        <div id="module-6" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-6")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  6
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Customer Success & Retention</h3>
                  <p className="text-gray-600 mb-2">
                    Keep customers engaged and reduce churn with proven retention strategies.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">5 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">65-80 min</span>
                    <span className="text-gray-500">Locked</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-6"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        {/* Module 7 */}
        <div id="module-7" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-7")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  7
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Analytics & Optimization</h3>
                  <p className="text-gray-600 mb-2">
                    Track performance metrics and optimize for maximum revenue growth.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">4 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">55-70 min</span>
                    <span className="text-gray-500">Locked</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-7"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>

        {/* Module 8 */}
        <div id="module-8" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 cursor-pointer" onClick={() => toggleAccordion("module-8")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold">
                  8
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Scale & Expand</h3>
                  <p className="text-gray-600 mb-2">
                    Advanced strategies for scaling your MRR business to 6-7 figures.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">5 lessons</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">75-90 min</span>
                    <span className="text-gray-500">Locked</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mb-1">
                    <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">0% Complete</span>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium text-sm flex items-center">
                  <i className="fa-solid fa-lock mr-2"></i>
                  Locked
                </span>
                <i
                  className="fa-solid fa-chevron-down text-gray-400 transition-transform duration-200"
                  style={{
                    transform: expandedModules["module-8"] ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div id="legend" className="bg-white rounded-2xl p-6 mt-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-play text-primary"></i>
            <span>Video Lesson</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-file-text text-secondary"></i>
            <span>Reading Material</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-headphones text-purple-500"></i>
            <span>Audio Content</span>
          </div>
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-download text-indigo-500"></i>
            <span>Downloadable Resource</span>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs">Completed</span>
              <span>Module finished</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">In Progress</span>
              <span>Currently learning</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Locked</span>
              <span>Complete prerequisites</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-check text-accent"></i>
              <span>Lesson completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Resources */}
      <div id="course-resources" className="bg-white rounded-2xl p-6 mt-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Resources</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <i className="fa-solid fa-book text-primary"></i>
              <h4 className="font-medium text-gray-900">Course Handbook</h4>
            </div>
            <p className="text-sm text-gray-600">Complete guide with all lessons and worksheets</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <i className="fa-solid fa-users text-accent"></i>
              <h4 className="font-medium text-gray-900">Community Forum</h4>
            </div>
            <p className="text-sm text-gray-600">Connect with fellow students and instructors</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <i className="fa-solid fa-calendar text-secondary"></i>
              <h4 className="font-medium text-gray-900">Office Hours</h4>
            </div>
            <p className="text-sm text-gray-600">Weekly live Q&A sessions with instructors</p>
          </div>
        </div>
      </div>

      {/* Study Tips */}
      <div
        id="study-tips"
        className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-2xl p-6 mt-8 border border-primary/10"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fa-solid fa-lightbulb text-secondary mr-2"></i>
          Study Tips for Success
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set a Schedule</h4>
                <p className="text-sm text-gray-600">Dedicate 30-45 minutes daily for consistent progress</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Take Notes</h4>
                <p className="text-sm text-gray-600">Use the built-in note-taking feature for key insights</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Apply Immediately</h4>
                <p className="text-sm text-gray-600">Implement lessons in real-time for better retention</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Join Discussions</h4>
                <p className="text-sm text-gray-600">Participate in community forums for deeper learning</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        id="back-to-top"
        className={`fixed bottom-6 right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 lg:hidden ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={scrollToTop}
      >
        <i className="fa-solid fa-chevron-up"></i>
      </button>
    </div>
  )
}
