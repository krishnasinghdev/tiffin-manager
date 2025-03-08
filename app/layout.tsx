import React from "react"
import type { Metadata } from "next"
import { Noto_Sans } from "next/font/google"
import { headers } from "next/headers"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import env from "@/lib/env"
import { cn } from "@/lib/utils"
import { PostHogProvider } from "@/components/posthog-provider"
import { TailwindIndicator } from "@/components/tailwind-indicator"

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
})

export default async function TopRootLayout({ children }: { children: React.ReactNode; headers: Headers }) {
  const data = await headers()
  if (data.get("x-admin-route") === "true") return <>{children}</>

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(GeistSans.variable, GeistMono.variable, notoSans.variable, "custom-scrollbar antialiased")}>
        <PostHogProvider>{children}</PostHogProvider>
        <TailwindIndicator />
      </body>
    </html>
  )
}

const title = "Tiffin Manager"
const description = "Tiffin Manager is a complete solution that helps you manage and grow your tiffin service business."
const DOMAIN = env.NEXT_PUBLIC_SERVER_URL

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title,
  description,
  openGraph: {
    title,
    description,
    url: DOMAIN,
    siteName: title,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: DOMAIN + "/og.png",
        alt: title,
        width: 1200,
        height: 600,
      },
    ],
  },
}
