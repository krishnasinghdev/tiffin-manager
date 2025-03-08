import { NextResponse } from "next/server"
import NextAuth from "next-auth"

import authConfig from "@/lib/next-auth.config"

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(req) {
  const url = req.nextUrl

  if (url.pathname.startsWith("/admin")) {
    const response = NextResponse.next()
    response.headers.set("x-admin-route", "true")
    return response
  }

  if (req.auth && (url.pathname.startsWith("/sign-up") || url.pathname.startsWith("/sign-in"))) {
    return NextResponse.redirect(new URL("/dashboard", url))
  }

  if (!req.auth && url.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL(`/sign-in`, url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/sign-up", "/sign-in", "/admin/:path*"],
}
