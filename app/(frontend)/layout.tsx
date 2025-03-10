import "./globals.css"

import React from "react"
import type { Metadata } from "next"
import Script from "next/script"

import { Footer } from "@/payload/global/footer/footer"
import { Header } from "@/payload/global/header/header"
import { getServerSideURL, mergeOpenGraph } from "@/payload/payload-helpers"
import { ThemeProvider } from "@/payload/providers/theme"
import { defaultTheme, themeLocalStorageKey } from "@/payload/providers/theme-types"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Header />
        {children}
        <Footer />
      </ThemeProvider>
    </>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
