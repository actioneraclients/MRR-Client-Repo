"use client"

import { useEffect } from "react"
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

export default function CoursePage() {
  useEffect(() => {
    // Progress ring animation
    const circle = document.querySelector(".progress-ring-circle") as SVGCircleElement
    if (circle) {
      const radius = circle.r.baseVal.value
      const circumference = radius * 2 * Math.PI
      const progress = 12 // 12% progress
      const offset = circumference - (progress / 100) * circumference

      circle.style.strokeDasharray = `${circumference} ${circumference}`
      circle.style.strokeDashoffset = `${offset}`
    }
  }, [])

  return (
    <div className="px-8 pb-12">
      <CourseSubNav />

      {/* Course Hero / Summary Card */}
      <div id="course-hero" className="bg-white shadow-sm rounded-2xl p-8 mb-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">The MRR Blueprint – 8-Week Intensive</h1>
            <p className="text-gray-600 mb-4 text-lg">Own the platform, own the revenue—step by step.</p>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">8 Modules</span>
              <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">32 Lessons</span>
              <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">Self-Paced</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold shadow transition-colors">
                Continue Course
              </button>
              <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors">
                View Modules
              </button>
            </div>
          </div>

          {/* Progress Panel */}
          <div
            id="progress-panel"
            className="bg-gradient-to-br from-primary/10 to-purple-600/10 p-8 rounded-2xl flex flex-col items-center min-w-[280px]"
          >
            <div className="relative w-32 h-32 mb-4">
              <svg className="progress-ring w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="339.29"
                  strokeDashoffset="298.58"
                  className="progress-ring-circle transition-[stroke-dasharray] duration-[350ms]"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#6366f1" }} />
                    <stop offset="100%" style={{ stopColor: "#a855f7" }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">12%</span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-bold text-gray-900">1 / 8</div>
                  <div className="text-gray-500">Modules</div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">4 / 32</div>
                  <div className="text-gray-500">Lessons</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Last activity: Oct 5, 2025</div>
              <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors opacity-50 cursor-not-allowed">
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn */}
      <section id="learning-outcomes" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What You'll Learn</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-chart-line text-accent"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Design your recurring-revenue platform</h3>
              <p className="text-gray-600 text-sm">
                Build a sustainable business model with predictable monthly income streams.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-robot text-primary"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Automate key business processes</h3>
              <p className="text-gray-600 text-sm">
                Set up systems that run your business while you focus on growth and strategy.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-users text-secondary"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Build and retain a loyal customer base</h3>
              <p className="text-gray-600 text-sm">
                Learn proven strategies to attract, convert, and keep customers long-term.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-rocket text-purple-600"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Scale to 6-7 figure revenue</h3>
              <p className="text-gray-600 text-sm">
                Advanced growth tactics and optimization strategies for maximum profitability.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-tools text-indigo-600"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Master essential tech stack integration</h3>
              <p className="text-gray-600 text-sm">
                Connect and optimize the tools that power modern subscription businesses.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-analytics text-green-600"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Track and optimize key metrics</h3>
              <p className="text-gray-600 text-sm">
                Use data-driven insights to continuously improve your business performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules-grid" className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>
          <span className="text-primary hover:text-primary/80 font-semibold flex items-center cursor-pointer">
            View All Modules
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Module 1 */}
          <div
            id="module-card-1"
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium">Completed</span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Foundation: Your Platform Strategy</h3>
            <p className="text-gray-600 text-sm mb-4">Define your niche and map your revenue streams.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>4 lessons</span>
              <span>45-60 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-accent h-2 rounded-full" style={{ width: "100%" }}></div>
            </div>

            <button className="w-full bg-accent/10 text-accent hover:bg-accent hover:text-white py-2 px-4 rounded-lg font-medium transition-colors">
              Review Module
            </button>
          </div>

          {/* Module 2 */}
          <div
            id="module-card-2"
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">In Progress</span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Offer & Audience</h3>
            <p className="text-gray-600 text-sm mb-4">Create compelling offers that resonate with your audience.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>6 lessons</span>
              <span>75-90 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-primary h-2 rounded-full" style={{ width: "33%" }}></div>
            </div>

            <Link
              href="/members/course/modules"
              className="w-full inline-flex items-center justify-center bg-primary text-white hover:bg-primary/90 py-2 px-4 rounded-lg font-medium transition-colors"
              aria-label="Continue Module"
            >
              Continue Module
            </Link>
          </div>

          {/* Module 3 */}
          <div id="module-card-3" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <i className="fa-solid fa-lock mr-1 text-xs"></i>
                Locked
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Build & Integrate</h3>
            <p className="text-gray-600 text-sm mb-4">Set up your tech stack and integrate essential tools.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>8 lessons</span>
              <span>120-150 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>

            <button className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed">
              Complete Module 2
            </button>
          </div>

          {/* Module 4 */}
          <div id="module-card-4" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                4
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <i className="fa-solid fa-lock mr-1 text-xs"></i>
                Locked
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Content & Marketing</h3>
            <p className="text-gray-600 text-sm mb-4">Develop content and marketing strategies.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>7 lessons</span>
              <span>95-120 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>

            <button className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed">
              Available Soon
            </button>
          </div>

          {/* Module 5 */}
          <div id="module-card-5" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                5
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <i className="fa-solid fa-lock mr-1 text-xs"></i>
                Locked
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Sales & Automation</h3>
            <p className="text-gray-600 text-sm mb-4">Build automated sales funnels that convert.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>6 lessons</span>
              <span>85-105 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>

            <button className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed">
              Available Soon
            </button>
          </div>

          {/* Module 6 */}
          <div id="module-card-6" className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm opacity-75">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                6
              </div>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                <i className="fa-solid fa-lock mr-1 text-xs"></i>
                Locked
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Customer Success</h3>
            <p className="text-gray-600 text-sm mb-4">Keep customers engaged and reduce churn.</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>5 lessons</span>
              <span>65-80 min</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-gray-300 h-2 rounded-full" style={{ width: "0%" }}></div>
            </div>

            <button className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed">
              Available Soon
            </button>
          </div>
        </div>
      </section>

      {/* Next Up */}
      <section id="next-up" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Continue Learning</h2>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-play text-white text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Next Lesson: Pricing Strategies That Work</h3>
                <p className="text-gray-600 text-sm mb-2">Module 2: Offer & Audience</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <i className="fa-solid fa-play mr-1"></i>
                    Video
                  </span>
                  <span>18:05</span>
                  <span>33% complete</span>
                </div>
              </div>
            </div>
            <button className="bg-primary text-white hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors">
              Continue Lesson
            </button>
          </div>
        </div>
      </section>

      {/* Study Resources */}
      <section id="study-resources" className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Study Resources</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-book text-primary text-xl"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Course Handbook</h3>
            <p className="text-gray-600 text-sm mb-4">Complete guide with all lessons, worksheets, and templates.</p>
            <button className="text-primary hover:text-primary/80 font-medium">Download PDF</button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-users text-accent text-xl"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community Forum</h3>
            <p className="text-gray-600 text-sm mb-4">Connect with fellow students and get help from instructors.</p>
            <button className="text-accent hover:text-accent/80 font-medium">Join Discussion</button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fa-solid fa-calendar text-secondary text-xl"></i>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Office Hours</h3>
            <p className="text-gray-600 text-sm mb-4">Weekly live Q&A sessions with course instructors.</p>
            <button className="text-secondary hover:text-secondary/80 font-medium">View Schedule</button>
          </div>
        </div>
      </section>

      {/* Course Statistics */}
      <section id="course-stats" className="mb-12">
        <div className="bg-gradient-to-br from-primary/5 to-purple-600/5 rounded-2xl p-8 border border-primary/10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Learning Journey</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-clock text-primary text-2xl"></i>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">2h 15m</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-check-circle text-accent text-2xl"></i>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">4</div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-trophy text-secondary text-2xl"></i>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">1</div>
              <div className="text-sm text-gray-600">Modules Completed</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-target text-purple-600 text-2xl"></i>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">88%</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section id="quick-tips" className="mb-12">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
              <i className="fa-solid fa-lightbulb text-secondary"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Study Tips for Success</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Set a Consistent Schedule</h4>
                  <p className="text-sm text-gray-600">
                    Dedicate 30-45 minutes daily for steady progress through the course.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Take Detailed Notes</h4>
                  <p className="text-sm text-gray-600">
                    Use the built-in note-taking feature to capture key insights and action items.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Apply Immediately</h4>
                  <p className="text-sm text-gray-600">
                    Implement lessons in real-time to reinforce learning and see results faster.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Engage with Community</h4>
                  <p className="text-sm text-gray-600">
                    Join discussions and ask questions to deepen your understanding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
