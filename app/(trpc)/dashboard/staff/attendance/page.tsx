"use client"

import dayjs from "dayjs"
import { createParser, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { toast } from "sonner"

import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import { clientApi } from "@/components/trpc-provider"

// Types
type AttendanceStatus = "P" | "A"

interface StaffAttendanceRecord {
  staff_id: number
  staff_name: string
  staff_role: "staff" | "delivery" | "kitchen" | "manager"
  morning: string
  evening: string
  id: number | null
}

interface StaffAttendanceResponse {
  data: StaffAttendanceRecord[]
  success: boolean
  message: string
}

interface SingleStaffAttendanceData {
  date: string
  morning: string
  evening: string
}

interface SingleStaffAttendanceResponse {
  data: SingleStaffAttendanceData[]
  success: boolean
  message: string
}

type OptionsType = {
  id?: number | string
  shift?: "morning" | "evening"
  value?: boolean
}

type AttendanceCheckboxType = {
  value: string
  onChange: (value: boolean) => void
  idPrefix: string
}

const DATE_FORMAT = "DD-MM-YYYY"

const parseAsDate = createParser({
  parse: (value) => (!value ? null : dayjs(value, DATE_FORMAT).isValid() ? dayjs(value, DATE_FORMAT) : null),
  serialize: (value) => dayjs(value).format(DATE_FORMAT),
  eq: (a, b) => dayjs(a).isSame(dayjs(b), "day"),
})

const AttendanceCheckbox = ({ value, onChange, idPrefix }: AttendanceCheckboxType) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={idPrefix} checked={value === "P"} onCheckedChange={(checked) => onChange(checked as boolean)} />
    <Label htmlFor={idPrefix}>{value}</Label>
  </div>
)

// Main Component
export default function StaffAttendancePage() {
  const utils = clientApi.useUtils()
  const [staffId, setStaffId] = useQueryState("staff_id", parseAsInteger.withDefault(0))
  const [staffName, setStaffName] = useQueryState("staff_name", parseAsString.withDefault(""))
  const [currentDate, setCurrentDate] = useQueryState("date", parseAsDate.withDefault(dayjs()))

  const isSingleStaff = staffId !== 0

  // Queries
  const {
    data: DailyAttendance,
    isLoading: allLoading,
    isError: allError,
  } = clientApi.staffattendance.getDailyAttendance.useQuery(
    { date: currentDate.format(DATE_FORMAT) },
    { enabled: !isSingleStaff }
  ) as {
    data?: StaffAttendanceResponse
    isLoading: boolean
    isError: boolean
  }

  const {
    data: singleAttendance,
    isLoading: singleLoading,
    isError: singleError,
  } = clientApi.staffattendance.getStaffMonthAttendance.useQuery(
    { id: staffId, date: currentDate.format(DATE_FORMAT) },
    { enabled: isSingleStaff }
  ) as {
    data?: SingleStaffAttendanceResponse
    isLoading: boolean
    isError: boolean
  }

  const data = isSingleStaff ? singleAttendance?.data : DailyAttendance?.data
  const isLoading = isSingleStaff ? singleLoading : allLoading
  const isError = isSingleStaff ? singleError : allError

  // Mutations
  const updateMutation = clientApi.staffattendance.updateDailyAttendance.useMutation({
    onSuccess: ({ success, message }) => success && toast.success(message),
    onError: () => toast.error("Failed to save attendance"),
  })

  const singleUpdateMutation = clientApi.staffattendance.updateStaffMonthAttendance.useMutation({
    onSuccess: ({ success, message }) => success && toast.success(message || `Updated ${staffName}'s attendance successfully`),
    onError: () => toast.error(`Failed to save ${staffName}'s attendance`),
  })

  // Unified Handlers
  const handleAttendanceUpdate = (type: "change" | "markAll", options: OptionsType = {}) => {
    if (!data) return

    if (isSingleStaff && singleAttendance) {
      if (type === "change" && options.id && options.shift && options.value !== undefined) {
        const updatedData: SingleStaffAttendanceResponse = {
          ...singleAttendance,
          data: singleAttendance.data.map((item) =>
            dayjs(item.date).format("YYYY-MM-DD") === options.id
              ? { ...item, [options.shift as string]: options.value ? "P" : "A" }
              : item
          ),
        }
        utils.staffattendance.getStaffMonthAttendance.setData({ id: staffId, date: currentDate.format(DATE_FORMAT) }, updatedData)
      } else if (type === "markAll") {
        const updatedData: SingleStaffAttendanceResponse = {
          ...singleAttendance,
          data: singleAttendance.data.map((item) => ({ ...item, morning: "P", evening: "P" })),
        }
        utils.staffattendance.getStaffMonthAttendance.setData({ id: staffId, date: currentDate.format(DATE_FORMAT) }, updatedData)
        toast.success(`${staffName}'s attendance marked as present for all days`)
      }
    }

    if (!isSingleStaff && DailyAttendance) {
      if (type === "change" && options.id && options.shift && options.value !== undefined) {
        const updatedData = {
          ...DailyAttendance,
          data: DailyAttendance.data.map((staff) =>
            staff.staff_id === options.id ? { ...staff, [options.shift as string]: options.value ? "P" : "A" } : staff
          ),
        }
        utils.staffattendance.getDailyAttendance.setData({ date: currentDate.format(DATE_FORMAT) }, updatedData)
      } else if (type === "markAll") {
        const updatedData = {
          ...DailyAttendance,
          data: DailyAttendance.data.map((staff) => ({ ...staff, morning: "P", evening: "P" })),
        }
        utils.staffattendance.getDailyAttendance.setData({ date: currentDate.format(DATE_FORMAT) }, updatedData)
      }
    }
  }

  const handleSave = async () => {
    if (!data) return

    if (isSingleStaff && singleAttendance) {
      await singleUpdateMutation.mutateAsync({
        staff_id: staffId,
        month_year: currentDate.format("YYYY-MM"),
        records: singleAttendance.data.map((record) => ({
          morning: record.morning as AttendanceStatus,
          evening: record.evening as AttendanceStatus,
        })),
      })
    }

    if (!isSingleStaff && DailyAttendance) {
      await updateMutation.mutateAsync({
        month_year: currentDate.format("YYYY-MM"),
        day: currentDate.date(),
        records: DailyAttendance.data.map((staff) => ({
          staff_id: staff.staff_id,
          morning: staff.morning as AttendanceStatus,
          evening: staff.evening as AttendanceStatus,
        })),
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-3 max-lg:flex-col lg:items-center">
        <h1 className="text-3xl font-semibold">{staffName || "Staff"} Attendance</h1>
        <div className="flex justify-between gap-4 max-md:flex-col lg:items-center lg:justify-end">
          {!isSingleStaff && (
            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => setCurrentDate((prev) => prev.subtract(1, "day"))}>
                <Icons.ChevronLeft size={16} strokeWidth={2} />
                {currentDate.subtract(1, "day").format("DD MMM")}
              </Button>
              <Button variant="secondary" onClick={() => setCurrentDate(null)}>
                {currentDate.format("DD MMM")}
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate((prev) => prev.add(1, "day"))}>
                {currentDate.add(1, "day").format("DD MMM")}
                <Icons.ChevronRight size={16} strokeWidth={2} />
              </Button>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <Button onClick={() => handleAttendanceUpdate("markAll")} variant="secondary">
              <Icons.CheckCircle />
            </Button>
            {isSingleStaff && (
              <Button
                onClick={() => {
                  setStaffId(0)
                  setStaffName("")
                }}
                variant="secondary"
              >
                <Icons.ArrowLeft />
                Back
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSingleStaff ? singleUpdateMutation.isPending : updateMutation.isPending}>
              {(isSingleStaff && singleUpdateMutation.isPending) || updateMutation.isPending ? (
                <Icons.Loader className="animate-spin" />
              ) : (
                <Icons.Save />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <Table className="[&_td]:border-border [&_th]:border-border rounded border [&>div]:max-h-[85dvh]">
        <TableHeader className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm">
          <TableRow>
            <TableHead className="min-w-[120px]">{isSingleStaff ? "Date" : "Name"}</TableHead>
            {!isSingleStaff && <TableHead className="min-w-[120px]">Role</TableHead>}
            <TableHead className="min-w-[150px]">Morning</TableHead>
            <TableHead className="min-w-[150px]">Evening</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableSkeleton columns={isSingleStaff ? 3 : 4} rows={7} />}
          {isError && <TableAlert colSpan={isSingleStaff ? 3 : 4} type="error" message="Failed to load attendance!" />}

          {!isSingleStaff &&
            DailyAttendance?.data?.map((staff) => (
              <TableRow key={staff.staff_id} className="even:bg-muted/40 hover:bg-transparent">
                <TableCell
                  className="text-primary cursor-pointer p-4 font-medium underline underline-offset-4"
                  onClick={() => {
                    setStaffId(staff.staff_id)
                    setStaffName(staff.staff_name.split(" ")[0] || "")
                  }}
                >
                  {staff.staff_name}
                </TableCell>
                <TableCell className="p-4">
                  <Badge className={getBadgeColor(staff.staff_role)}>{staff.staff_role}</Badge>
                </TableCell>
                <TableCell className="p-4">
                  <AttendanceCheckbox
                    value={staff.morning}
                    onChange={(value) => handleAttendanceUpdate("change", { id: staff.staff_id, shift: "morning", value })}
                    idPrefix={`morning-${staff.id ?? staff.staff_id}`}
                  />
                </TableCell>
                <TableCell className="p-4">
                  <AttendanceCheckbox
                    value={staff.evening}
                    onChange={(value) => handleAttendanceUpdate("change", { id: staff.staff_id, shift: "evening", value })}
                    idPrefix={`evening-${staff.id ?? staff.staff_id}`}
                  />
                </TableCell>
              </TableRow>
            ))}

          {isSingleStaff &&
            singleAttendance?.data?.map((record, i) => (
              <TableRow key={i} className="even:bg-muted/40 hover:bg-transparent">
                <TableCell>{dayjs(record.date).format("DD MMM, YY")}</TableCell>
                <TableCell className="p-4">
                  <AttendanceCheckbox
                    value={record.morning}
                    onChange={(value) =>
                      handleAttendanceUpdate("change", { id: dayjs(record.date).format("YYYY-MM-DD"), shift: "morning", value })
                    }
                    idPrefix={`morning-${record.date}`}
                  />
                </TableCell>
                <TableCell className="p-4">
                  <AttendanceCheckbox
                    value={record.evening}
                    onChange={(value) =>
                      handleAttendanceUpdate("change", { id: dayjs(record.date).format("YYYY-MM-DD"), shift: "evening", value })
                    }
                    idPrefix={`evening-${record.date}`}
                  />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <footer className="text-muted-foreground text-sm">
        <p>P = Present, A = Absent</p>
      </footer>
    </div>
  )
}
