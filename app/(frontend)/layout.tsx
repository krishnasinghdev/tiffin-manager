import "./globals.css"

import React from "react"
import type { Metadata } from "next"
import { draftMode } from "next/headers"
import Script from "next/script"

import { AdminBar } from "@/payload/components/AdminBar"
import { Footer } from "@/payload/global/footer/Component"
import { Header } from "@/payload/global/header/Component"
import { getServerSideURL, mergeOpenGraph } from "@/payload/payload-helpers"
import { HeaderThemeProvider } from "@/payload/providers/header-theme"
import { ThemeProvider } from "@/payload/providers/theme"
import { defaultTheme, themeLocalStorageKey } from "@/payload/providers/theme-types"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <>
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function getImplicitPreference() {
                var mediaQuery = '(prefers-color-scheme: dark)'
                var mql = window.matchMedia(mediaQuery)
                var hasImplicitPreference = typeof mql.matches === 'boolean'

                if (hasImplicitPreference) {
                  return mql.matches ? 'dark' : 'light'
                }

                return null
              }

              function themeIsValid(theme) {
                return theme === 'light' || theme === 'dark'
              }

              var themeToSet = '${defaultTheme}'
              var preference = window.localStorage.getItem('${themeLocalStorageKey}')

              if (themeIsValid(preference)) {
                themeToSet = preference
              } else {
                var implicitPreference = getImplicitPreference()

                if (implicitPreference) {
                  themeToSet = implicitPreference
                }
              }

              document.documentElement.setAttribute('data-theme', themeToSet)
            })();
          `,
        }}
        id="theme-script"
        strategy="beforeInteractive"
      />
      <ThemeProvider>
        <HeaderThemeProvider>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          <Header />
          {children}
          <Footer />
        </HeaderThemeProvider>
      </ThemeProvider>
    </>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: "summary_large_image",
    creator: "@payloadcms",
  },
}
