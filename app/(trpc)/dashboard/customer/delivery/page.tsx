"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { DialogDescription } from "@radix-ui/react-dialog"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState, VisibilityState } from "@tanstack/react-table"
import dayjs from "dayjs"
import { createParser, parseAsBoolean, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AddonSchema, type AddonSchemaType } from "@/types/zod"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

// Constants and Types
const DATE_FORMAT = "DD-MM-YYYY"
const parseAsDate = createParser({
  parse: (value) => (!value ? null : dayjs(value, DATE_FORMAT).isValid() ? dayjs(value, DATE_FORMAT) : null),
  serialize: (value) => dayjs(value).format(DATE_FORMAT),
  eq: (a, b) => dayjs(a).isSame(dayjs(b), "day"),
})

type MealType = "breakfast" | "lunch" | "dinner"
type DeliveryRecord = {
  customer_id: number
  name: string
  address: string
  id: number | null
  breakfast: boolean
  lunch: boolean
  dinner: boolean
  addon_amount: string | null
  addon_detail: string | null
}
type UpdatedDelivery = Record<MealType, boolean>

// Utility Components
const DeliveryCheckbox = ({
  checked,
  onChange,
  idPrefix,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  idPrefix: string
}) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={idPrefix} checked={checked} onCheckedChange={onChange} />
    <Label htmlFor={idPrefix}>Present</Label>
  </div>
)

// Main Component
export default function DeliveryPage() {
  const id = useId()
  const utils = clientApi.useUtils()
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentDate, setCurrentDate] = useQueryState("date", parseAsDate.withDefault(dayjs()))
  const [openDialog, setOpenDialog] = useQueryState("dialog", parseAsBoolean.withDefault(false))
  const [cId, setCId] = useQueryState("id", parseAsInteger.withDefault(0))
  const [cName, setCName] = useQueryState("name", parseAsString.withDefault(""))
  const [updatedData, setUpdatedData] = useState<Map<number, UpdatedDelivery>>(new Map())
  const [allMeals, setAllMeals] = useState<Record<MealType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  })
  const [tableState, setTableState] = useState<{
    globalFilter: string
    columnFilters: ColumnFiltersState
    columnVisibility: VisibilityState
    pagination: PaginationState
    sorting: SortingState
  }>({
    globalFilter: "",
    columnFilters: [],
    columnVisibility: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
  })

  const {
    data: deliveriesResponse,
    isLoading,
    isError,
  } = clientApi.delivery.getDailyDeliveries.useQuery({
    date: currentDate.format(DATE_FORMAT),
    page: tableState.pagination.pageIndex + 1,
    pageSize: tableState.pagination.pageSize,
    sortBy: tableState.sorting[0]?.id || "name",
    sortOrder: tableState.sorting[0]?.desc ? "desc" : "asc",
  })

  // Handlers
  const updateMeal = (customerId: number, field: MealType, value: boolean) => {
    setUpdatedData((prev) => {
      const newMap = new Map(prev)
      const original = deliveriesResponse?.data.find((item) => item.customer_id === customerId)
      const current = newMap.get(customerId) || {
        breakfast: original?.breakfast ?? false,
        lunch: original?.lunch ?? false,
        dinner: original?.dinner ?? false,
      }
      newMap.set(customerId, { ...current, [field]: value })
      return newMap
    })
  }

  const updateAllMeals = (meal: MealType, value: boolean) => {
    setAllMeals((prev) => ({ ...prev, [meal]: value }))
    deliveriesResponse?.data.forEach((item) => updateMeal(item.customer_id, meal, value))
  }

  const getMealValue = (customerId: number, field: MealType): boolean =>
    updatedData.get(customerId)?.[field] ?? deliveriesResponse?.data.find((item) => item.customer_id === customerId)?.[field] ?? false

  // Table Configuration
  const columns: ColumnDef<DeliveryRecord>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <Link href={`/dashboard/customer/delivery/${row.original.customer_id}`} className="text-primary underline underline-offset-4">
          <div className="min-w-[120px] font-medium">{row.getValue("name")}</div>
        </Link>
      ),
      size: 64,
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: ({ row }) => <div className="min-w-[120px]">{row.getValue("address")}</div>,
      enableSorting: false,
    },
    {
      size: 36,
      header: () => (
        <div className="my-1 flex max-w-30 flex-col items-start whitespace-nowrap">
          <div className="mb-2 self-center">Lunch</div>
          <DeliveryCheckbox checked={allMeals.lunch} onChange={(checked) => updateAllMeals("lunch", checked)} idPrefix="all-lunch" />
        </div>
      ),
      accessorKey: "lunch",
      cell: ({ row }) => (
        <DeliveryCheckbox
          checked={getMealValue(row.original.customer_id, "lunch")}
          onChange={(checked) => updateMeal(row.original.customer_id, "lunch", checked)}
          idPrefix={`lunch-${row.original.customer_id}`}
        />
      ),
      enableSorting: false,
    },
    {
      size: 36,
      header: () => (
        <div className="my-1 flex max-w-30 flex-col items-start whitespace-nowrap">
          <div className="mb-2 self-center">Dinner</div>
          <DeliveryCheckbox
            checked={allMeals.dinner}
            onChange={(checked) => updateAllMeals("dinner", checked)}
            idPrefix="all-dinner"
          />
        </div>
      ),
      accessorKey: "dinner",
      cell: ({ row }) => (
        <DeliveryCheckbox
          checked={getMealValue(row.original.customer_id, "dinner")}
          onChange={(checked) => updateMeal(row.original.customer_id, "dinner", checked)}
          idPrefix={`dinner-${row.original.customer_id}`}
        />
      ),
      enableSorting: false,
    },
    {
      size: 28,
      header: () => <div className="w-full text-center">Action</div>,
      id: "action",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant={row.original.addon_amount ? "outline" : "secondary"}
          onClick={() => {
            setOpenDialog(true)
            setCId(row.original.customer_id)
            setCName(row.original.name)
          }}
        >
          {row.original.addon_amount ? (
            <>
              <Icons.Edit size={18} /> Edit
            </>
          ) : (
            <>
              <Icons.Plus size={18} /> Add
            </>
          )}{" "}
          Extra
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: deliveriesResponse?.data || [],
    columns,
    pageCount: deliveriesResponse?.meta?.pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updater) =>
      setTableState((prev) => ({
        ...prev,
        sorting: typeof updater === "function" ? updater(prev.sorting) : updater,
      })),
    onPaginationChange: (updater) =>
      setTableState((prev) => ({
        ...prev,
        pagination: typeof updater === "function" ? updater(prev.pagination) : updater,
      })),
    onColumnFiltersChange: (updater) =>
      setTableState((prev) => ({
        ...prev,
        columnFilters: typeof updater === "function" ? updater(prev.columnFilters) : updater,
      })),
    onColumnVisibilityChange: (updater) =>
      setTableState((prev) => ({
        ...prev,
        columnVisibility: typeof updater === "function" ? updater(prev.columnVisibility) : updater,
      })),
    onGlobalFilterChange: (value) => setTableState((prev) => ({ ...prev, globalFilter: value })),
    manualPagination: true,
    manualSorting: true,
    state: tableState,
    enableSortingRemoval: true,
  })

  const updateDelivery = clientApi.delivery.updateDailyDeliveries.useMutation()

  const handleSaveChanges = async () => {
    try {
      const updatedDeliveries = Array.from(updatedData.entries()).map(([customerId, data]) => ({
        customer_id: customerId,
        breakfast: data.breakfast ? "P" : "A",
        lunch: data.lunch ? "P" : "A",
        dinner: data.dinner ? "P" : "A",
      }))

      const { success, message } = await updateDelivery.mutateAsync({
        day: currentDate.date(),
        records: updatedDeliveries,
        month_year: currentDate.format("YYYY-MM"),
      })

      if (success) {
        utils.delivery.getDailyDeliveries.invalidate({ date: currentDate.format(DATE_FORMAT) })
        toast.success(message)
        setUpdatedData(new Map())
      } else {
        toast.error(message || "Failed to update delivery")
      }
    } catch (error) {
      console.log(error)
      toast.error("An error occurred while updating deliveries")
    }
  }

  // Addon Form
  const addonMutation = clientApi.delivery.updateAddon.useMutation()
  const form = useForm<AddonSchemaType>({
    resolver: zodResolver(AddonSchema),
    mode: "onTouched",
  })

  useEffect(() => {
    if (!openDialog) return

    const customer = deliveriesResponse?.data.find((c) => c.customer_id === cId)
    form.reset({
      date: currentDate.format("YYYY-MM-DD"),
      delivery_id: customer?.id ?? undefined,
      addon_amount: customer?.addon_amount || undefined,
      addon_detail: customer?.addon_detail ?? "",
    })
  }, [openDialog, cId, currentDate, deliveriesResponse?.data, form])

  const onSubmit = async (values: AddonSchemaType) => {
    try {
      const { success, message } = await addonMutation.mutateAsync(values)
      if (success) {
        utils.delivery.getDailyDeliveries.invalidate({ date: currentDate.format(DATE_FORMAT) })
        toast.success(message)
        resetDialog()
      } else {
        toast.error(message || "Failed to add delivery")
      }
    } catch (error) {
      console.log(error)
      toast.error("An error occurred")
    }
  }

  const resetDialog = () => {
    setCName(null)
    setCId(null)
    setOpenDialog(false)
    form.reset()
  }

  return (
    <div className="mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 max-lg:flex-col">
        <div className="w-full space-y-2 lg:max-w-sm">
          <div className="relative">
            <Input
              type="text"
              ref={inputRef}
              id="global-search"
              value={tableState.globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              placeholder="Search by name, address, or phone..."
              aria-label="Search by name, address, or phone..."
              className={cn("peer min-w-60 ps-9", Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9")}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Icons.Search size={16} strokeWidth={2} />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:outline-ring/70 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("")
                  if (inputRef.current) {
                    inputRef.current.focus()
                  }
                }}
              >
                <Icons.CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col justify-between gap-3 lg:flex-row lg:items-center lg:justify-end">
          <div>
            <Pagination>
              <PaginationContent className="w-full justify-between gap-2">
                <PaginationItem>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentDate((prev) => prev.subtract(1, "day"))}
                    className="flex items-center gap-2"
                  >
                    <Icons.ChevronLeft size={16} strokeWidth={2} />
                    {currentDate.subtract(1, "day").format("DD MMM")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button variant="secondary" onClick={() => setCurrentDate(null)} className="flex items-center gap-2">
                    {currentDate.format("DD MMM")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentDate((prev) => prev.add(1, "day"))}
                    className="flex items-center gap-2"
                  >
                    {currentDate.add(1, "day").format("DD MMM")}
                    <Icons.ChevronRight size={16} strokeWidth={2} />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <Button onClick={handleSaveChanges} disabled={updatedData.size === 0 || updateDelivery.isPending}>
            {updateDelivery.isPending ? <Icons.Loader className="animate-spin" /> : <Icons.Save />}
            <span className="ml-2">Save Changes</span>
          </Button>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-gray-500">
              {form.getValues("delivery_id") ? "Edit" : "Add"} Addon Delivery for <span className="text-foreground">{cName}</span>
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <CustomField type="date" control={form.control} name="date" label="Delivery Date" />
              <CustomField type="number" control={form.control} name="addon_amount" label="Price" />
              <CustomField type="textarea" control={form.control} name="addon_detail" rows={4} label="Details" />
              <Button type="submit" className="w-full" disabled={addonMutation.isPending}>
                {addonMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="rounded border">
        <Table>
          <TableHeader className="bg-muted/90 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: `${header.getSize()}px` }}>
                    {header.column.getCanSort() ? (
                      <button
                        className="flex w-full items-center justify-between gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <Icons.ChevronUp size={16} strokeWidth={2} />,
                          desc: <Icons.ChevronDown size={16} strokeWidth={2} />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={columns.length} rows={7} />
            ) : isError ? (
              <TableAlert colSpan={columns.length} type="error" message="Failed to load customers!" />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableAlert colSpan={columns.length} message="No customers found!" />
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
            disabled={isLoading || isError || table.getRowCount() === 0}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
              {[25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page number information */}
        <div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
          <p className="text-muted-foreground text-sm whitespace-nowrap" aria-live="polite">
            <span className="text-foreground">
              {deliveriesResponse?.meta?.currentPage
                ? `${(deliveriesResponse.meta.currentPage - 1) * deliveriesResponse.meta.pageSize + 1}-${Math.min(
                    deliveriesResponse.meta.currentPage * deliveriesResponse.meta.pageSize,
                    deliveriesResponse.meta.totalCount
                  )}`
                : "0-0"}
            </span>{" "}
            of <span className="text-foreground">{deliveriesResponse?.meta?.totalCount ?? 0}</span>
          </p>
        </div>
        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  variant="secondary"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <Icons.ChevronLeft size={16} strokeWidth={2} aria-hidden="true" /> Previous
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  variant="secondary"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  Next <Icons.ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <footer className="text-muted-foreground text-sm">
        <p>P = Present, A = Absent, H = Holiday</p>
      </footer>
    </div>
  )
}
