import { desc, eq } from "drizzle-orm"

import { CreateNoticeSchema } from "@/types/zod"
import { notice } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const noticeRouter = createTRPCRouter({
  getNotices: protectedProcedure.query(async ({ ctx }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const notices = await ctx.db
      .select()
      .from(notice)
      .where(eq(notice.vendor_id, vendor_id))
      .orderBy(desc(notice.created_at))
      .limit(20)
    return { success: true, data: notices, message: "Notices fetched successfully" }
  }),

  createNotice: protectedProcedure.input(CreateNoticeSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const [data] = await ctx.db
      .insert(notice)
      .values({ ...input, vendor_id })
      .returning()

    if (!data) throw new Error("Notice creation failed")
    return { success: true, data, message: "Notice Added successfully" }
  }),

  updateNotice: protectedProcedure.input(CreateNoticeSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Notice id is required")

    const [data] = await ctx.db.update(notice).set(input).where(eq(notice.id, input.id)).returning()
    if (!data) throw new Error("Notice update failed")

    return { success: true, data, message: "Notice updated successfully" }
  }),
})
