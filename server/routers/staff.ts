import { and, asc, eq } from "drizzle-orm"

import { activeStatusSchema, CreateStaffSchema, idSchema } from "@/types/zod"
import { expense, staff } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const staffRouter = createTRPCRouter({
  getStaffs: protectedProcedure.input(activeStatusSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const is_active = input.is_active

    const query = eq(staff.vendor_id, vendor_id)
    const data = await ctx.db
      .select()
      .from(staff)
      .where(is_active !== undefined ? and(eq(staff.vendor_id, vendor_id), eq(staff.is_active, is_active as boolean)) : query)
      .orderBy(asc(staff.id))

    return { success: true, data, message: "Staff fetched successfully" }
  }),

  getStaffById: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Staff id is required")

    const [data] = await ctx.db
      .select({
        staff_role: staff.staff_role,
        name: staff.name,
        is_active: staff.is_active,
        phone: staff.phone,
        staff_id: staff.staff_id,
        id: staff.id,
      })
      .from(staff)
      .leftJoin(expense, eq(staff.id, expense.staff_id))
      .where(eq(staff.id, input.id))
      .orderBy(asc(expense.id))
      .limit(1)

    const salaries = await ctx.db
      .select({
        id: expense.id,
        amount: expense.amount,
        expense_id: expense.id,
        expense_date: expense.date,
      })
      .from(expense)
      .where(eq(expense.staff_id, input.id))
      .orderBy(asc(expense.id))
      .limit(10)

    return {
      success: true,
      data: {
        ...data,
        salaries,
      },
      message: "Staff fetched successfully",
    }
  }),

  createStaff: protectedProcedure.input(CreateStaffSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const [data] = await ctx.db
      .insert(staff)
      .values({ ...input, vendor_id })
      .returning()
    return { success: true, data, message: "Staff Added successfully" }
  }),

  updateStaff: protectedProcedure.input(CreateStaffSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Staff id is required")
    const updateData = { ...input } as Partial<typeof input>
    if (!input.password) {
      delete updateData.password
    }
    const [data] = await ctx.db.update(staff).set(updateData).where(eq(staff.id, input.id)).returning()

    return { success: true, data, message: "Staff updated successfully" }
  }),

  deleteStaff: protectedProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Staff id is required")

    const [data] = await ctx.db.delete(staff).where(eq(staff.id, input.id)).returning()
    return { success: true, data, message: "Staff deleted successfully" }
  }),
})
