import "./globals.css"

import React from "react"
import { NuqsAdapter } from "nuqs/adapters/next/app"

import { HydrateClient } from "@/server/server"
import { Toaster } from "@/components/ui/sonner"
import { NetworkStatus } from "@/components/network-status"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCReactProvider } from "@/components/trpc-provider"

export default function TrpcLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TRPCReactProvider>
        <HydrateClient>
          <NuqsAdapter>{children}</NuqsAdapter>
        </HydrateClient>
      </TRPCReactProvider>

      <NetworkStatus />
      <Toaster position="top-right" richColors={true} />
    </ThemeProvider>
  )
}
