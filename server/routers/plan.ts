import { desc, eq } from "drizzle-orm"

import { CreatePlanSchema } from "@/types/zod"
import { plan } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const planRouter = createTRPCRouter({
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const plans = await ctx.db.select().from(plan).where(eq(plan.vendor_id, vendor_id)).orderBy(desc(plan.id))
    return { success: true, data: plans, message: "Plans fetched successfully" }
  }),

  createPlan: protectedProcedure.input(CreatePlanSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Vendor id not found")

    const [data] = await ctx.db
      .insert(plan)
      .values({ ...input, vendor_id })
      .returning()

    if (!data) throw new Error("Plan creation failed")
    return { success: true, data, message: "Plan Added successfully" }
  }),

  updatePlan: protectedProcedure.input(CreatePlanSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Plan id is required")

    const [data] = await ctx.db.update(plan).set(input).where(eq(plan.id, input.id)).returning()

    if (!data) throw new Error("Plan update failed")

    return { success: true, data, message: "Plan updated successfully" }
  }),
})
