import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import AuthProvider from "@/components/AuthProvider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  const { data: settings } = await supabase
    .from("site_settings")
    .select("site_title, meta_description, favicon_url, social_image_url")
    .single()

  const title = settings?.site_title ?? "Community Platform"
  const description = settings?.meta_description ?? "Welcome to our community"
  const favicon = settings?.favicon_url ?? "/favicon.ico"
  const socialImage = settings?.social_image_url ?? undefined

  return {
    title,
    description,
    icons: {
      icon: favicon,
    },
    openGraph: {
      title,
      description,
      images: socialImage ? [{ url: socialImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImage ? [socialImage] : [],
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 font-[Inter] antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
