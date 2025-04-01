import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const env = createEnv({
  server: {
    NODE_ENV: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    DATABASE_URL: z.string().url(),
    MONGODB_URL: z.string().url(),
    CRON_SECRET: z.string().min(1),
    VERCEL_URL: z.string().min(1),
    PAYLOAD_SECRET: z.string().min(1),
    PREVIEW_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    PORT: z.string().min(1).optional(),
    VAPID_PRIVATE_KEY: z.string().min(1),
    UPLOADTHING_TOKEN: z.string().min(1),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_NODE_ENV: z.string().min(1),
    NEXT_PUBLIC_SERVER_URL: z.string().min(1),
    NEXT_PUBLIC_VERCEL_ENV: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1),
  },
  shared: {
    NODE_ENV: z.string().min(1),
    PORT: z.string().min(1).optional(),
    NEXT_PUBLIC_VERCEL_ENV: z.string().min(1),
  },
  experimental__runtimeEnv: {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
})

export default env
