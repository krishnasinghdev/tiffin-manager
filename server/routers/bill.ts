import dayjs from "dayjs"
import { and, between, desc, eq, gte, lte, sql } from "drizzle-orm"
import { z } from "zod"

import { CreateBillSchema, ExtimatedBillSchema, idSchema, UpdateBillSchema } from "@/types/zod"
import { bill, customer, delivery, payment, plan, vendor, type MealCountBillDetails } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const billRouter = createTRPCRouter({
  getCustomerBills: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Unauthorized access")
    if (!input.id) throw new Error("Customer id is required")

    const bills = await ctx.db
      .select()
      .from(bill)
      .where(and(eq(bill.customer_id, input.id), eq(bill.vendor_id, vendor_id)))
      .orderBy(desc(bill.created_at))
    return { success: true, data: bills, message: "Bills fetched successfully" }
  }),

  getAllBills: protectedProcedure.query(async ({ ctx }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Unauthorized access")

    const bills = await ctx.db
      .select({
        id: bill.id,
        bill_date: bill.bill_date,
        customer_name: customer.name,
        customer_phone: customer.phone,
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        customer_address: customer.address,
        payment_status: bill.payment_status,
        created_at: bill.created_at,
      })
      .from(bill)
      .leftJoin(customer, eq(bill.customer_id, customer.id))
      .where(eq(bill.vendor_id, vendor_id))
      .orderBy(desc(bill.created_at))
    return { success: true, data: bills, message: "Bills fetched successfully" }
  }),

  getBillById: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Unauthorized access")
    if (!input.id) throw new Error("Bill id is required")

    const billData = await ctx.db.transaction(async (tx) => {
      // First, get the bill and related data
      const [billBasicInfo] = await tx
        .select({
          id: bill.id,
          bill_date: bill.bill_date,
          due_date: bill.due_date,
          total_amount: bill.total_amount,
          remaining_amount: bill.remaining_amount,
          payment_status: bill.payment_status,
          created_at: bill.created_at,
          bill_detail: bill.bill_detail,
          is_closed: bill.is_closed,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_address: customer.address,
          customer_id: customer.id,
          discount: bill.discount,
          note: bill.note,
          bill_type: bill.bill_type,
          amount_paid: sql<string>`COALESCE(${bill.total_amount} - ${bill.remaining_amount}, 0)`,
          logo_url: vendor.logo_url,
          upi_id: vendor.upi_id,
          qr_code: vendor.qr_code,
          org_name: vendor.org_name,
        })
        .from(bill)
        .leftJoin(customer, eq(bill.customer_id, customer.id))
        .leftJoin(vendor, eq(bill.vendor_id, vendor.id))
        .where(and(eq(bill.id, input.id), eq(bill.vendor_id, vendor_id)))
        .limit(1)

      if (!billBasicInfo) return null

      const payments = await tx
        .select({
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_mode: payment.payment_mode,
        })
        .from(payment)
        .where(eq(payment.bill_id, input.id))
        .orderBy(desc(payment.payment_date))

      return {
        ...billBasicInfo,
        payments: payments.length > 0 ? payments : null,
      }
    })

    if (!billData) throw new Error("Bill not found")
    return { success: true, data: billData, message: "Bill fetched successfully" }
  }),

  getBillByCustomerId: protectedProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Unauthorized access")
    if (!input.id) throw new Error("Customer id is required")

    const bills = await ctx.db
      .select({
        id: bill.id,
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        payment_status: bill.payment_status,
        created_at: bill.created_at,
        bill_detail: bill.bill_detail,
      })
      .from(bill)
      .where(and(eq(bill.customer_id, input.id), eq(bill.vendor_id, vendor_id)))
      .orderBy(desc(bill.created_at))

    return { data: bills, success: true }
  }),

  getEstimatedBill: protectedProcedure.input(ExtimatedBillSchema).query(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id
    if (!vendor_id) throw new Error("Unauthorized access")
    if (!input.id) throw new Error("Customer id is required")
    const today = dayjs().format("YYYY-MM-DD")

    const [customerData] = await ctx.db
      .select({
        id: customer.id,
        name: customer.name,
        plan_price: plan.price_per_tiffin,
        total_tiffins: plan.total_tiffins,
        last_bill_date: customer.last_bill_date,
        plan_type: customer.plan_type,
        breakfast: plan.breakfast,
        lunch: plan.lunch,
        dinner: plan.dinner,
      })
      .from(customer)
      .leftJoin(plan, eq(customer.plan_id, plan.id))
      .where(and(eq(customer.id, input.id), eq(customer.vendor_id, vendor_id)))
      .limit(1)

    if (!customerData) throw new Error("Customer not found")

    if (customerData.plan_type === "random") {
      return {
        success: true,
        data: {
          customer_id: customerData.id,
          customer_name: customerData.name,
          bill_date: today,
          due_date: dayjs(today).add(7, "day").format("YYYY-MM-DD"),
          counts: null,
          end_date: null,
          start_date: null,
          total_tiffins: null,
          price_per_tiffin: null,
          addon_amount: null,
          total_amount: null,
        },
        message: "Estimated custom bill fetched",
      }
    }

    const start_date = today
    const price_per_tiffin = Number(customerData.plan_price) || 0
    const total_tiffins = customerData.total_tiffins || 0
    let frequency = 0
    if (customerData.breakfast) frequency++
    if (customerData.lunch) frequency++
    if (customerData.dinner) frequency++
    const end_date = dayjs(start_date)
      .add(total_tiffins / frequency, "day")
      .format("YYYY-MM-DD")

    const counts = {
      breakfast: (customerData.breakfast && Math.floor(total_tiffins / frequency)) || 0,
      lunch: (customerData.lunch && Math.floor(total_tiffins / frequency)) || 0,
      dinner: (customerData.dinner && Math.floor(total_tiffins / frequency)) || 0,
      custom: 0,
    }
    return {
      success: true,
      data: {
        counts,
        end_date,
        start_date,
        total_tiffins,
        bill_date: today,
        price_per_tiffin,
        addon_amount: 0,
        customer_id: customerData.id,
        customer_name: customerData.name,
        due_date: dayjs(today).add(5, "day").format("YYYY-MM-DD"),
        total_amount: (price_per_tiffin * total_tiffins).toFixed(2),
      },
      message: "Estimated subscription bill fetched",
    }
  }),

  createBill: protectedProcedure.input(CreateBillSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id

    const [customerData] = await ctx.db
      .select({
        id: customer.id,
        lunch: plan.lunch,
        dinner: plan.dinner,
        breakfast: plan.breakfast,
        plan_type: customer.plan_type,
        total_tiffins: plan.total_tiffins,
        plan_price: plan.price_per_tiffin,
        plan_id: customer.plan_id,
      })
      .from(customer)
      .leftJoin(plan, eq(customer.plan_id, plan.id))
      .where(and(eq(customer.id, input.customer_id), eq(customer.vendor_id, vendor_id)))

    if (!customerData) throw new Error("Customer not found")

    let bill_detail = {}
    let is_closed = false
    let total_tiffins = customerData.total_tiffins || 0
    let price_per_tiffin = Number(customerData.plan_price) || 0
    let total_amount = total_tiffins * price_per_tiffin
    const last_bill_date = input.bill_type === "regular" ? input.end_date : input.bill_date

    if (customerData.plan_type === "regular" && input.bill_type === "regular") {
      if (!input.start_date || !input.end_date) throw new Error("Start and end dates required for subscription")
      bill_detail = {
        start_date: input.start_date || input.bill_date,
        end_date: input.end_date || input.bill_date,
        price_per_tiffin,
        counts: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          custom: 0,
        },
        total_tiffins,
        addon_amount: 0,
        previous_addon_amount: 0,
        bill_type: "regular",
        plan_id: customerData.plan_id,
        items: null,
      }
    }
    if (customerData.plan_type === "random" && input.bill_type === "random") {
      if (!input.items || input.items.length === 0) throw new Error("Items required for custom bill")
      if (input.total_amount === input.amount_paid) {
        is_closed = true
      }
      total_amount = input.items.reduce((sum, item) => sum + item.quantity * Number(item.price), 0)
      bill_detail = {
        items: input.items,
        counts: null,
        end_date: null,
        start_date: null,
        addon_amount: null,
        total_tiffins: null,
        price_per_tiffin: null,
        previous_addon_amount: null,
      }
    }

    const amount_paid = Number(input.amount_paid || 0)
    const discount = Number(input.discount || 0)
    const remaining_amount = total_amount - amount_paid - discount
    let payment_status = remaining_amount <= 0 ? "paid" : remaining_amount < total_amount ? "partial_paid" : "unpaid"

    if (input.bill_type === "regular") {
      payment_status = "advance"
    }

    const [lastBill] = await ctx.db
      .select({ bill_no: bill.bill_no })
      .from(bill)
      .where(eq(bill.vendor_id, vendor_id))
      .orderBy(desc(bill.created_at))
      .limit(1)

    const bill_no = (lastBill?.bill_no || 0) + 1

    const [data] = await ctx.db.transaction(async (tx) => {
      const [newBill] = await tx
        .insert(bill)
        .values({
          // @ts-ignore
          vendor_id,
          bill_no,
          is_closed,
          bill_detail,
          payment_status,
          note: input.note,
          due_date: input.due_date,
          bill_date: input.bill_date,
          bill_type: input.bill_type,
          discount: discount.toFixed(2),
          customer_id: input.customer_id,
          total_amount: total_amount.toFixed(2),
          remaining_amount: remaining_amount.toFixed(2),
        })
        .returning()

      await tx.update(customer).set({ last_bill_date }).where(eq(customer.id, input.customer_id))

      if (!newBill) throw new Error("Failed to create bill")

      if (amount_paid > 0) {
        await tx.insert(payment).values({
          vendor_id,
          bill_id: newBill.id,
          payment_date: input.bill_date,
          amount: amount_paid.toFixed(2),
          customer_id: input.customer_id,
          payment_mode: input.payment_mode,
        })
      }

      return [newBill]
    })

    return { success: true, data, message: "Bill created successfully" }
  }),

  updateBill: protectedProcedure.input(UpdateBillSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id

    try {
      const [existingBill] = await ctx.db
        .select()
        .from(bill)
        .where(and(eq(bill.id, input.id), eq(bill.vendor_id, vendor_id)))

      if (!existingBill) throw new Error("Bill not found")

      let remaining_amount = Number(existingBill.remaining_amount)
      let payment_status = existingBill.payment_status
      let is_closed = existingBill.is_closed
      if (input.amount_paid) {
        if (+input.amount_paid < 0) throw new Error("Amount paid cannot be negative")
        remaining_amount = Number(existingBill.remaining_amount) - Number(input.amount_paid)
        payment_status =
          remaining_amount <= 0 ? "paid" : remaining_amount < Number(existingBill.total_amount) ? "partial_paid" : "unpaid"
      }

      if (existingBill.bill_type === "random" && remaining_amount <= 0) {
        is_closed = true
      }

      const [data] = await ctx.db
        .update(bill)
        .set({
          is_closed,
          payment_status,
          remaining_amount: remaining_amount.toFixed(2),
        })
        .where(eq(bill.id, input.id))
        .returning()

      await ctx.db.insert(payment).values({
        vendor_id,
        bill_id: existingBill.id,
        customer_id: existingBill.customer_id,
        amount: input.amount_paid,
        payment_date: input.payment_date,
        payment_mode: input.payment_mode,
      })
      return { success: true, data, message: "Bill updated successfully" }
    } catch (error) {
      throw new Error(`Failed to update bill: ${error}`)
    }
  }),

  refreshBill: protectedProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.session?.user.vendor_id) throw new Error("Unauthorized")

    const [billData] = await ctx.db.select().from(bill).where(eq(bill.id, input.id)).limit(1)
    const billDetail = billData?.bill_detail as MealCountBillDetails
    if (!billData) throw new Error("Bill not found")

    const start = dayjs(billDetail.start_date)
    const end = dayjs(billDetail.end_date)

    const deliveries = await ctx.db
      .select()
      .from(delivery)
      .where(
        and(
          eq(delivery.customer_id, billData.customer_id),
          gte(delivery.month_year, start.format("YYYY-MM")),
          lte(delivery.month_year, end.format("YYYY-MM"))
        )
      )
      .limit(1)

    const counts = deliveries.reduce(
      (acc: MealCounts, rec: DeliveryRecord) => {
        const [year, month] = rec.month_year.split("-").map(Number)
        const base = dayjs(`${year}-${month}-01`)

        for (let d = 1; d <= 31; d++) {
          const code = rec[`day${d}` as keyof DeliveryRecord] as string
          if (code?.length !== 3) continue

          const date = base.date(d)
          if (!date.isValid() || date.isBefore(start) || date.isAfter(end)) continue

          acc.b += code[0] === "P" ? 1 : 0
          acc.l += code[1] === "P" ? 1 : 0
          acc.d += code[2] === "P" ? 1 : 0
        }
        rec.add_ons?.forEach((addon: { day: number; amount: string }) => {
          const date = base.date(addon.day)
          if (date.isValid() && !date.isBefore(start) && !date.isAfter(end)) {
            const amt = Number(addon.amount) || 0
            acc.aTotal += amt
            acc.aCount += amt > 0 ? 1 : 0
          }
        })

        return acc
      },
      { b: 0, l: 0, d: 0, aTotal: 0, aCount: 0 }
    )

    const addonDiff = counts.aTotal - (billDetail.previous_addon_amount || 0)
    const totalDelivered = counts.b + counts.l + counts.d
    const total = Number(billData.total_amount) + addonDiff
    const remaining = Number(billData.remaining_amount) + addonDiff

    const updatedDetail = {
      ...billDetail,
      counts: { breakfast: counts.b, lunch: counts.l, dinner: counts.d, custom: counts.aCount },
      addon_amount: counts.aTotal,
      previous_addon_amount: counts.aTotal,
      bill_type: (billDetail.bill_type || "regular") as "regular",
      plan_id: billDetail.plan_id,
      price_per_tiffin: billDetail.price_per_tiffin || 0,
    }

    const [updated] = await ctx.db
      .update(bill)
      .set({
        bill_detail: updatedDetail,
        is_closed: updatedDetail.total_tiffins === totalDelivered && total === Number(billData.total_amount),
        total_amount: String(total),
        remaining_amount: String(remaining),
      })
      .where(eq(bill.id, input.id))
      .returning()

    return { success: true, data: updated, message: "Bill refreshed successfully" }
  }),

  deleteBill: protectedProcedure.input(idSchema).mutation(async ({ ctx, input }) => {
    const vendor_id = ctx.session?.user.vendor_id

    try {
      const [existingBill] = await ctx.db
        .select()
        .from(bill)
        .where(and(eq(bill.id, input.id), eq(bill.vendor_id, vendor_id)))

      if (!existingBill) throw new Error("Bill not found")

      await ctx.db.delete(bill).where(eq(bill.id, input.id))
      const [lastBill] = await ctx.db
        .select()
        .from(bill)
        .where(eq(bill.customer_id, existingBill.customer_id))
        .orderBy(desc(bill.created_at))
        .limit(1)

      await ctx.db
        .update(customer)
        .set({ last_bill_date: lastBill?.bill_date ? lastBill.bill_date : null })
        .where(eq(customer.id, existingBill.customer_id))

      return { success: true, message: "Bill deleted successfully" }
    } catch (error) {
      throw new Error(`Failed to delete bill: ${error}`)
    }
  }),
})

type DeliveryRecord = typeof delivery.$inferSelect
type MealCounts = { b: number; l: number; d: number; aTotal: number; aCount: number }
