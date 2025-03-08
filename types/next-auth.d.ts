import "next-auth"

import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      vendor_id: number
      role?: "admin" | "staff"
      org_name: string
      access_token: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name: string
    vendor_id: number
    org_name: string
    role?: "admin" | "staff"
    access_token: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    vendor_id: number
    org_name: string
    role?: "admin" | "staff"
    access_token: string
  }
}
