import { z } from "zod"

import { dateUtils } from "@/lib/utils"

const idField = z.coerce.number({ required_error: "ID is required" }).min(1, "ID must be positive")

export const date_schema = z
  .string({ required_error: "Date is required" })
  .transform((date) => dateUtils.toDBFormat(date))
  .refine((val) => val !== undefined, "Invalid date format")

const baseFinancialField = z.preprocess(
  (val) => (val === undefined || val === null ? undefined : String(val)),
  z
    .string()
    .optional()
    .refine((val) => val === undefined || !isNaN(Number(val)), "Amount must be a valid number")
    .refine((val) => val === undefined || Number(val) >= 0, "Amount cannot be negative")
)

const requiredFinancialField = baseFinancialField.refine((val) => val !== undefined, "Amount is required")

export const idSchema = z.object({
  id: idField,
})

export const idDateSchema = z.object({
  id: idField,
  date: date_schema,
})

export const activeStatusSchema = z.object({
  is_active: z.boolean().optional(),
})

export const customerStatusSchema = z
  .object({
    status: z.enum(["active", "inactive", "left"], {
      required_error: "Status is required",
      invalid_type_error: "Invalid status",
    }),
  })
  .optional()

export const dateSchema = z.object({
  date: date_schema,
})

export const pageSchema = z.object({
  date: date_schema,
  page: z.coerce.number({ required_error: "Page is required" }).min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce.number({ required_error: "Page size is required" }).min(1, "Page size must be at least 1").default(10),
  sortBy: z.string({ required_error: "Sort by is required" }).default("name"),
  sortOrder: z
    .enum(["asc", "desc"], {
      required_error: "Sort order is required",
      invalid_type_error: "Sort order must be 'asc' or 'desc'",
    })
    .default("asc"),
  offset: z.coerce.number({ required_error: "Offset is required" }).min(1, "Offset must be at least 1").default(1),
  limit: z.coerce.number({ required_error: "Limit is required" }).min(1, "Limit must be at least 1").default(10),
})

export const customerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be 2+ characters")
    .max(40, "Name must be 40 characters or less"),
  phone: z.coerce.string({ required_error: "Phone is required" }).length(10, "Phone must be exactly 10 digits"),
  address: z
    .string({ required_error: "Address is required" })
    .min(10, "Address must be 10+ characters")
    .max(120, "Address must be 120 characters or less"),
  status: z
    .enum(["active", "inactive", "left"], {
      required_error: "Status is required",
      invalid_type_error: "Invalid status",
    })
    .default("active"),
  plan_type: z
    .enum(["regular", "random"], {
      required_error: "Plan type is required",
      invalid_type_error: "Invalid plan type",
    })
    .default("regular"),
  plan_id: idField.optional(),
  id: idField.optional(),
})

export const SignUpSchema = z
  .object({
    name: z.string({ required_error: "Name is required" }).min(2, "Name must be 2+ characters"),
    address: z.string({ required_error: "Address is required" }).min(10, "Address must be 10+ characters"),
    org_name: z.string({ required_error: "Organization name is required" }).min(2, "Organization name must be 2+ characters"),
    phone: z.coerce.string({ required_error: "Phone is required" }).length(10, "Phone must be exactly 10 digits"),
    password: z.string({ required_error: "Password is required" }).min(6, "Password must be 6+ characters"),
    cpassword: z.string({ required_error: "Confirm password is required" }).min(6, "Confirm password must be 6+ characters"),
    service_area: z.array(z.string(), { required_error: "Service area is required" }).min(1, "At least one service area required"),
  })
  .refine((data) => data.password === data.cpassword, {
    message: "Passwords must match",
    path: ["cpassword"],
  })

export const CreatePlanSchema = z.object({
  id: idField.optional(),
  plan_name: z.string({ required_error: "Plan name is required" }).min(2, "Plan name must be 2+ characters"),
  is_active: z.boolean({ required_error: "Active status is required" }).default(true),
  breakfast: z.boolean({ required_error: "Breakfast selection is required" }).default(false),
  lunch: z.boolean({ required_error: "Lunch selection is required" }).default(false),
  dinner: z.boolean({ required_error: "Dinner selection is required" }).default(false),
  total_tiffins: z.coerce.number({ required_error: "Total tiffins is required" }).min(1, "Total tiffins must be at least 1"),
  plan_description: z.string({ required_error: "Description is required" }).min(5, "Description must be 5+ characters"),
  price_per_tiffin: requiredFinancialField,
})

export const CreateNoticeSchema = z.object({
  id: idField.optional(),
  date: date_schema,
  time: z.string({ required_error: "Time is required" }).min(1, "Time is required"),
  detail: z.string({ required_error: "Detail is required" }).min(10, "Detail must be 10+ characters"),
  status: z
    .enum(["pending", "delivered", "deleted"], {
      required_error: "Status is required",
      invalid_type_error: "Invalid status",
    })
    .default("pending"),
})

export const CreateStaffSchema = z.object({
  id: idField.optional(),
  is_active: z.boolean({ required_error: "Active status is required" }).default(true),
  name: z.string({ required_error: "Name is required" }).min(2, "Name must be 2+ characters"),
  staff_role: z
    .enum(["staff", "delivery", "kitchen", "manager"], {
      required_error: "Role is required",
      invalid_type_error: "Invalid role",
    })
    .default("staff"),
  password: z
    .string({ required_error: "Password is required" })
    .refine((val) => val === "" || val.length >= 6, "Password must be 6+ characters if provided"),
  phone: z.coerce.string({ required_error: "Phone is required" }).length(10, "Phone must be exactly 10 digits"),
  staff_id: z
    .string({ required_error: "Staff ID is required" })
    .min(6, "Staff ID must be 6-8 characters")
    .max(8, "Staff ID must be 6-8 characters"),
})

export const UpdateDeliverySchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  day: z.coerce.number().int().min(1).max(31),
  records: z.array(
    z.object({
      customer_id: z.number().int().positive(),
      breakfast: z.string().regex(/^[PA]{1}$/),
      dinner: z.string().regex(/^[PA]{1}$/),
      lunch: z.string().regex(/^[PA]{1}$/),
    })
  ),
})

export const UpdateMonthDeliverySchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  day: z.coerce.number().int().min(1).max(31),
  customer_id: z.coerce.number().int().positive().optional(),
  records: z.record(z.string().regex(/^day([1-9]|[12][0-9]|3[01])$/), z.string().regex(/^[PA]{3}$/)),
})

export const AddonSchema = z.object({
  date: date_schema,
  delivery_id: idField,
  addon_detail: z
    .string({ required_error: "Addon detail is required" })
    .min(5, "Detail must be 5+ characters")
    .max(128, "Detail must be 128 characters or less"),
  addon_amount: requiredFinancialField,
})

export const CreateBillSchema = z
  .object({
    customer_id: idField,
    bill_date: date_schema,
    bill_type: z.enum(["regular", "random"], {
      required_error: "Bill type is required",
      invalid_type_error: "Invalid bill type",
    }),
    due_date: date_schema,
    total_amount: requiredFinancialField,
    discount: baseFinancialField.default("0"),
    payment_mode: z.enum(["cash", "online"], {
      required_error: "Payment mode is required",
      invalid_type_error: "Invalid payment mode",
    }),
    payment_status: z
      .enum(["unpaid", "partial_paid", "paid", "advance"], {
        invalid_type_error: "Invalid payment status",
      })
      .optional(),
    amount_paid: baseFinancialField.default("0"),
    is_closed: z.boolean().default(false),
    note: z.string().max(256, "Note must be 256 characters or less").optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    total_tiffins: baseFinancialField.optional(),
    price_per_tiffin: baseFinancialField.optional(),
    addon_amount: baseFinancialField.optional(),
    plan_id: idField.optional(),
    items: z
      .array(
        z.object({
          name: z.string({ required_error: "Item name is required" }).min(1, "Item name is required"),
          quantity: z.coerce.number({ required_error: "Quantity is required" }).min(0, "Quantity cannot be negative"),
          price: requiredFinancialField,
        }),
        { required_error: "Items array is required for random bills" }
      )
      .optional(),
  })
  .refine((data) => (data.bill_type === "regular" ? data.start_date && data.end_date && data.total_tiffins !== undefined : true), {
    message: "Start date, end date, and total tiffins are required for regular bills",
    path: ["bill_type"],
  })
  .refine((data) => (data.bill_type === "random" ? data.items && data.items.length > 0 : true), {
    message: "Items are required for random bills",
    path: ["items"],
  })
  .refine(
    (data) =>
      data.amount_paid === undefined || data.total_amount === undefined || Number(data.amount_paid) <= Number(data.total_amount),
    { message: "Amount paid cannot exceed total amount", path: ["amount_paid"] }
  )

export const UpdateBillSchema = z
  .object({
    id: idField,
    payment_date: date_schema,
    amount_paid: requiredFinancialField,
    remaining_amount: requiredFinancialField,
    payment_mode: z.enum(["cash", "online"], {
      required_error: "Payment mode is required",
      invalid_type_error: "Invalid payment mode",
    }),
  })
  .refine((data) => Number(data.amount_paid) + Number(data.remaining_amount) >= 0, {
    message: "Amount paid plus remaining amount cannot be negative",
    path: ["remaining_amount"],
  })

export const EditVendorSchema = z.object({
  id: idField,
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be 2+ characters")
    .max(40, "Name must be 40 characters or less"),
  org_name: z
    .string({ required_error: "Organization name is required" })
    .min(2, "Org name must be 2+ characters")
    .max(40, "Org name must be 40 characters or less"),
  phone: z.coerce.string({ required_error: "Phone is required" }).length(10, "Phone must be exactly 10 digits"),
  address: z
    .string({ required_error: "Address is required" })
    .min(10, "Address must be 10+ characters")
    .max(256, "Address must be 256 characters or less"),
  service_area: z.array(z.string(), { required_error: "Service area is required" }).min(1, "At least one service area required"),
  qr_code: z.string().optional(),
  upi_id: z.string().optional(),
  logo_url: z.string().optional(),
})

export const GetMonthDeliverySchema = z.object({
  month: z.string({ required_error: "Month is required" }).min(1, "Month is required"),
  customer_id: idField,
})

// Type exports
export type CustomerType = z.infer<typeof customerSchema> & { id?: number; plan_id?: number }
export type SignUpType = z.infer<typeof SignUpSchema>
export type CreatePlanType = z.infer<typeof CreatePlanSchema> & { id?: number }
export type CreateNoticeType = z.infer<typeof CreateNoticeSchema> & { id?: number }
export type CreateStaffType = z.infer<typeof CreateStaffSchema> & { id?: number }
export type UpdateDeliveryType = z.infer<typeof UpdateDeliverySchema>
export type AddonSchemaType = z.infer<typeof AddonSchema>
export type CreateBillType = z.infer<typeof CreateBillSchema> & { customer_id: number }
export type UpdateBillType = z.infer<typeof UpdateBillSchema> & { id: number }
export type EditVendorType = z.infer<typeof EditVendorSchema> & { id: number }
export type GetMonthDeliveryType = z.infer<typeof GetMonthDeliverySchema> & { customer_id: number }

// DB interfaces
interface MealCountBill {
  bill_type: "regular"
  counts: {
    breakfast: number
    lunch: number
    dinner: number
    custom: number
  }
  plan_id: number
  end_date: string
  start_date: string
  total_tiffins: string
  price_per_tiffin: string
  addon_amount: string
  previous_addon_amount: string
}

interface ItemizedBill {
  bill_type: "random"
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
}

export type BillDetails = MealCountBill | ItemizedBill

export const ExtimatedBillSchema = idSchema.extend({
  bill_type: z.enum(["regular", "random"]),
})

export const updateDailyAttendanceSchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  day: z.coerce.number().int().min(1).max(31),
  records: z.array(
    z.object({
      staff_id: z.coerce.number().int().positive(),
      morning: z.enum(["P", "A", "L"]),
      evening: z.enum(["P", "A", "L"]),
    })
  ),
})

export const updateSingleAttendanceSchema = z.object({
  staff_id: z.coerce.number().int().positive(),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  records: z.array(
    z.object({
      morning: z.enum(["P", "A", "L"]),
      evening: z.enum(["P", "A", "L"]),
    })
  ),
})

export type dayFieldType =
  `day${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31}`

export const CreateExpenseSchema = z.object({
  date: date_schema,
  type: z.string(),
  id: idField.optional(),
  staff_id: idField.optional(),
  month_year: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
  note: z.string().max(256, "Note must be 256 characters or less").optional(),
  amount: requiredFinancialField,
})

export type CreateExpenseType = z.infer<typeof CreateExpenseSchema>
