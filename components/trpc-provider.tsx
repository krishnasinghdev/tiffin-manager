"use client"

import { useState } from "react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { httpBatchStreamLink, loggerLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server"
import SuperJSON from "superjson"

import { type AppRouter } from "@/server/root"
import env from "@/lib/env"
import { createQueryClient } from "@/lib/query-client"

let clientQueryClientSingleton: QueryClient | undefined = undefined
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient())
}

export const clientApi = createTRPCReact<AppRouter>()

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    clientApi.createClient({
      links: [
        loggerLink({
          enabled: (op) => env.NEXT_PUBLIC_NODE_ENV === "development" || (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers()
            headers.set("x-trpc-source", "nextjs-react")
            return headers
          },
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <clientApi.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </clientApi.Provider>
    </QueryClientProvider>
  )
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return `http://localhost:${env.PORT ?? 4000}`
}
