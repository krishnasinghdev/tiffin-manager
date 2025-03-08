import dayjs from "dayjs"
import { and, eq, sql } from "drizzle-orm"

import { dateSchema, idDateSchema, updateDailyAttendanceSchema, updateSingleAttendanceSchema, type dayFieldType } from "@/types/zod"
import { staff, staff_attendance } from "@/server/db/schema"
import { createTRPCRouter, protectedProcedure } from "@/server/trpc"

export const staffAttendanceRouter = createTRPCRouter({
  getDailyAttendance: protectedProcedure.input(dateSchema).query(async ({ ctx, input }) => {
    const day = dayjs(input.date).format("DD")
    const month_year = dayjs(input.date).format("YYYY-MM")
    const dayNum = parseInt(day, 10)
    if (dayNum < 1 || dayNum > 31) throw new Error("Invalid day")

    const dayColumn = `day${dayNum}` as keyof typeof staff_attendance.$inferSelect

    const data = await ctx.db
      .select({
        staff_id: staff.id,
        id: staff_attendance.id,
        staff_name: staff.name,
        staff_role: staff.staff_role,
        morning: sql<string>`SUBSTRING(COALESCE(${staff_attendance}.${sql.raw(dayColumn)}, 'AA'), 1, 1)`,
        evening: sql<string>`SUBSTRING(COALESCE(${staff_attendance}.${sql.raw(dayColumn)}, 'AA'), 2, 1)`,
      })
      .from(staff)
      .leftJoin(staff_attendance, and(eq(staff_attendance.staff_id, staff.id), eq(staff_attendance.month_year, month_year)))
      .where(eq(staff.vendor_id, ctx.session.user.vendor_id))

    return { success: true, data, message: "Attendance fetched successfully" }
  }),

  getStaffMonthAttendance: protectedProcedure.input(idDateSchema).query(async ({ ctx, input }) => {
    const { id, date } = input
    const resultArray = []
    const month_year = dayjs(date).format("YYYY-MM")
    const daysInMonth = dayjs(month_year).daysInMonth()

    const record = await ctx.db
      .select()
      .from(staff_attendance)
      .where(and(eq(staff_attendance.staff_id, id), eq(staff_attendance.month_year, month_year)))
      .limit(1)

    if (!record.length) {
      for (let i = 1; i <= daysInMonth; i++) {
        resultArray.push({
          date: `${month_year}-${i.toString().padStart(2, "0")}`,
          morning: "A",
          evening: "A",
        })
      }
    } else {
      for (let i = 1; i <= daysInMonth; i++) {
        const dayKey = `day${i}` as keyof typeof staff_attendance.$inferSelect
        const status = record[0] ? record[0][dayKey] : undefined

        const morningStatus = status && typeof status === "string" ? status[0] : "A"
        const eveningStatus = status && typeof status === "string" ? status[1] : "A"

        resultArray.push({
          date: `${month_year}-${i.toString().padStart(2, "0")}`,
          morning: morningStatus as "P" | "A" | "L",
          evening: eveningStatus as "P" | "A" | "L",
        })
      }
    }

    return { success: true, data: resultArray, message: "Attendance retrieved successfully" }
  }),

  updateDailyAttendance: protectedProcedure.input(updateDailyAttendanceSchema).mutation(async ({ ctx, input }) => {
    const { month_year, day, records } = input
    if (day < 1 || day > 31) throw new Error("Invalid day")
    const dayFieldKey = `day${day}` as dayFieldType

    await Promise.all(
      records.map(async (r) => {
        const existingRecord = await ctx.db
          .select()
          .from(staff_attendance)
          .where(and(eq(staff_attendance.staff_id, r.staff_id), eq(staff_attendance.month_year, month_year)))
          .limit(1)

        if (existingRecord.length > 0) {
          // Update existing record
          return ctx.db
            .update(staff_attendance)
            .set({ [dayFieldKey]: `${r.morning}${r.evening}` })
            .where(and(eq(staff_attendance.staff_id, r.staff_id), eq(staff_attendance.month_year, month_year)))
            .returning()
        } else {
          const value = {
            vendor_id: ctx.session.user.vendor_id,
            month_year: month_year,
            staff_id: r.staff_id,
            [dayFieldKey]: `${r.morning}${r.evening}`,
          }
          // Insert new record
          return ctx.db.insert(staff_attendance).values(value).returning()
        }
      })
    )

    const resultData = await ctx.db
      .select({
        staff_id: staff.id,
        id: staff_attendance.id,
        staff_name: staff.name,
        staff_role: staff.staff_role,
        morning: sql<string>`SUBSTRING(COALESCE(${staff_attendance}.${sql.raw(dayFieldKey)}, 'AA'), 1, 1)`,
        evening: sql<string>`SUBSTRING(COALESCE(${staff_attendance}.${sql.raw(dayFieldKey)}, 'AA'), 2, 1)`,
      })
      .from(staff)
      .leftJoin(staff_attendance, and(eq(staff_attendance.staff_id, staff.id), eq(staff_attendance.month_year, month_year)))

    return { success: true, data: resultData, message: "Attendance updated successfully" }
  }),

  updateStaffMonthAttendance: protectedProcedure.input(updateSingleAttendanceSchema).mutation(async ({ ctx, input }) => {
    const { staff_id, records, month_year } = input
    let results = []

    const existingRecord = await ctx.db
      .select()
      .from(staff_attendance)
      .where(and(eq(staff_attendance.staff_id, staff_id), eq(staff_attendance.month_year, month_year)))
      .limit(1)

    const value: Record<string, unknown> = {
      vendor_id: ctx.session.user.vendor_id,
      month_year: month_year,
      staff_id: staff_id,
    }

    records.forEach((record, i) => {
      value[`day${i + 1}`] = `${record.morning}${record.evening}`
    })

    if (existingRecord.length > 0) {
      results = await ctx.db
        .update(staff_attendance)
        .set(value)
        .where(and(eq(staff_attendance.staff_id, staff_id), eq(staff_attendance.month_year, month_year)))
        .returning()
    } else {
      results = await ctx.db
        .insert(staff_attendance)
        .values(value as typeof staff_attendance.$inferInsert)
        .returning()
    }

    // Create array of formatted daily attendance records
    const daysInMonth = dayjs(month_year).daysInMonth()
    const formattedData = []
    if (results.length === 0) {
      return { success: false, data: [], message: "Failed to update attendance" }
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `day${i}` as keyof typeof staff_attendance.$inferSelect
      const status = (results[0] && (results[0][dayKey] as string)) || "AA"

      formattedData.push({
        date: `${month_year}-${i.toString().padStart(2, "0")}`,
        morning: status[0] as "P" | "A" | "L",
        evening: status[1] as "P" | "A" | "L",
      })
    }
    return { success: true, data: formattedData, message: "Attendance updated successfully" }
  }),
})
