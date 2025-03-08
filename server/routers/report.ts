import { between, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/server/db"
import { bill, delivery, expense, payment } from "@/server/db/schema"

import { createTRPCRouter, protectedProcedure } from "../trpc"

const TimePeriod = z.enum(["weekly", "monthly", "quarterly"])
type TimePeriod = z.infer<typeof TimePeriod>

export const reportRouter = createTRPCRouter({
  getDeliveryStats: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriod,
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { timePeriod, startDate, endDate } = input

      // Default to last 6 periods if no date range is provided
      const today = new Date()
      const defaultEndDate = endDate || today
      let defaultStartDate = startDate

      if (!defaultStartDate) {
        defaultStartDate = new Date(today)
        if (timePeriod === "weekly") {
          defaultStartDate.setDate(today.getDate() - 42) // 6 weeks
        } else if (timePeriod === "monthly") {
          defaultStartDate.setMonth(today.getMonth() - 6) // 6 months
        } else {
          defaultStartDate.setMonth(today.getMonth() - 18) // 6 quarters
        }
      }

      // Convert Date objects to ISO strings for SQL compatibility
      const startDateStr = defaultStartDate.toISOString().split("T")[0] // YYYY-MM-DD
      const endDateStr = defaultEndDate.toISOString().split("T")[0] // YYYY-MM-DD

      // Format date based on time period
      let dateFormat
      let dateLabel

      if (timePeriod === "weekly") {
        dateFormat = "YYYY-WW"
        dateLabel = "Week"
      } else if (timePeriod === "monthly") {
        dateFormat = "YYYY-MM"
        dateLabel = "Month"
      } else {
        dateFormat = "YYYY-Q"
        dateLabel = "Quarter"
      }

      // Create the SQL query based on time period
      let timeGrouping

      if (timePeriod === "weekly") {
        timeGrouping = sql`TO_CHAR(${delivery.month_year}, 'YYYY-IW')`
      } else if (timePeriod === "monthly") {
        timeGrouping = sql`TO_CHAR(${delivery.month_year}, 'YYYY-MM')`
      } else {
        timeGrouping = sql`CONCAT(EXTRACT(YEAR FROM ${delivery.month_year})::TEXT, '-', EXTRACT(QUARTER FROM ${delivery.month_year})::TEXT)`
      }

      // Fetch all delivery records within the date range
      const deliveryRecords = await ctx.db
        .select()
        .from(delivery)
        .where(sql`${delivery.month_year} BETWEEN ${startDateStr} AND ${endDateStr}`)

      // Process records to calculate stats
      const statsByPeriod: Record<
        string,
        {
          totalDeliveries: number
          breakfastCount: number
          lunchCount: number
          dinnerCount: number
          totalAddonAmount: number
        }
      > = {}

      deliveryRecords.forEach((record) => {
        const recordDate = new Date(record.month_year)
        let periodKey: string

        if (timePeriod === "weekly") {
          const year = recordDate.getFullYear()
          const week = Math.ceil((recordDate.getDate() + ((new Date(year, 0, 1).getDay() + 6) % 7)) / 7)
          periodKey = `${year}-${week.toString().padStart(2, "0")}`
        } else if (timePeriod === "monthly") {
          periodKey = `${recordDate.getFullYear()}-${(recordDate.getMonth() + 1).toString().padStart(2, "0")}`
        } else {
          const quarter = Math.ceil((recordDate.getMonth() + 1) / 3)
          periodKey = `${recordDate.getFullYear()}-${quarter}`
        }

        if (!statsByPeriod[periodKey]) {
          statsByPeriod[periodKey] = {
            totalDeliveries: 0,
            breakfastCount: 0,
            lunchCount: 0,
            dinnerCount: 0,
            totalAddonAmount: 0,
          }
        }

        const stats = statsByPeriod[periodKey]
        const daysInMonth = new Date(recordDate.getFullYear(), recordDate.getMonth() + 1, 0).getDate()

        // Process each day column (day1, day2, etc.)
        for (let day = 1; day <= daysInMonth; day++) {
          const dayField = `day${day}`
          const deliveryString = record[dayField as keyof typeof record] as string | undefined
          if (deliveryString && stats) {
            const counts = countDeliveries(deliveryString)
            stats.breakfastCount += counts.breakfast
            stats.lunchCount += counts.lunch
            stats.dinnerCount += counts.dinner
            stats.totalDeliveries += counts.breakfast + counts.lunch + counts.dinner
          }
        }

        // Add addon amount (assuming it's stored in a different field)
        if (stats) {
          record?.add_ons?.forEach((addon) => {
            stats.totalAddonAmount += Number(addon.amount) || 0
          })
        }
      })

      // Format results to match original output
      const results = Object.entries(statsByPeriod)
        .map(([timePeriod, stats]) => ({
          timePeriod,
          totalDeliveries: sql.raw(String(stats.totalDeliveries)), // Using sql.raw to match original type
          breakfastCount: sql.raw(String(stats.breakfastCount)),
          lunchCount: sql.raw(String(stats.lunchCount)),
          dinnerCount: sql.raw(String(stats.dinnerCount)),
          totalAddonAmount: sql.raw(String(stats.totalAddonAmount)),
        }))
        .sort((a, b) => a.timePeriod.localeCompare(b.timePeriod))

      return {
        data: results,
        dateLabel,
      }
    }),

  getBillStats: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriod,
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const { timePeriod, startDate, endDate } = input

      // Default to last 6 periods if no date range is provided
      const today = new Date()
      const defaultEndDate = endDate || today
      let defaultStartDate = startDate

      if (!defaultStartDate) {
        defaultStartDate = new Date(today)
        if (timePeriod === "weekly") {
          defaultStartDate.setDate(today.getDate() - 42) // 6 weeks
        } else if (timePeriod === "monthly") {
          defaultStartDate.setMonth(today.getMonth() - 6) // 6 months
        } else {
          defaultStartDate.setMonth(today.getMonth() - 18) // 6 quarters
        }
      }

      // Convert Date objects to ISO strings for SQL compatibility
      const startDateStr = defaultStartDate.toISOString()
      const endDateStr = defaultEndDate.toISOString()

      // Format date based on time period
      let dateLabel

      if (timePeriod === "weekly") {
        dateLabel = "Week"
      } else if (timePeriod === "monthly") {
        dateLabel = "Month"
      } else {
        dateLabel = "Quarter"
      }

      // Create the SQL query based on time period
      let timeGrouping

      if (timePeriod === "weekly") {
        // Format as YYYY-WW (year and week number)
        timeGrouping = sql`TO_CHAR(${bill.bill_date}, 'YYYY-IW')`
      } else if (timePeriod === "monthly") {
        // Format as YYYY-MM (year and month)
        timeGrouping = sql`TO_CHAR(${bill.bill_date}, 'YYYY-MM')`
      } else {
        // Format as YYYY-Q (year and quarter)
        timeGrouping = sql`CONCAT(EXTRACT(YEAR FROM ${bill.bill_date})::TEXT, '-', EXTRACT(QUARTER FROM ${bill.bill_date})::TEXT)`
      }

      const results = await db
        .select({
          timePeriod: timeGrouping,
          totalBilled: sql`SUM(${bill.total_amount})`,
          totalRemaining: sql`SUM(${bill.remaining_amount})`,
          totalDiscount: sql`SUM(${bill.discount})`,
          paidCount: sql`SUM(CASE WHEN ${bill.payment_status} = 'paid' THEN 1 ELSE 0 END)`,
          partialCount: sql`SUM(CASE WHEN ${bill.payment_status} = 'partial' THEN 1 ELSE 0 END)`,
          unpaidCount: sql`SUM(CASE WHEN ${bill.payment_status} = 'unpaid' THEN 1 ELSE 0 END)`,
          regularCount: sql`SUM(CASE WHEN ${bill.bill_type} = 'regular' THEN 1 ELSE 0 END)`,
          specialCount: sql`SUM(CASE WHEN ${bill.bill_type} = 'special' THEN 1 ELSE 0 END)`,
        })
        .from(bill)
        .where(sql`${bill.bill_date} BETWEEN ${startDateStr} AND ${endDateStr}`)
        .groupBy(timeGrouping)
        .orderBy(timeGrouping)

      return {
        data: results,
        dateLabel,
      }
    }),

  getPaymentStats: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriod,
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const { timePeriod, startDate, endDate } = input

      // Default to last 6 periods if no date range is provided
      const today = new Date()
      const defaultEndDate = endDate || today
      let defaultStartDate = startDate

      if (!defaultStartDate) {
        defaultStartDate = new Date(today)
        if (timePeriod === "weekly") {
          defaultStartDate.setDate(today.getDate() - 42) // 6 weeks
        } else if (timePeriod === "monthly") {
          defaultStartDate.setMonth(today.getMonth() - 6) // 6 months
        } else {
          defaultStartDate.setMonth(today.getMonth() - 18) // 6 quarters
        }
      }

      // Convert Date objects to ISO strings for SQL compatibility
      const startDateStr = defaultStartDate.toISOString()
      const endDateStr = defaultEndDate.toISOString()

      // Format date based on time period
      let dateLabel

      if (timePeriod === "weekly") {
        dateLabel = "Week"
      } else if (timePeriod === "monthly") {
        dateLabel = "Month"
      } else {
        dateLabel = "Quarter"
      }

      // Create the SQL query based on time period
      let timeGrouping

      if (timePeriod === "weekly") {
        timeGrouping = sql`TO_CHAR(${payment.payment_date}, 'YYYY-IW')`
      } else if (timePeriod === "monthly") {
        timeGrouping = sql`TO_CHAR(${payment.payment_date}, 'YYYY-MM')`
      } else {
        timeGrouping = sql`CONCAT(EXTRACT(YEAR FROM ${payment.payment_date})::TEXT, '-', EXTRACT(QUARTER FROM ${payment.payment_date})::TEXT)`
      }

      const results = await db
        .select({
          timePeriod: timeGrouping,
          totalAmount: sql`SUM(${payment.amount})`,
          cashAmount: sql`SUM(CASE WHEN ${payment.payment_mode} = 'cash' THEN ${payment.amount} ELSE 0 END)`,
          upiAmount: sql`SUM(CASE WHEN ${payment.payment_mode} = 'upi' THEN ${payment.amount} ELSE 0 END)`,
          bankAmount: sql`SUM(CASE WHEN ${payment.payment_mode} = 'bank' THEN ${payment.amount} ELSE 0 END)`,
          cardAmount: sql`SUM(CASE WHEN ${payment.payment_mode} = 'card' THEN ${payment.amount} ELSE 0 END)`,
          otherAmount: sql`SUM(CASE WHEN ${payment.payment_mode} = 'other' THEN ${payment.amount} ELSE 0 END)`,
        })
        .from(payment)
        .where(sql`${payment.payment_date} BETWEEN ${startDateStr} AND ${endDateStr}`)
        .groupBy(timeGrouping)
        .orderBy(timeGrouping)

      return {
        data: results,
        dateLabel,
      }
    }),

  getExpenseStats: protectedProcedure
    .input(
      z.object({
        timePeriod: TimePeriod,
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const { timePeriod, startDate, endDate } = input

      // Default to last 6 periods if no date range is provided
      const today = new Date()
      const defaultEndDate = endDate || today
      let defaultStartDate = startDate

      if (!defaultStartDate) {
        defaultStartDate = new Date(today)
        if (timePeriod === "weekly") {
          defaultStartDate.setDate(today.getDate() - 42) // 6 weeks
        } else if (timePeriod === "monthly") {
          defaultStartDate.setMonth(today.getMonth() - 6) // 6 months
        } else {
          defaultStartDate.setMonth(today.getMonth() - 18) // 6 quarters
        }
      }

      // Convert Date objects to ISO strings for SQL compatibility
      const startDateStr = defaultStartDate.toISOString()
      const endDateStr = defaultEndDate.toISOString()

      // Format date based on time period
      let dateLabel

      if (timePeriod === "weekly") {
        dateLabel = "Week"
      } else if (timePeriod === "monthly") {
        dateLabel = "Month"
      } else {
        dateLabel = "Quarter"
      }

      // Create the SQL query based on time period
      let timeGrouping

      if (timePeriod === "weekly") {
        timeGrouping = sql`TO_CHAR(${expense.date}, 'YYYY-IW')`
      } else if (timePeriod === "monthly") {
        timeGrouping = sql`TO_CHAR(${expense.date}, 'YYYY-MM')`
      } else {
        timeGrouping = sql`CONCAT(EXTRACT(YEAR FROM ${expense.date})::TEXT, '-', EXTRACT(QUARTER FROM ${expense.date})::TEXT)`
      }

      const results = await db
        .select({
          timePeriod: timeGrouping,
          totalAmount: sql`SUM(${expense.amount})`,
          // Assuming common expense types - adjust based on your actual types
          rentAmount: sql`SUM(CASE WHEN ${expense.type} = 'rent' THEN ${expense.amount} ELSE 0 END)`,
          salaryAmount: sql`SUM(CASE WHEN ${expense.type} = 'salary' THEN ${expense.amount} ELSE 0 END)`,
          utilityAmount: sql`SUM(CASE WHEN ${expense.type} = 'utility' THEN ${expense.amount} ELSE 0 END)`,
          suppliesAmount: sql`SUM(CASE WHEN ${expense.type} = 'supplies' THEN ${expense.amount} ELSE 0 END)`,
          maintenanceAmount: sql`SUM(CASE WHEN ${expense.type} = 'maintenance' THEN ${expense.amount} ELSE 0 END)`,
          otherAmount: sql`SUM(CASE WHEN ${expense.type} NOT IN ('rent', 'salary', 'utility', 'supplies', 'maintenance') THEN ${expense.amount} ELSE 0 END)`,
        })
        .from(expense)
        .where(sql`${expense.date} BETWEEN ${startDateStr} AND ${endDateStr}`)
        .groupBy(timeGrouping)
        .orderBy(timeGrouping)

      return {
        data: results,
        dateLabel,
      }
    }),
})

const countDeliveries = (deliveryString: string | null): { breakfast: number; lunch: number; dinner: number } => {
  if (!deliveryString || deliveryString === "AAA" || deliveryString === "HHH") {
    return { breakfast: 0, lunch: 0, dinner: 0 }
  }
  const [breakfast, lunch, dinner] = deliveryString.split("")
  return {
    breakfast: breakfast === "P" ? 1 : 0,
    lunch: lunch === "P" ? 1 : 0,
    dinner: dinner === "P" ? 1 : 0,
  }
}
