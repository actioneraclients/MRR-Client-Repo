"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { shellConfig } from "./ShellConfig"
import {
  IcDashboard,
  IcSettings,
  IcMembers,
  IcPlans,
  IcCategories,
  IcComments,
  IcGroups,
  IcDirectory,
  IcEvents,
  IcCourse,
  IcEducation,
  IcServices,
  IcProducts,
  IcSupport,
  IcTools,
  IcExperts,
  IcSalesPages,
  IcBusinesses,
} from "./icons"

const iconMap: Record<string, React.ComponentType> = {
  dashboard: IcDashboard,
  settings: IcSettings,
  "sales-pages": IcSalesPages,
  members: IcMembers,
  plans: IcPlans,
  tools: IcTools,
  categories: IcCategories,
  comments: IcComments,
  groups: IcGroups,
  directory: IcDirectory,
  events: IcEvents,
  course: IcCourse,
  education: IcEducation,
  services: IcServices,
  products: IcProducts,
  support: IcSupport,
  experts: IcExperts,
  businesses: IcBusinesses,
}

const AdminNav = () => {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="p-6" aria-label="Admin navigation">
      {shellConfig.nav.map((section, sectionIndex) => (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8" : ""}>
          {section.title && (
            <h3 className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
              {section.title}
            </h3>
          )}
          <ul className="space-y-1 list-none m-0 p-0">
            {section.items.map((item) => {
              const IconComponent = item.icon ? iconMap[item.icon] : iconMap.dashboard

              const linkClassName = [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                !item.external && isActive(item.href)
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
              ].join(" ")

              return (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClassName}
                    >
                      {IconComponent && (
                        <span className="h-4 w-4 shrink-0 text-black">
                          <IconComponent />
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={linkClassName}
                      aria-current={isActive(item.href) ? "page" : undefined}
                    >
                      {IconComponent && (
                        <span className="h-4 w-4 shrink-0 text-black">
                          <IconComponent />
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export { AdminNav }
