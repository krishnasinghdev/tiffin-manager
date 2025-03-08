import type { NextAuthConfig } from "next-auth"

export default {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [],
} satisfies NextAuthConfig
