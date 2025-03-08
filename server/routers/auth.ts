import { eq } from "drizzle-orm"
import { z } from "zod"

import { EditVendorSchema, SignUpSchema } from "@/types/zod"

import { hashPassword, staff, vendor } from "../db/schema"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"

export const authRouter = createTRPCRouter({
  hello: publicProcedure.input(z.object({ text: z.string() })).query(({ input }) => {
    return {
      greeting: `Hello ${input.text}`,
    }
  }),

  signUp: publicProcedure.input(SignUpSchema).mutation(async ({ ctx, input }) => {
    const { name, org_name, password, phone, address } = input

    const existingUser = await ctx.db.select().from(staff).where(eq(staff.phone, phone)).limit(1)
    if (existingUser.length) return { success: false, error: "User already exists" }

    const [vendor_res] = await ctx.db
      .insert(vendor)
      .values({
        name,
        phone,
        address,
        org_name,
      })
      .returning()
    if (!vendor_res) throw new Error("Vendor creation failed")

    const newPassword = await hashPassword(password)
    await ctx.db.insert(staff).values({
      name,
      phone,
      role: "admin",
      staff_role: "manager",
      password: newPassword,
      vendor_id: vendor_res.id,
      staff_id: (org_name.slice(0, 3) + name.slice(0, 2) + "01").toLowerCase(),
    })

    return { success: true }
  }),

  getVendor: protectedProcedure.query(async ({ ctx }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Vendor id not found")
    const data = await ctx.db.select().from(vendor).where(eq(vendor.id, vendor_id)).limit(1)
    return { success: true, data: data[0] }
  }),

  updateVendor: protectedProcedure.input(EditVendorSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Vendor id not found")

    const [updated] = await ctx.db.update(vendor).set(input).where(eq(vendor.id, input.id)).returning()

    if (!updated) throw new Error("Update failed")
    return { success: true, message: "Vendor updated successfully", data: updated }
  }),
})
