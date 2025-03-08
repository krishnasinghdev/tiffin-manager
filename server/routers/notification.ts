import { eq } from "drizzle-orm"
import webpush from "web-push"
import { z } from "zod"

import { push_subscription } from "@/server/db/schema"
import { createTRPCRouter, protectedProcedure } from "@/server/trpc"
import { sendNotificationWithRetry } from "@/server/utils"
import env from "@/lib/env"

webpush.setVapidDetails("mailto:singhks0054@gmail.com", env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY)

export const notificationRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        auth: z.string(),
        p256dh: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = ctx.session.user.id

      await ctx.db.insert(push_subscription).values({
        staff_id: Number(id),
        endpoint: input.endpoint,
        auth: input.auth,
        p256dh: input.p256dh,
      })

      return { success: true }
    }),

  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const id = ctx.session.user.id
    await ctx.db.delete(push_subscription).where(eq(push_subscription.staff_id, Number(id)))
    return { success: true }
  }),

  sendNotification: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        target_staff_id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subscriptions = await ctx.db.query.push_subscription.findMany({
        where: eq(push_subscription.staff_id, input.target_staff_id),
      })

      if (!subscriptions.length) {
        throw new Error("No subscriptions found")
      }

      const payload = JSON.stringify({
        title: "Tiffin Manager",
        body: input.message,
        timestamp: Date.now(),
        url: "https://tiffin.witheb.in/dashboard",
      })

      const errors: Error[] = []

      await Promise.all(
        subscriptions.map(async (sub) => {
          const webpushSub = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          }

          try {
            await sendNotificationWithRetry(webpushSub, payload)
          } catch (error) {
            if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
              await ctx.db.delete(push_subscription).where(eq(push_subscription.endpoint, sub.endpoint))
            }
            errors.push(error instanceof Error ? error : new Error("Unknown error occurred"))
          }
        })
      )

      if (errors.length === subscriptions.length) {
        throw new Error("Failed to send all notifications")
      }

      return { success: true, failedCount: errors.length }
    }),
})
