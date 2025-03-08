import { desc, eq } from "drizzle-orm"

import { idSchema } from "@/types/zod"
import { error_log } from "@/server/db/schema"

import { createTRPCRouter, publicProcedure } from "../trpc"

export const logRouter = createTRPCRouter({
  getErrorLogById: publicProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const [data] = await ctx.db.select().from(error_log).where(eq(error_log.id, input.id))
    if (!data) return { success: false, message: "No error logs found" }

    return { success: true, data, message: "Vendor stats fetched successfully" }
  }),

  getAllErrorLogs: publicProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.select().from(error_log).limit(10).orderBy(desc(error_log.created_at))
    if (!data) return { success: false, message: "No error logs found" }

    return { success: true, data, message: "Vendor stats fetched successfully" }
  }),
})
