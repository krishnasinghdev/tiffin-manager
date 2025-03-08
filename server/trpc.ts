import { initTRPC, TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import superjson from "superjson"
import { ZodError } from "zod"

import { db } from "@/server/db"
import { error_log, push_subscription } from "@/server/db/schema"
import { sendNotificationWithRetry } from "@/server/utils"
import env from "@/lib/env"
import { auth } from "@/lib/next-auth"

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()
  return {
    db,
    session,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory

export const createTRPCRouter = t.router

export function getSeverityFromError(error: TRPCError | null): "low" | "medium" | "high" | "critical" {
  if (!error) return "medium"

  switch (error.code) {
    case "INTERNAL_SERVER_ERROR":
      return "critical"
    case "FORBIDDEN":
    case "UNAUTHORIZED":
      return "high"
    case "BAD_REQUEST":
    case "PRECONDITION_FAILED":
      return "medium"
    default:
      return "low"
  }
}

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()
  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`)

  return result
})

const errorLoggingMiddleware = t.middleware(async (opts) => {
  if (env.NODE_ENV === "development") return opts.next()
  const { ctx, path } = opts
  const result = await opts.next()
  if (result.ok) return result

  const error = result.error as Error
  const trpcError = error instanceof TRPCError ? error : null

  const errorData = {
    path,
    method: opts.type,
    error_stack: error.stack,
    error_code: trpcError?.code || "UNKNOWN",
    error_message: error.message || "Unknown error",
    severity: getSeverityFromError(trpcError),
    staff_id: ctx.session?.user?.id ? parseInt(ctx.session.user.id) : null,
    request_data: opts.input ? JSON.stringify(opts.input) : null,
  }

  try {
    await ctx.db.insert(error_log).values(errorData)
    const subscriptions = await ctx.db.query.push_subscription.findMany({
      where: eq(push_subscription.staff_id, 2),
    })

    if (subscriptions.length) {
      const payload = JSON.stringify({
        timestamp: Date.now(),
        severity: errorData.severity,
        title: "🚨 Some Error. 🚨",
        body: `${errorData.error_message} (${path})`,
        url: "https://tiffin.witheb.in/private/error-logs",
      })

      await Promise.all(
        subscriptions.map(async (sub) => {
          const webpushSub = {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          }
          await sendNotificationWithRetry(webpushSub, payload)
        })
      )
    } else {
      console.log(`No push subscriptions`)
    }
  } catch (logError) {
    console.error("Failed to log error or send notifications:", logError)
  }

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware).use(errorLoggingMiddleware)

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(errorLoggingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" })
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
