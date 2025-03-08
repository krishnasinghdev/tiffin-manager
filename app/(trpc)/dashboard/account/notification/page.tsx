"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import env from "@/lib/env"
import Icons from "@/lib/icons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { clientApi } from "@/components/trpc-provider"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationPage() {
  // const [message, setMessage] = useState("")
  // const [staffID, setStaffID] = useState<number>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  const createMutation = clientApi.notification.subscribe.useMutation()
  const unsubscribeMutation = clientApi.notification.unsubscribe.useMutation()
  // const sendNotificationMutation = clientApi.notification.sendNotification.useMutation()

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      checkPermissionAndRegister()
    }
  }, [])

  async function checkPermissionAndRegister() {
    const currentPermission = await Notification.requestPermission()
    setPermission(currentPermission)

    if (currentPermission === "granted") {
      await registerServiceWorker()
    }
  }

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      // Check if service worker is active
      if (registration.active) {
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
      } else {
        // Wait for service worker to activate
        registration.addEventListener("activate", async () => {
          const sub = await registration.pushManager.getSubscription()
          setSubscription(sub)
        })
      }
    } catch (error) {
      console.error("Service Worker registration failed:", error)
      toast.error("Failed to setup push notifications")
    }
  }

  async function subscribeToPush() {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      setSubscription(sub)

      await createMutation.mutateAsync({
        endpoint: sub.endpoint,
        auth: sub.getKey("auth") ? btoa(String.fromCharCode.apply(null, [...new Uint8Array(sub.getKey("auth")!)])) : "",
        p256dh: sub.getKey("p256dh") ? btoa(String.fromCharCode.apply(null, [...new Uint8Array(sub.getKey("p256dh")!)])) : "",
      })

      toast.success("Successfully subscribed to notifications")
    } catch (error) {
      console.error("Subscription failed:", error)
      toast.error("Failed to subscribe to notifications")
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsLoading(true)
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeMutation.mutateAsync()
      toast.success("Successfully unsubscribed from notifications")
    } catch (error) {
      console.error("Unsubscribe failed:", error)
      toast.error("Failed to unsubscribe from notifications")
    } finally {
      setIsLoading(false)
    }
  }

  // async function sendTestNotification() {
  //   if (!subscription || !message.trim()) return

  //   setIsLoading(true)
  //   try {
  //     setMessage("")
  //     await sendNotificationMutation.mutateAsync({ message, target_staff_id: staffID })
  //     toast.success("Notification sent successfully")
  //   } catch (error) {
  //     console.error("Send notification failed:", error)
  //     toast.error("Failed to send notification")
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <Icons.AlertTriangle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Push notifications are not supported in this browser.</AlertDescription>
      </Alert>
    )
  }

  if (permission === "denied") {
    return (
      <Alert variant="destructive">
        <Icons.AlertTriangle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Please enable notifications permission in your browser settings.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {subscription && (
          <div className="flex flex-col gap-3">
            <p className="text-green-500">You are subscribed to push notifications</p>
            {/* <div className="flex flex-col gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border px-3 py-2"
                placeholder="Enter notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <input
                type="number"
                className="flex-1 rounded-md border px-3 py-2"
                placeholder="Enter Staff ID"
                value={staffID}
                onChange={(e) => setStaffID(Number(e.target.value || 1))}
              />
              <Button onClick={sendTestNotification} disabled={isLoading || !message.trim()}>
                {isLoading ? "Sending..." : "Send Test"}
              </Button>
            </div> */}
            <Button variant="destructive" onClick={unsubscribeFromPush} disabled={isLoading}>
              {isLoading ? "Unsubscribing..." : "Unsubscribe"}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!subscription && (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">You are not subscribed to push notifications</p>
            <Button onClick={subscribeToPush} disabled={isLoading}>
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
