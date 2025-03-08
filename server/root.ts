import { createCallerFactory, createTRPCRouter } from "@/server/trpc"

import { authRouter } from "./routers/auth"
import { billRouter } from "./routers/bill"
import { customerRouter } from "./routers/customer"
import { deliveryRouter } from "./routers/delivery"
import { expenseRouter } from "./routers/expense"
import { logRouter } from "./routers/log"
import { noticeRouter } from "./routers/notice"
import { notificationRouter } from "./routers/notification"
import { planRouter } from "./routers/plan"
import { reportRouter } from "./routers/report"
import { staffRouter } from "./routers/staff"
import { staffAttendanceRouter } from "./routers/staff_attendance"
import { vendorRouter } from "./routers/vendor"

export const appRouter = createTRPCRouter({
  log: logRouter,
  auth: authRouter,
  bill: billRouter,
  plan: planRouter,
  staff: staffRouter,
  notice: noticeRouter,
  vendor: vendorRouter,
  report: reportRouter,
  expense: expenseRouter,
  customer: customerRouter,
  delivery: deliveryRouter,
  notification: notificationRouter,
  staffattendance: staffAttendanceRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
