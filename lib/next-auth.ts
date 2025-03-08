// @ts-nocheck - This file is not type checked
import { cache } from "react"
import { compare } from "bcryptjs"
import { eq, or } from "drizzle-orm"
import NextAuth, { CredentialsSignin, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { db } from "../server/db"
import { staff, vendor } from "../server/db/schema"
import authConfig from "./next-auth.config"

export class InvalidUserError extends CredentialsSignin {
  code = "Invalid username!"
  cause = { message: "Invalid username!" }
}

export class InvalidCredError extends CredentialsSignin {
  code = "Invalid username/password!"
  cause = { message: "Invalid username/password!" }
}

const {
  handlers,
  signIn,
  signOut,
  auth: uncachedAuth,
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      async authorize(credentials: { user_id?: string; password?: string }) {
        if (!credentials?.user_id || !credentials?.password) return null
        const staff_id = credentials.user_id.toLowerCase()
        const user = await db
          .select({
            id: staff.id,
            name: staff.name,
            role: staff.role,
            password: staff.password,
            org_name: vendor.org_name,
            vendor_id: staff.vendor_id,
          })
          .from(staff)
          .leftJoin(vendor, eq(vendor.id, staff.vendor_id))
          .where(or(eq(staff.phone, staff_id), eq(staff.staff_id, staff_id)))
          .limit(1)

        if (user.length === 0) throw new InvalidUserError()
        const isPasswordValid = await compare(credentials.password.toString(), user[0].password)
        if (!isPasswordValid) throw new InvalidCredError()

        const token = Math.random().toString(36).substring(2)

        await db
          .update(staff)
          .set({
            access_token: token,
            access_token_expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          })
          .where(eq(staff.id, user[0].id))

        return {
          name: user[0].name,
          role: user[0].role,
          id: user[0].id.toString(),
          org_name: user[0].org_name,
          vendor_id: user[0].vendor_id,
          access_token: token,
        } as User
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.role = user.role
        token.vendor_id = user.vendor_id
        token.org_name = user.org_name
        token.access_token = user.access_token
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.org_name = token.org_name as string
        session.user.vendor_id = token.vendor_id as number
        session.user.access_token = token.access_token as string
      }

      return session
    },
  },
})

const auth = cache(uncachedAuth)

export { auth, handlers, signIn, signOut }
