import type { MetadataRoute } from "next"
import { APP_DESC, APP_NAME } from "lib/utils"

export default function manifest(): MetadataRoute.Manifest {
  return {
    lang: "en-US",
    id: "com.tiffin.app",
    name: APP_NAME,
    description: APP_DESC,
    short_name: "Manager",
    theme_color: "#f97316",
    background_color: "#dcdcdb",
    display: "standalone",
    start_url: "/dashboard",
    orientation: "natural",
    scope: "/",
    categories: ["food", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/images/screenshot-desktop.png",
        sizes: "1917x870",
        type: "image/png",
        form_factor: "wide",
        label: "Tiffin Dashboard on Desktop",
      },
      {
        src: "/images/screenshot-mobile.jpg",
        sizes: "865x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Tiffin App on Mobile",
      },
    ],
    protocol_handlers: [
      {
        protocol: "web+tiffin",
        url: "/custom/%s",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open the dashboard",
        url: "/dashboard",
        icons: [
          {
            src: "/icons/shortcut-dashboard.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Customers",
        short_name: "Customers",
        description: "Open the customers page",
        url: "/dashboard/customer",
        icons: [
          {
            src: "/icons/shortcut-customer.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Notice",
        short_name: "Notice",
        description: "Open the notice page",
        url: "/dashboard/notice",
        icons: [
          {
            src: "/icons/shortcut-notice.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  }
}
