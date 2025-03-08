import { hash } from "bcryptjs"
import { relations } from "drizzle-orm"
import {
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

// Base columns for all tables
const defaultColumns = {
  id: serial().primaryKey().notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
}

// Token fields for staff authentication
const token = {
  access_token: varchar("access_token", { length: 512 }),
  access_token_expires: timestamp("access_token_expires", { withTimezone: true }),
  verification_token: varchar("verification_token", { length: 512 }),
  verification_token_expires: timestamp("verification_token_expires", { withTimezone: true }),
}

// Common foreign key constraints
const linkVendor = {
  vendor_id: integer("vendor_id")
    .references(() => vendor.id, { onDelete: "restrict", onUpdate: "cascade" })
    .notNull(),
}

const linkCustomer = {
  customer_id: integer("customer_id")
    .references(() => customer.id, { onDelete: "restrict", onUpdate: "cascade" })
    .notNull(),
}

const linkBill = {
  bill_id: integer("bill_id")
    .references(() => bill.id, { onDelete: "restrict", onUpdate: "cascade" })
    .notNull(),
}

const linkStaff = {
  staff_id: integer("staff_id")
    .references(() => staff.id, { onDelete: "restrict", onUpdate: "cascade" })
    .notNull(),
}

// Utility function for password hashing
export const hashPassword = (password: string) => hash(password, 10)

// Enums
export const roleEnum = pgEnum("role", ["admin", "staff"])
export const planTypeEnum = pgEnum("plan_type", ["random", "regular"])
export const paymentModeEnum = pgEnum("payment_mode", ["cash", "online"])
export const contactMethodEnum = pgEnum("contact_method", ["sms", "whatsapp"])
export const noticeEnum = pgEnum("notice_status", ["delivered", "pending", "deleted"])
export const customerStatusEnum = pgEnum("customer_status", ["active", "inactive", "left"])
export const errorSeverityEnum = pgEnum("error_severity", ["low", "medium", "high", "critical"])
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "partial_paid", "paid", "advance"])

// Type definitions for JSONB bill_detail
export type MealCountBillDetails = {
  bill_type: "regular"
  counts: {
    breakfast: number
    lunch: number
    dinner: number
    custom: number
  }
  plan_id: number
  start_date: string
  end_date: string
  total_tiffins: number
  price_per_tiffin: number
  addon_amount: number
  previous_addon_amount: number
}

export type ItemizedBillDetails = {
  bill_type: "random"
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export type BillDetails = MealCountBillDetails | ItemizedBillDetails
export type expenseType = "salary" | "rent" | "electricity" | "misc"

// Vendor related tables
export const vendor = pgTable("vendors", {
  name: varchar("name", { length: 256 }).notNull(),
  address: varchar("address", { length: 256 }).notNull(),
  service_area: varchar("service_area", { length: 128 }).array(),
  is_active: boolean("is_active").default(true).notNull(),
  phone: varchar("phone", { length: 12 }).unique().notNull(),
  org_name: varchar("org_name", { length: 256 }).notNull(),
  _id: uuid("_id").notNull().defaultRandom().unique(),
  qr_code: varchar("qr_code", { length: 256 }),
  upi_id: varchar("upi_id", { length: 56 }),
  logo_url: varchar("logo_url", { length: 256 }),
  ...defaultColumns,
})

export const staff = pgTable("staffs", {
  ...linkVendor,
  role: roleEnum().default("staff").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  phone: varchar("phone", { length: 12 }).unique().notNull(),
  staff_role: varchar("staff_role", { length: 28 }).$type<"staff" | "delivery" | "kitchen" | "manager">().notNull(),
  staff_id: varchar("staff_id", { length: 8 }).unique().notNull(),
  _id: uuid("_id").notNull().defaultRandom().unique(),
  ...token,
  ...defaultColumns,
})

export const staff_attendance = pgTable("staff_attendances", {
  ...linkVendor,
  ...linkStaff,
  month_year: char("month_year", { length: 7 }).notNull(), // "YYYY-MM"
  day1: char("day1", { length: 2 }).default("AA").notNull(),
  day2: char("day2", { length: 2 }).default("AA").notNull(),
  day3: char("day3", { length: 2 }).default("AA").notNull(),
  day4: char("day4", { length: 2 }).default("AA").notNull(),
  day5: char("day5", { length: 2 }).default("AA").notNull(),
  day6: char("day6", { length: 2 }).default("AA").notNull(),
  day7: char("day7", { length: 2 }).default("AA").notNull(),
  day8: char("day8", { length: 2 }).default("AA").notNull(),
  day9: char("day9", { length: 2 }).default("AA").notNull(),
  day10: char("day10", { length: 2 }).default("AA").notNull(),
  day11: char("day11", { length: 2 }).default("AA").notNull(),
  day12: char("day12", { length: 2 }).default("AA").notNull(),
  day13: char("day13", { length: 2 }).default("AA").notNull(),
  day14: char("day14", { length: 2 }).default("AA").notNull(),
  day15: char("day15", { length: 2 }).default("AA").notNull(),
  day16: char("day16", { length: 2 }).default("AA").notNull(),
  day17: char("day17", { length: 2 }).default("AA").notNull(),
  day18: char("day18", { length: 2 }).default("AA").notNull(),
  day19: char("day19", { length: 2 }).default("AA").notNull(),
  day20: char("day20", { length: 2 }).default("AA").notNull(),
  day21: char("day21", { length: 2 }).default("AA").notNull(),
  day22: char("day22", { length: 2 }).default("AA").notNull(),
  day23: char("day23", { length: 2 }).default("AA").notNull(),
  day24: char("day24", { length: 2 }).default("AA").notNull(),
  day25: char("day25", { length: 2 }).default("AA").notNull(),
  day26: char("day26", { length: 2 }).default("AA").notNull(),
  day27: char("day27", { length: 2 }).default("AA").notNull(),
  day28: char("day28", { length: 2 }).default("AA").notNull(),
  day29: char("day29", { length: 2 }).default("AA").notNull(),
  day30: char("day30", { length: 2 }).default("AA").notNull(),
  day31: char("day31", { length: 2 }).default("AA").notNull(),
  notes: varchar("notes", { length: 256 }),
  ...defaultColumns,
})

export const plan = pgTable("plans", {
  ...linkVendor,
  plan_name: varchar("plan_name", { length: 256 }).notNull(),
  plan_description: varchar("plan_description", { length: 256 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  lunch: boolean("lunch").default(true).notNull(),
  dinner: boolean("dinner").default(true).notNull(),
  breakfast: boolean("breakfast").default(false).notNull(),
  total_tiffins: integer("total_tiffins").notNull(),
  price_per_tiffin: numeric("price_per_tiffin", { precision: 10, scale: 2 }).notNull(),
  ...defaultColumns,
})

export const notice = pgTable("notices", {
  ...linkVendor,
  date: varchar("date", { length: 16 }).notNull(),
  time: varchar("time", { length: 16 }).notNull(),
  status: noticeEnum().default("pending").notNull(),
  detail: varchar("detail", { length: 256 }).notNull(),
  ...defaultColumns,
})

export const expense = pgTable("expenses", {
  date: date("date").notNull(),
  month_year: varchar("month_year", { length: 7 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 28 }).$type<expenseType>().notNull(),
  note: varchar("note", { length: 256 }),
  staff_id: integer("staff_id").references(() => staff.id, { onDelete: "restrict", onUpdate: "cascade" }),
  ...linkVendor,
  ...defaultColumns,
})

// Customer related tables
export const customer = pgTable("customers", {
  ...linkVendor,
  name: varchar("name", { length: 256 }).notNull(),
  address: varchar("address", { length: 256 }).notNull(),
  status: customerStatusEnum().default("active").notNull(),
  phone: varchar("phone", { length: 12 }).unique().notNull(),
  plan_type: planTypeEnum().default("regular").notNull(),
  _id: uuid("_id").notNull().defaultRandom().unique(),
  last_bill_date: date("last_bill_date"),
  contact_method: contactMethodEnum().default("whatsapp").notNull(),
  plan_id: integer("plan_id").references(() => plan.id, { onDelete: "restrict", onUpdate: "cascade" }),
  ...defaultColumns,
})

export const delivery = pgTable("deliveries", {
  ...linkCustomer,
  month_year: char("month_year", { length: 7 }).notNull(),
  day1: char("day1", { length: 3 }).default("AAA").notNull(),
  day2: char("day2", { length: 3 }).default("AAA").notNull(),
  day3: char("day3", { length: 3 }).default("AAA").notNull(),
  day4: char("day4", { length: 3 }).default("AAA").notNull(),
  day5: char("day5", { length: 3 }).default("AAA").notNull(),
  day6: char("day6", { length: 3 }).default("AAA").notNull(),
  day7: char("day7", { length: 3 }).default("AAA").notNull(),
  day8: char("day8", { length: 3 }).default("AAA").notNull(),
  day9: char("day9", { length: 3 }).default("AAA").notNull(),
  day10: char("day10", { length: 3 }).default("AAA").notNull(),
  day11: char("day11", { length: 3 }).default("AAA").notNull(),
  day12: char("day12", { length: 3 }).default("AAA").notNull(),
  day13: char("day13", { length: 3 }).default("AAA").notNull(),
  day14: char("day14", { length: 3 }).default("AAA").notNull(),
  day15: char("day15", { length: 3 }).default("AAA").notNull(),
  day16: char("day16", { length: 3 }).default("AAA").notNull(),
  day17: char("day17", { length: 3 }).default("AAA").notNull(),
  day18: char("day18", { length: 3 }).default("AAA").notNull(),
  day19: char("day19", { length: 3 }).default("AAA").notNull(),
  day20: char("day20", { length: 3 }).default("AAA").notNull(),
  day21: char("day21", { length: 3 }).default("AAA").notNull(),
  day22: char("day22", { length: 3 }).default("AAA").notNull(),
  day23: char("day23", { length: 3 }).default("AAA").notNull(),
  day24: char("day24", { length: 3 }).default("AAA").notNull(),
  day25: char("day25", { length: 3 }).default("AAA").notNull(),
  day26: char("day26", { length: 3 }).default("AAA").notNull(),
  day27: char("day27", { length: 3 }).default("AAA").notNull(),
  day28: char("day28", { length: 3 }).default("AAA").notNull(),
  day29: char("day29", { length: 3 }).default("AAA").notNull(),
  day30: char("day30", { length: 3 }).default("AAA").notNull(),
  day31: char("day31", { length: 3 }).default("AAA").notNull(),
  add_ons: jsonb("add_ons").$type<
    Array<{
      day: number
      amount: string
      detail: string
    }>
  >(),
  ...defaultColumns,
})

export const bill = pgTable("bills", {
  ...defaultColumns,
  ...linkVendor,
  ...linkCustomer,
  due_date: date("due_date").notNull(),
  bill_date: date("bill_date").notNull(),
  bill_no: integer("bill_no").notNull(),
  bill_type: planTypeEnum().default("regular").notNull(),
  payment_status: paymentStatusEnum().default("unpaid").notNull(),
  bill_detail: jsonb("bill_detail").$type<BillDetails>().notNull(),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  remaining_amount: numeric("remaining_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  note: varchar("note", { length: 256 }),
  is_closed: boolean("is_closed").default(false).notNull(),
})

export const payment = pgTable("payments", {
  ...linkVendor,
  ...linkCustomer,
  bill_id: integer("bill_id")
    .references(() => bill.id, { onDelete: "cascade", onUpdate: "cascade" })
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payment_date: date("payment_date").notNull(),
  payment_mode: paymentModeEnum().notNull(),
  ...defaultColumns,
})

// Logs and subscriptions
export const push_subscription = pgTable("push_subscriptions", {
  endpoint: varchar("endpoint", { length: 256 }).notNull().unique(),
  auth: varchar("auth", { length: 256 }).notNull(),
  p256dh: varchar("p256dh", { length: 256 }).notNull(),
  staff_id: integer("staff_id")
    .references(() => staff.id, { onDelete: "cascade" })
    .notNull(),
  ...defaultColumns,
})

export const error_log = pgTable("error_logs", {
  staff_id: integer("staff_id").references(() => staff.id, { onDelete: "set null", onUpdate: "cascade" }),
  error_message: varchar("error_message", { length: 256 }).notNull(),
  error_stack: text("error_stack"),
  error_code: varchar("error_code", { length: 50 }),
  path: varchar("path", { length: 256 }),
  method: varchar("method", { length: 10 }),
  severity: errorSeverityEnum().default("medium").notNull(),
  request_data: jsonb("request_data"),
  resolved: boolean("resolved").default(false).notNull(),
  ...defaultColumns,
})

// Improved Relations
export const vendorRelations = relations(vendor, ({ many }) => ({
  bills: many(bill),
  plans: many(plan),
  staff: many(staff),
  notices: many(notice),
  payments: many(payment),
  customers: many(customer),
  staff_attendances: many(staff_attendance),
  expenses: many(expense),
}))

export const staffRelations = relations(staff, ({ one, many }) => ({
  vendor: one(vendor, { fields: [staff.vendor_id], references: [vendor.id] }),
  staff_attendance: many(staff_attendance),
  expenses: many(expense),
  push_subscriptions: many(push_subscription),
  error_logs: many(error_log),
}))

export const staffAttendanceRelations = relations(staff_attendance, ({ one }) => ({
  staff: one(staff, {
    fields: [staff_attendance.staff_id],
    references: [staff.id],
  }),
  vendor: one(vendor, {
    fields: [staff_attendance.vendor_id],
    references: [vendor.id],
  }),
}))

export const planRelations = relations(plan, ({ one, many }) => ({
  vendor: one(vendor, { fields: [plan.vendor_id], references: [vendor.id] }),
  customers: many(customer),
}))

export const noticeRelations = relations(notice, ({ one }) => ({
  vendor: one(vendor, { fields: [notice.vendor_id], references: [vendor.id] }),
}))

export const customerRelations = relations(customer, ({ one, many }) => ({
  vendor: one(vendor, { fields: [customer.vendor_id], references: [vendor.id] }),
  plan: one(plan, { fields: [customer.plan_id], references: [plan.id] }),
  bills: many(bill),
  deliveries: many(delivery),
  payments: many(payment),
}))

export const deliveryRelations = relations(delivery, ({ one }) => ({
  customer: one(customer, { fields: [delivery.customer_id], references: [customer.id] }),
}))

export const billRelations = relations(bill, ({ one, many }) => ({
  vendor: one(vendor, { fields: [bill.vendor_id], references: [vendor.id] }),
  customer: one(customer, { fields: [bill.customer_id], references: [customer.id] }),
  payments: many(payment),
}))

export const paymentRelations = relations(payment, ({ one }) => ({
  vendor: one(vendor, { fields: [payment.vendor_id], references: [vendor.id] }),
  customer: one(customer, { fields: [payment.customer_id], references: [customer.id] }),
  bill: one(bill, { fields: [payment.bill_id], references: [bill.id] }),
}))

export const pushSubscriptionRelations = relations(push_subscription, ({ one }) => ({
  staff: one(staff, {
    fields: [push_subscription.staff_id],
    references: [staff.id],
  }),
}))

export const errorLogRelations = relations(error_log, ({ one }) => ({
  staff: one(staff, {
    fields: [error_log.staff_id],
    references: [staff.id],
  }),
}))

export const expenseRelations = relations(expense, ({ one }) => ({
  vendor: one(vendor, {
    fields: [expense.vendor_id],
    references: [vendor.id],
  }),
  staff: one(staff, {
    fields: [expense.staff_id],
    references: [staff.id],
  }),
}))
