import dayjs from "dayjs"
import { and, desc, eq, sql } from "drizzle-orm"
import { custom } from "zod"

import {
  AddonSchema,
  dayFieldType,
  GetMonthDeliverySchema,
  pageSchema,
  UpdateDeliverySchema,
  UpdateMonthDeliverySchema,
} from "@/types/zod"
import { customer, delivery, vendor } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

export const deliveryRouter = createTRPCRouter({
  getDailyDeliveries: protectedProcedure.input(pageSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, sortOrder } = input
    const vendor_id = ctx.session?.user.vendor_id
    const day = dayjs(input.date).format("DD")
    const month_year = dayjs(input.date).format("YYYY-MM")
    const dayNum = parseInt(day, 10)
    if (dayNum < 1 || dayNum > 31) throw new Error("Invalid day")

    const dayColumn = `day${dayNum}` as dayFieldType
    const offset = (page - 1) * pageSize

    const [deliveries, totalCount] = await Promise.all([
      ctx.db
        .select({
          id: delivery.id,
          name: customer.name,
          customer_id: customer.id,
          address: customer.address,
          breakfast: sql<string>`COALESCE(SUBSTRING(COALESCE(${delivery}.${sql.raw(dayColumn)}, 'AAA'), 1, 1), '')`,
          lunch: sql<string>`COALESCE(SUBSTRING(COALESCE(${delivery}.${sql.raw(dayColumn)}, 'AAA'), 2, 1), '')`,
          dinner: sql<string>`COALESCE(SUBSTRING(COALESCE(${delivery}.${sql.raw(dayColumn)}, 'AAA'), 3, 1), '')`,
          addon_amount: sql<string>`
        COALESCE(
          (SELECT jsonb_agg(e->'amount') FROM
          jsonb_array_elements(${delivery}.add_ons) e
           WHERE (e->>'day')::int = ${dayNum}
          ),
          ''::jsonb
        )::text
        `,
          addon_detail: sql<string>`
        COALESCE(
          (SELECT jsonb_agg(e->'detail') FROM
          jsonb_array_elements(${delivery}.add_ons) e
           WHERE (e->>'day')::int = ${dayNum}
          ),
          ''::jsonb
        )::text
        `,
        })
        .from(customer)
        .leftJoin(delivery, and(eq(delivery.customer_id, customer.id), eq(delivery.month_year, month_year)))
        .where(and(eq(customer.vendor_id, vendor_id), eq(customer.status, "active")))
        .orderBy((aliases) => (sortOrder === "asc" ? aliases.name : desc(aliases.name)))
        .limit(pageSize)
        .offset(offset),

      ctx.db
        .select({ count: sql`count(*)` })
        .from(customer)
        .where(and(eq(customer.vendor_id, vendor_id), eq(customer.status, "active")))
        .then((result) => Number(result[0]?.count)),
    ])

    return {
      success: true,
      data: deliveries,
      meta: {
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize),
        currentPage: page,
        pageSize,
      },
      message: "Customers fetched successfully",
    }
  }),

  getCustomerMonthDeliveries: protectedProcedure.input(GetMonthDeliverySchema).query(async ({ ctx, input }) => {
    const { month, customer_id } = input
    const resultArray = []
    const month_year = dayjs(month, "MM-YYYY").format("YYYY-MM")
    const daysInMonth = dayjs(month, "MM-YYYY").daysInMonth()

    const [customerData] = await ctx.db
      .select({
        customer_name: customer.name,
        customer_id: customer.id,
        logo_url: vendor.logo_url,
      })
      .from(customer)
      .leftJoin(vendor, eq(vendor.id, customer.vendor_id))
      .where(eq(customer.id, customer_id))
      .limit(1)

    if (!customerData) throw new Error("Customer not found")

    let [record] = await ctx.db
      .select()
      .from(delivery)
      .where(and(eq(delivery.customer_id, customer_id), eq(delivery.month_year, month_year)))
      .limit(1)

    if (!record) {
      const [data] = await ctx.db
        .insert(delivery)
        .values({
          month_year,
          customer_id,
        })
        .returning()
      record = data
    }
    if (!record) throw new Error("Delivery not found")

    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `day${i}` as keyof typeof delivery.$inferSelect
      const status = record ? record[dayKey] : undefined

      const breakfast = status && typeof status === "string" ? status[0] : "A"
      const lunch = status && typeof status === "string" ? status[1] : "A"
      const dinner = status && typeof status === "string" ? status[2] : "A"

      // Find any add-on for this day
      const addon = record?.add_ons?.find((a: any) => Number(a.day) === i) || null

      resultArray.push({
        date: `${month_year}-${i.toString().padStart(2, "0")}`,
        breakfast: breakfast as "P" | "A" | "L",
        lunch: lunch as "P" | "A" | "L",
        dinner: dinner as "P" | "A" | "L",
        addon_amount: addon ? addon.amount : "",
        addon_detail: addon ? addon.detail : "",
      })
    }

    return {
      success: true,
      data: {
        delivery_id: record.id,
        deliveries: resultArray,
        logo_url: customerData.logo_url,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
      },
      message: "Customer deliveries fetched successfully",
    }
  }),

  updateDailyDeliveries: protectedProcedure.input(UpdateDeliverySchema).mutation(async ({ ctx, input }) => {
    const { month_year, day, records } = input
    if (day < 1 || day > 31) throw new Error("Invalid day")
    const dayFieldKey = `day${day}` as dayFieldType

    await Promise.all(
      records.map(async (r) => {
        const existingRecord = await ctx.db
          .select()
          .from(delivery)
          .where(and(eq(delivery.customer_id, r.customer_id), eq(delivery.month_year, month_year)))
          .limit(1)

        if (existingRecord.length > 0) {
          // Update existing record
          return ctx.db
            .update(delivery)
            .set({ [dayFieldKey]: `${r.breakfast}${r.lunch}${r.dinner}` }) // Fixed dinner - was using lunch twice
            .where(and(eq(delivery.customer_id, r.customer_id), eq(delivery.month_year, month_year)))
            .returning()
        } else {
          const value = {
            vendor_id: ctx.session.user.vendor_id,
            month_year: month_year,
            customer_id: r.customer_id,
            [dayFieldKey]: `${r.breakfast}${r.lunch}${r.dinner}`, // Fixed dinner - was using lunch twice
          }
          // Insert new record
          return ctx.db.insert(delivery).values(value).returning()
        }
      })
    )

    const resultData = await ctx.db
      .select({
        customer_id: customer.id,
        id: delivery.id,
        customer_name: customer.name,
        breakfast: sql<string>`SUBSTRING(COALESCE(${delivery}.${sql.raw(dayFieldKey)}, 'AAA'), 1, 1)`,
        lunch: sql<string>`SUBSTRING(COALESCE(${delivery}.${sql.raw(dayFieldKey)}, 'AAA'), 2, 1)`,
        dinner: sql<string>`SUBSTRING(COALESCE(${delivery}.${sql.raw(dayFieldKey)}, 'AAA'), 3, 1)`,
      })
      .from(customer)
      .leftJoin(delivery, and(eq(delivery.customer_id, customer.id), eq(delivery.month_year, month_year)))

    return { success: true, data: resultData, message: "Deliveries updated successfully" }
  }),

  updateMonthDeliveries: protectedProcedure.input(UpdateMonthDeliverySchema).mutation(async ({ ctx, input }) => {
    const { month_year, records, customer_id } = input
    if (!customer_id) throw new Error("Customer ID is required")

    const existingRecord = await ctx.db
      .select()
      .from(delivery)
      .where(and(eq(delivery.customer_id, customer_id), eq(delivery.month_year, month_year)))
      .limit(1)

    if (existingRecord.length > 0) {
      await ctx.db
        .update(delivery)
        .set(records)
        .where(and(eq(delivery.customer_id, customer_id), eq(delivery.month_year, month_year)))
    } else {
      const insertValues = {
        vendor_id: ctx.session.user.vendor_id,
        month_year,
        customer_id,
        ...records,
      }
      await ctx.db.insert(delivery).values(insertValues)
    }

    return { success: true, message: "Deliveries updated  successfully" }
  }),

  updateAddon: protectedProcedure.input(AddonSchema).mutation(async ({ ctx, input }) => {
    const { date, addon_amount, addon_detail, delivery_id } = input
    if (delivery_id == 0) throw new Error("Delivery ID is required")
    const dateObj = dayjs(date)
    const day = dateObj.date()
    const addonObject = { day, amount: addon_amount.toString(), detail: addon_detail || "" }

    const [existingRecord] = await ctx.db.select().from(delivery).where(eq(delivery.id, delivery_id)).limit(1)
    if (!existingRecord) throw new Error("Record not found")

    let addonDetails = (existingRecord.add_ons as any[]) || []
    if (addonObject) addonDetails = addonDetails.filter((a) => Number(a.day) !== day)

    addonDetails.push(addonObject)

    await ctx.db.update(delivery).set({ add_ons: addonDetails }).where(eq(delivery.id, existingRecord.id))

    return { success: true, message: addonObject ? "Addon updated successfully" : "Addon removed successfully" }
  }),
})
