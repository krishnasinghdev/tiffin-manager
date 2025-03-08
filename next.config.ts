import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next/withPayload"

import env from "./lib/env"

const NEXT_PUBLIC_SERVER_URL = env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  : env.NEXT_PUBLIC_SERVER_URL || `http://localhost:${env.PORT ?? 4000}`

const redirects = async () => {
  const internetExplorerRedirect = {
    destination: "/ie-incompatible.html",
    has: [
      {
        type: "header",
        key: "user-agent",
        value: "(.*Trident.*)", // all ie browsers
      },
    ],
    permanent: false,
    source: "/:path((?!ie-incompatible.html$).*)", // all pages except the incompatibility page
  }

  const redirects = [internetExplorerRedirect]

  return redirects
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
      {
        hostname: "localhost",
        protocol: "http",
      },
      ...[NEXT_PUBLIC_SERVER_URL].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(":", "") as "http" | "https",
        }
      }),
    ],
  },
  experimental: {
    reactCompiler: true,
  },
  reactStrictMode: true,
  redirects,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
}

export default withPayload(nextConfig)
