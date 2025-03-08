import { clsx, type ClassValue } from "clsx"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import { twMerge } from "tailwind-merge"

import { NavToolsProps } from "types"
import Icons from "@/lib/icons"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const APP_NAME = "Tiffin Manager"
export const WEB_URL = "https://tiffin.witheb.in"
export const APP_DESC = "Your daily tiffin manager"
export const SERVICE_AREAS = ["Lanka", "Bhagwanpur", "Bhelupur", "Sigra", "Ramnagar"]

export const PAYMENT_STATUS_OPT = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial_paid", label: "Partial Paid" },
  { value: "paid", label: "Paid" },
  { value: "advance", label: "Advance" },
]

export const PAYMENT_MODE_OPT = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
] as const

export const DASHBOARD_NAV = {
  navMain: [
    {
      title: "Customer",
      icon: Icons.Users,
      isActive: true,
      items: [
        {
          title: "Delivery",
          url: "/dashboard/customer/delivery",
        },
        {
          title: "Add Customer",
          url: "/dashboard/customer/add",
        },
        {
          title: "All Customers",
          url: "/dashboard/customer",
        },
      ],
    },
    {
      title: "Staff",
      icon: Icons.UserCog,
      items: [
        {
          title: "All Staff",
          url: "/dashboard/staff",
        },
        {
          title: "Attendance",
          url: "/dashboard/staff/attendance",
        },
      ],
    },
    {
      title: "Bill",
      icon: Icons.ReceiptIndianRupee,
      items: [
        {
          title: "All Bills",
          url: "/dashboard/bill",
        },
        {
          title: "Generate Bill",
          url: "/dashboard/bill/generate",
        },
      ],
    },
    {
      title: "Expense",
      icon: Icons.ReceiptText,
      items: [
        {
          title: "Add Expense",
          url: "/dashboard/expense/add",
        },
        {
          title: "All Expenses",
          url: "/dashboard/expense",
        },
      ],
    },
    {
      title: "Report",
      icon: Icons.ChartColumn,
      items: [
        {
          title: "Delivery",
          url: "/dashboard/report/delivery",
        },
        {
          title: "Payment",
          url: "/dashboard/report/payment",
        },
        {
          title: "Expense",
          url: "/dashboard/report/expense",
        },
      ],
    },
  ],
  tools: [
    {
      name: "Menu",
      url: "/dashboard/menu",
      icon: Icons.ListOrdered,
      status: "active",
    },
    {
      name: "Notice",
      url: "/dashboard/notice",
      icon: Icons.RadioTower,
      status: "active",
    },
    {
      name: "Marketing",
      url: "#",
      icon: Icons.PieChart,
      status: "soon",
    },
  ] as NavToolsProps[],
  navSecondary: [
    {
      title: "Support",
      url: "/dashboard/support",
      icon: Icons.LifeBuoy,
    },
  ],
}

export const DASHBOARD_PAGE = {
  cards: [
    {
      title: "Delivery",
      url: "/dashboard/customer/delivery",
      icon: Icons.UserCheck,
    },
    {
      title: "Customers",
      url: "/dashboard/customer",
      icon: Icons.Users,
    },
    {
      title: "Bill",
      url: "/dashboard/bill",
      icon: Icons.ReceiptIndianRupee,
    },
    {
      title: "Notice",
      url: "/dashboard/notice",
      icon: Icons.RadioTower,
    },
    {
      title: "Staff Attendance",
      url: "/dashboard/staff/attendance",
      icon: Icons.UserCog,
    },
    {
      title: "Add Expense",
      url: "/dashboard/expense/add",
      icon: Icons.ReceiptText,
    },
  ],
}

export const MOBILE_NAV_LINKS = [
  {
    label: "Dashboard",
    icon: Icons.LayoutDashboard,
    url: "/dashboard",
  },
  {
    label: "Attendance",
    icon: Icons.UserCog,
    url: "/dashboard/staff/attendance",
  },
  {
    label: "Delivery",
    icon: Icons.UserCheck,
    url: "/dashboard/customer/delivery",
  },
  {
    label: "Bill",
    icon: Icons.ReceiptIndianRupee,
    url: "/dashboard/bill",
  },
]
// Extend dayjs with required plugins
dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault("Asia/Kolkata")

// Constants for date formats
export const DATE_FORMATS = {
  UI_FORMAT: "DD-MM-YYYY",
  DB_FORMAT: "YYYY-MM-DD",
  ISO_FORMAT: "YYYY-MM-DDTHH:mm:ss.SSSZ",
} as const

// Utility functions for date conversion
export const dateUtils = {
  // Parse a date string in UI format (DD-MM-YYYY) to DB format (YYYY-MM-DD)
  toDBFormat: (dateStr: string): string => {
    if (dateUtils.isValidDBDate(dateStr)) return dateStr
    const parsed = dayjs(dateStr, DATE_FORMATS.UI_FORMAT, true)
    if (!parsed.isValid()) {
      throw new Error(`Invalid date format. Expected ${DATE_FORMATS.UI_FORMAT}`)
    }
    return parsed.format(DATE_FORMATS.DB_FORMAT)
  },

  // Convert DB format to UI format
  toUIFormat: (dateStr: string): string => {
    const parsed = dayjs(dateStr, DATE_FORMATS.DB_FORMAT, true)
    if (!parsed.isValid()) {
      throw new Error(`Invalid date format. Expected ${DATE_FORMATS.DB_FORMAT}`)
    }
    return parsed.format(DATE_FORMATS.UI_FORMAT)
  },

  // Validate if a string is a valid date in UI format
  isValidUIDate: (dateStr: string): boolean => {
    return dayjs(dateStr, DATE_FORMATS.UI_FORMAT, true).isValid()
  },

  // Validate if a string is a valid date in DB format
  isValidDBDate: (dateStr: string): boolean => {
    return dayjs(dateStr, DATE_FORMATS.DB_FORMAT, true).isValid()
  },
}
