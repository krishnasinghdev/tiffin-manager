import { eq } from "drizzle-orm"

import { bill, customer, staff, vendor } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const vendorRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const vendor_id = ctx.session?.user.vendor_id

    const customers = await ctx.db.select().from(customer).where(eq(customer.vendor_id, vendor_id))
    const bills = await ctx.db.select().from(bill).where(eq(bill.vendor_id, vendor_id))
    const staffs = await ctx.db.select().from(staff).where(eq(staff.id, vendor_id))

    const data = {
      customers: customers.length || 0,
      staffs: staffs.length || 0,
      bills: bills.length || 0,
    }
    return { success: true, data, message: "Vendor stats fetched successfully" }
  }),
})
