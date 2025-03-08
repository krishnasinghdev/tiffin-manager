import webpush from "web-push"

import env from "@/lib/env"

webpush.setVapidDetails("mailto:singhks0054@gmail.com", env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendNotificationWithRetry(
  subscription: webpush.PushSubscription,
  payload: string,
  retries = MAX_RETRIES
): Promise<void> {
  try {
    console.log("Sending notification")
    await webpush.sendNotification(subscription, payload)
  } catch (error) {
    if (
      retries > 0 &&
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      ((error as { statusCode: number }).statusCode === 429 || (error as { statusCode: number }).statusCode >= 500)
    ) {
      await delay(RETRY_DELAY)
      return sendNotificationWithRetry(subscription, payload, retries - 1)
    }
    throw error
  }
}
