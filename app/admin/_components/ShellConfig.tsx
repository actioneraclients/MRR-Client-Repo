export type ShellItem = {
  label: string
  href: string
  icon?: string
  external?: boolean
}
export type ShellSection = { title?: string; items: ShellItem[] }

export const shellConfig: { brand: string; nav: ShellSection[] } = {
  brand: "MRR Platform Builder — Admin",
  nav: [
    {
      title: "Overview",
      items: [
        { label: "Return to Site", href: "/members/dashboard", icon: "dashboard" },
        { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Settings", href: "/admin/settings", icon: "settings" },
        { label: "Sales Pages", href: "/admin/sales-pages", icon: "sales-pages" },
        { label: "Members", href: "/admin/members", icon: "members" },
        { label: "Plans", href: "/admin/plans", icon: "plans" },
        { label: "Tools", href: "/admin/tools", icon: "tools" },
      ],
    },
    {
      title: "Community",
      items: [
        { label: "Comments", href: "/admin/comments", icon: "comments" },
        { label: "Groups", href: "/admin/groups", icon: "groups" },
        { label: "Events", href: "/admin/events", icon: "events" },
      ],
    },
    {
      title: "Site Content",
      items: [
        { label: "Masterclasses", href: "/admin/masterclasses", icon: "education" },
        { label: "Courses", href: "/admin/courses", icon: "course" },
        { label: "Categories/Tags", href: "/admin/categories", icon: "categories" },
        { label: "Content", href: "/admin/content", icon: "education" },
        { label: "Experts", href: "/admin/experts", icon: "experts" },
        { label: "Businesses", href: "/admin/businesses", icon: "businesses" },
        { label: "Products", href: "/admin/products", icon: "products" },
        { label: "Services", href: "/admin/services", icon: "services" },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Support",
          href: "http://support.mymrrplatform.com",
          icon: "support",
          external: true,
        },
      ],
    },
  ],
}
