import { asc, desc, eq, sql } from "drizzle-orm"

import { CreateExpenseSchema, pageSchema } from "@/types/zod"
import { expense, staff } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const expenseRouter = createTRPCRouter({
  getExpenses: protectedProcedure.input(pageSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, sortBy, sortOrder } = input
    const vendor_id = ctx.session?.user.vendor_id

    const offset = (page - 1) * pageSize

    const [expenses, totalCount] = await Promise.all([
      ctx.db
        .select({
          id: expense.id,
          date: expense.date,
          month_year: expense.month_year,
          amount: expense.amount,
          type: expense.type,
          note: expense.note,
          staff_id: expense.staff_id,
          staff_name: staff.name,
        })
        .from(expense)
        .where(eq(expense.vendor_id, vendor_id))
        .leftJoin(staff, eq(expense.staff_id, staff.id))
        .orderBy(desc(expense.id))
        .limit(pageSize)
        .offset(offset),

      ctx.db
        .select({ count: sql`count(*)` })
        .from(expense)
        .where(eq(expense.vendor_id, vendor_id))
        .then((result) => Number(result[0]?.count)),
    ])

    return {
      success: true,
      data: expenses,
      meta: {
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
      message: "Customers fetched successfully",
    }
  }),
  createExpense: protectedProcedure.input(CreateExpenseSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Vendor id not found")

    const [data] = await ctx.db
      .insert(expense)
      .values({
        vendor_id,
        date: input.date,
        note: input.note,
        type: input.type as any,
        staff_id: input.staff_id,
        month_year: input.month_year,
        amount: String(input.amount),
      })
      .returning()

    if (!data) throw new Error("Expense creation failed")
    return { success: true, data, message: "Expense Added successfully" }
  }),
  updateExpense: protectedProcedure.input(CreateExpenseSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Expense id is required")

    const [data] = await ctx.db
      .update(expense)
      .set({
        date: input.date,
        note: input.note,
        type: input.type as any,
        staff_id: input.staff_id,
        amount: String(input.amount),
      })
      .where(eq(expense.id, input.id))
      .returning()

    if (!data) throw new Error("Expense update failed")

    return { success: true, data, message: "Expense updated successfully" }
  }),
})
