"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import env from "@/lib/env"
import Icons from "@/lib/icons"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function NetworkStatus() {
  const pathname = usePathname()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const isDashboardPage = pathname?.includes("/dashboard")

  useEffect(() => {
    function onOffline() {
      toast.error("You are offline", {
        duration: Infinity,
        icon: <Icons.WifiOff />,
      })
    }

    function onOnline() {
      toast.success("Back online", {
        duration: 2000,
        icon: <Icons.Wifi />,
      })
    }

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  useEffect(() => {
    if (env.NEXT_PUBLIC_NODE_ENV === "development") return
    const isPwaInstalled = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in window.navigator && window.navigator.standalone === true)
      )
    }
    setIsInstalled(isPwaInstalled())

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    const displayModeQuery = window.matchMedia("(display-mode: standalone)")
    const handleDisplayModeChange = () => {
      setIsInstalled(isPwaInstalled())
    }

    displayModeQuery.addEventListener("change", handleDisplayModeChange)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      displayModeQuery.removeEventListener("change", handleDisplayModeChange)
    }
  }, [])

  useEffect(() => {
    if (isDashboardPage && installPrompt && !isInstalled) {
      toast.message("Install our app for a better experience.", {
        duration: 10000,
        icon: <Icons.Download size={18} />,
        actionButtonStyle: { backgroundColor: "var(--color-primary)", color: "var(--color-foreground)" },
        action: {
          label: "Install",
          onClick: async () => {
            if (!installPrompt) return

            await installPrompt.prompt()
            const choiceResult = await installPrompt.userChoice

            if (choiceResult.outcome === "accepted") {
              setInstallPrompt(null)
              setIsInstalled(true)
              toast.success("App installed successfully!")
            }
          },
        },
        onDismiss: () => {},
      })
    }
  }, [isDashboardPage, installPrompt, isInstalled])

  return null
}
