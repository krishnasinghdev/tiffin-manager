import { and, desc, eq } from "drizzle-orm"

import { customerSchema, customerStatusSchema, idSchema } from "@/types/zod"
import { customer, plan } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const customerRouter = createTRPCRouter({
  getCustomerById: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Customer id is required")

    const vendor_id = ctx.session?.user.vendor_id
    const [data] = await ctx.db
      .select({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        status: customer.status,
        address: customer.address,
        plan_name: plan.plan_name,
        plan_id: customer.plan_id,
        plan_type: customer.plan_type,
        last_bill_date: customer.last_bill_date,
      })
      .from(customer)
      .leftJoin(plan, eq(customer.plan_id, plan.id))
      .where(and(eq(customer.id, input.id), eq(customer.vendor_id, vendor_id)))

    if (!data) throw new Error("Customer not found")
    return { success: true, data, message: "Customer fetched successfully" }
  }),

  getCustomers: protectedProcedure.input(customerStatusSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const customers = await ctx.db
      .select({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        plan_type: customer.plan_type,
        status: customer.status,
        last_bill_date: customer.last_bill_date,
      })
      .from(customer)
      .where(and(eq(customer.vendor_id, vendor_id), input?.status ? eq(customer.status, input.status) : undefined))
      .orderBy(desc(customer.id))

    return { success: true, data: customers, message: "Customers fetched successfully" }
  }),

  createCustomer: protectedProcedure.input(customerSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    const [data] = await ctx.db
      .insert(customer)
      .values({ ...input, vendor_id })
      .returning()

    if (!data) throw new Error("Customer creation failed")
    return { success: true, data, message: "Customer Added successfully" }
  }),

  updateCustomer: protectedProcedure.input(customerSchema).mutation(async ({ ctx, input }) => {
    if (!input.id) throw new Error("Customer id is required")

    const [data] = await ctx.db.update(customer).set(input).where(eq(customer.id, input.id)).returning()
    if (!data) throw new Error("Customer update failed")

    return { success: true, data, message: "Customer updated successfully" }
  }),
})
