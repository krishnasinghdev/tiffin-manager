"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { DialogDescription } from "@radix-ui/react-dialog"
import type { ColumnDef, ColumnFiltersState, VisibilityState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import dayjs from "dayjs"
import { createParser, parseAsBoolean, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AddonSchema, type AddonSchemaType } from "@/types/zod"
import Icons from "@/lib/icons"
import { PDFGenerator, type jsPDFExtra } from "@/lib/pdf-generator"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

const parseAsDate = createParser({
  parse(queryValue) {
    if (!queryValue) return null
    const date = dayjs(queryValue, "DD-MM-YYYY")
    return date.isValid() ? date : null
  },
  serialize(value) {
    return dayjs(value).format("DD-MM-YYYY")
  },
  eq(a, b) {
    return dayjs(a).isSame(dayjs(b), "day")
  },
})

type MealType = "breakfast" | "lunch" | "dinner"

// New type for attendance
type attendanceType = {
  date: string
  delivery_id: number
  customer_id: number
  addon_detail: string | null
  lunch: boolean
  dinner: boolean
  breakfast: boolean
  addon_amount: string
}

type UpdateDeliveryType = {
  date: string
  lunch: boolean
  dinner: boolean
  breakfast: boolean
  customer_id: number
}

export default function CustomerDeliveryPage() {
  const params = useParams()
  const router = useRouter()
  const utils = clientApi.useUtils()
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [currentMonth, setCurrentMonth] = useQueryState("date", parseAsDate.withDefault(dayjs().startOf("month")))
  const [openDialog, setOpenDialog] = useQueryState("dialog", parseAsBoolean.withDefault(false))

  const [updatedData, setUpdatedData] = useState<Map<string, UpdateDeliveryType>>(new Map())
  const [allMeals, setAllMeals] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  })

  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    isError,
    isLoading,
    data: deliveriesResponse,
  } = clientApi.delivery.getCustomerMonthDeliveries.useQuery({
    customer_id: Number(params.id),
    month: currentMonth.format("MM-YYYY"),
  })

  // Update handlers for delivery status
  const handleMealChange = (date: string, field: MealType, value: any) => {
    setUpdatedData((prev) => {
      const newMap = new Map(prev)
      const originalItem = deliveriesResponse?.data?.deliveries.find((item) => item.date === date)
      const currentUpdate = newMap.get(date) || {
        lunch: originalItem?.lunch ?? false,
        dinner: originalItem?.dinner ?? false,
        breakfast: originalItem?.breakfast ?? false,
        date,
        customer_id: Number(params.id),
      }

      newMap.set(date, { ...currentUpdate, [field]: Boolean(value) })
      return newMap
    })
  }

  const handleAllMealChange = (meal: MealType, value: boolean) => {
    setAllMeals((prev) => ({ ...prev, [meal]: value }))
    deliveriesResponse?.data?.deliveries.forEach((item) => {
      handleMealChange(item.date, meal, value)
    })
  }

  const getMealStatus = (date: string, field: MealType): boolean => {
    const updatedValue = updatedData.get(date)?.[field]
    if (updatedValue !== undefined) {
      return updatedValue
    }
    const originalItem = deliveriesResponse?.data?.deliveries.find((item) => item.date === date)
    return originalItem ? originalItem[field] : false
  }

  const columns: ColumnDef<attendanceType>[] = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => <div className="w-24 font-medium">{dayjs(row.getValue("date")).format("DD MMM, ddd")}</div>,
      size: 28,
    },
    {
      size: 28,
      header: () => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Checkbox id="all-lunch" checked={allMeals.lunch} onCheckedChange={() => handleAllMealChange("lunch", !allMeals.lunch)} />
          <p>Lunch</p>
        </div>
      ),
      accessorKey: "lunch",
      cell: ({ row }) => (
        <Checkbox
          id={`lunch-${row.getValue("date")}`}
          checked={getMealStatus(row.getValue("date"), "lunch")}
          onCheckedChange={(checked) => handleMealChange(row.getValue("date"), "lunch", checked)}
        />
      ),
      enableSorting: false,
    },
    {
      size: 28,
      header: () => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Checkbox
            id="all-dinner"
            checked={allMeals.dinner}
            onCheckedChange={() => handleAllMealChange("dinner", !allMeals.dinner)}
          />
          <p>Dinner</p>
        </div>
      ),
      accessorKey: "dinner",
      cell: ({ row }) => (
        <Checkbox
          id={`dinner-${row.getValue("date")}`}
          checked={getMealStatus(row.getValue("date"), "dinner")}
          onCheckedChange={(checked) => handleMealChange(row.getValue("date"), "dinner", checked)}
        />
      ),
      enableSorting: false,
    },
    {
      size: 28,
      id: "action",
      header: () => <div className="w-full text-center">Action</div>,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant={row.original.addon_amount ? "outline" : "secondary"}
          onClick={() => {
            setOpenDialog(true)
            if (row.original.addon_amount) {
              form.setValue("addon_amount", row.original.addon_amount)
              form.setValue("addon_detail", row.original.addon_detail || "")
            }
            form.setValue("delivery_id", deliveriesResponse?.data.delivery_id || 0)
            form.setValue("date", row.getValue("date"))
          }}
        >
          {row.original.addon_amount ? (
            <>
              <Icons.Edit size={18} /> Edit
            </>
          ) : (
            <>
              <Icons.Plus size={18} />
              Add
            </>
          )}{" "}
          Extra
        </Button>
      ),
    },
  ]
  const table = useReactTable({
    data: (deliveriesResponse?.data?.deliveries || []) as attendanceType[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 31,
      },
      columnVisibility: {
        delivery_id: false,
        addon_detail: false,
        addon_amount: false,
      },
    },
    state: {
      globalFilter,
      columnFilters,
      columnVisibility,
    },
  })

  const updateDelivery = clientApi.delivery.updateMonthDeliveries.useMutation()

  const handleSaveChanges = async () => {
    try {
      const updatedObj: {
        [key: string]: string
      } = {}
      Array.from(updatedData.entries()).forEach(([date, data]) => {
        const day = dayjs(date).date()
        const dayField = `day${day}`

        // Convert boolean to P/A string
        const breakfast = data.breakfast ? "P" : "A"
        const lunch = data.lunch ? "P" : "A"
        const dinner = data.dinner ? "P" : "A"

        updatedObj[dayField] = `${breakfast}${lunch}${dinner}`
      })

      const { success, message } = await updateDelivery.mutateAsync({
        month_year: currentMonth.format("YYYY-MM"),
        customer_id: Number(params.id),
        day: dayjs().date(),
        records: updatedObj,
      })

      if (success) {
        await utils.delivery.getCustomerMonthDeliveries.invalidate({
          month: currentMonth.format("MM-YYYY"),
        })
        toast.success(message)
        setUpdatedData(new Map())
      } else {
        toast.error(message || "Failed to update delivery")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while updating deliveries.")
    }
  }

  // Custom Delivery Addon Form
  const addonMutation = clientApi.delivery.updateAddon.useMutation()
  const form = useForm({
    resolver: zodResolver(AddonSchema),
    mode: "onTouched",
  })

  const onSubmit = async (values: AddonSchemaType) => {
    try {
      const { success, message } = await addonMutation.mutateAsync({
        date: dayjs(values.date).format("YYYY-MM-DD"),
        delivery_id: values.delivery_id,
        addon_detail: values.addon_detail,
        addon_amount: values.addon_amount,
      })

      if (success) {
        await utils.delivery.getCustomerMonthDeliveries.invalidate({
          month: currentMonth.format("MM-YYYY"),
        })
        toast.success(message)
        queryReset()
      } else {
        toast.error(message || "Failed to add delivery")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    }
  }

  function queryReset() {
    setOpenDialog(false)
    form.reset(undefined, { keepValues: false })
  }

  const handleDownloadPDF = () => {
    setIsPdfGenerating(true)
    if (!deliveriesResponse || deliveriesResponse?.data.deliveries.length === 0) {
      toast.error("No deliveries found for this month.")
      setIsPdfGenerating(false)
      return
    }
    const pdfGenerator = new PDFGenerator()
    const customerName = deliveriesResponse?.data.customer_name || "Customer"
    const month = dayjs(currentMonth).format("MMM")

    const attendanceData = deliveriesResponse.data.deliveries.map((item) => ({
      date: dayjs(item.date).format("DD MMM"),
      breakfast: item.breakfast,
      lunch: item.lunch,
      dinner: item.dinner,
      custom: item.addon_amount ? `Rs. ${item.addon_amount} - ${item.addon_detail}` : null,
    }))

    try {
      setIsPdfGenerating(true)
      const pdfPromise = pdfGenerator.generateAttendancePDF({
        customer_name: customerName,
        month: dayjs(deliveriesResponse?.data?.deliveries[0]?.date).format("MMM"),
        year: dayjs(deliveriesResponse?.data?.deliveries[0]?.date).format("YY"),
        details: attendanceData,
        logo_url: deliveriesResponse?.data.logo_url || "",
      })

      toast.promise(pdfPromise, {
        loading: "Generating PDF...",
        success: (doc: jsPDFExtra) => {
          doc.save(`${customerName.split(" ")[0]}-${month}-dd.pdf`)
          return "PDF Downloaded Successfully"
        },
        error: "Failed to generate PDF",
      })
    } catch (error) {
      console.error("PDF generation failed:", error)
    } finally {
      setIsPdfGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3 max-lg:flex-col">
        <div className="flex w-full items-center justify-between space-y-2 text-2xl font-semibold text-gray-500">
          <h1 className="text-primary underline underline-offset-4">
            <Link href={`/dashboard/customer/${deliveriesResponse?.data.customer_id}`}>{deliveriesResponse?.data.customer_name}</Link>
          </h1>
          {updatedData.size === 0 ? (
            <Button variant="default" onClick={() => router.back()}>
              <Icons.ArrowLeft />
              Back
            </Button>
          ) : (
            <Button onClick={handleSaveChanges} disabled={updateDelivery.isPending}>
              {updateDelivery.isPending ? <Icons.Loader className="animate-spin" /> : <Icons.Save />}
              Save Changes
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 max-lg:w-full">
          <div>
            <Pagination>
              <PaginationContent className="w-full justify-between gap-2">
                <PaginationItem>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
                    className="flex items-center gap-2"
                  >
                    <Icons.ChevronLeft size={16} strokeWidth={2} />
                    {currentMonth.subtract(1, "month").format("MMM, YY")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentMonth(dayjs().startOf("month"))}
                    className="flex items-center gap-2"
                  >
                    {currentMonth.format("MMM, YY")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentMonth((prev) => prev.add(1, "month"))}
                    className="flex items-center gap-2"
                  >
                    {currentMonth.add(1, "month").format("MMM, YY")}
                    <Icons.ChevronRight size={16} strokeWidth={2} />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {updatedData.size > 0 ? (
            <Button onClick={() => setUpdatedData(new Map())} variant="outline" disabled={updateDelivery.isPending}>
              <Icons.Cancel />
              Cancel
            </Button>
          ) : (
            <Button onClick={handleDownloadPDF} disabled={isPdfGenerating} variant="outline" className="ml-2">
              <Icons.Download />
              Download PDF
            </Button>
          )}
        </div>
      </div>
      <Dialog open={openDialog} onOpenChange={queryReset}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-gray-500">
              {form.getValues("delivery_id") ? "Edit" : "Add"} Extra Delivery for{" "}
              <span className="text-foreground">{deliveriesResponse?.data.customer_name} </span>
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CustomField type="date" control={form.control} name="date" label="Delivery Date" />
                <CustomField type="number" control={form.control} name="addon_amount" label="Price" />
                <CustomField type="textarea" control={form.control} name="addon_detail" rows={4} label="Details" />

                <Button type="submit" className="w-full" disabled={addonMutation.isPending}>
                  {addonMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded border [&>div]:max-h-[85dvh]">
        <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
          <TableHeader className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: `${header.getSize()}px` }} className="h-11">
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer items-center justify-between gap-2 text-center select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <Icons.ChevronUp className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />,
                            desc: <Icons.ChevronDown className="shrink-0 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeleton columns={table.getAllColumns().length} rows={7} />}
            {isError && <TableAlert colSpan={table.getAllColumns().length} type="error" message="Failed to load deliveries!" />}
            {!isLoading && !isError && table.getRowModel().rows.length === 0 && (
              <TableAlert colSpan={table.getAllColumns().length} message="No deliveries found for this month." />
            )}

            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={`${row.id}-${row.getValue("date")}`}
                  data-state={row.getIsSelected() && "selected"}
                  className="even:bg-muted/40 even:hover:bg-muted/40 border-none hover:bg-transparent max-sm:h-16"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={`${cell.id}-${row.getValue("date")}`} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
