"use client"

import { useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import dayjs from "dayjs"
import { toast } from "sonner"

import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import { clientApi } from "@/components/trpc-provider"

type PaymentStatus = "unpaid" | "partial_paid" | "paid" | "advance"

type BillType = {
  id: number
  bill_date: string
  total_amount: string
  remaining_amount: string
  customer_name: string | null
  customer_phone: string | null
  payment_status: PaymentStatus
  customer_address: string | null
}

const statusFilterFn: FilterFn<BillType> = (row, columnId, filterValue: PaymentStatus[]) => {
  if (!filterValue?.length) return true
  const status = row.getValue(columnId) as PaymentStatus
  return filterValue.includes(status)
}

export default function AllBillPage() {
  const id = useId()
  const utils = clientApi.useUtils()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const updateMutation = clientApi.bill.deleteBill.useMutation()
  const { data: customers, isLoading, isError } = clientApi.bill.getAllBills.useQuery()
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const columns: ColumnDef<BillType>[] = [
    {
      header: "Name",
      accessorKey: "customer_name",
      cell: ({ row }) => (
        <Link href={`/dashboard/bill/${row.getValue("id")}`} className="text-primary underline underline-offset-4">
          <div className="min-w-[100px] font-medium">{row.getValue("customer_name")}</div>
        </Link>
      ),
      size: 100,
      enableHiding: false,
    },
    {
      header: "Address",
      accessorKey: "customer_address",
      size: 120,
      cell: ({ row }) => <div className="min-w-[150px]">{row.getValue("customer_address")}</div>,
    },
    {
      header: "Bill ID",
      accessorKey: "id",
      size: 20,
      cell: ({ row }) => <div>{row.getValue("id")}</div>,
    },
    {
      size: 80,
      header: "Bill Date",
      accessorKey: "bill_date",
      cell: ({ row }) => <div className="whitespace-nowrap">{dayjs(row.getValue("bill_date")).format("DD-MM-YYYY")}</div>,
    },
    {
      size: 60,
      header: "Payment Status",
      accessorKey: "payment_status",
      cell: ({ row }) => <Badge className={getBadgeColor(row.getValue("payment_status"))}>{row.getValue("payment_status")}</Badge>,
      filterFn: statusFilterFn,
    },
    {
      size: 60,
      header: "Total Amount",
      accessorKey: "total_amount",
      cell: ({ row }) => <div>{row.getValue("total_amount")}</div>,
    },
    {
      size: 60,
      header: "Remaining Amount",
      accessorKey: "remaining_amount",
      cell: ({ row }) => <div>{row.getValue("remaining_amount")}</div>,
    },
    {
      size: 60,
      header: "Actions",
      accessorKey: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon_sm"
          className="text-destructive lg:mr-2"
          onClick={() => handleBillDelete(row.getValue("id"))}
        >
          <Icons.Trash />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: customers?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchableFields = ["customer_name", "customer_address", "customer_phone"]
      return searchableFields.some((field) => {
        const value = row.getValue(field) as string
        return value.toLowerCase().includes(filterValue.toLowerCase())
      })
    },
    state: {
      sorting,
      pagination,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    enableSortingRemoval: true,
  })

  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("payment_status")

    if (!statusColumn) return []

    const values = Array.from(statusColumn.getFacetedUniqueValues().keys())

    return values.sort()
  }, [table.getColumn("payment_status")?.getFacetedUniqueValues()])

  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("payment_status")
    if (!statusColumn) return new Map()
    return statusColumn.getFacetedUniqueValues()
  }, [table.getColumn("payment_status")?.getFacetedUniqueValues()])

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("payment_status")?.getFilterValue() as string[]
    return filterValue ?? []
  }, [table.getColumn("payment_status")?.getFilterValue()])

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("payment_status")?.getFilterValue() as string[]
    const newFilterValue = filterValue ? [...filterValue] : []

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table.getColumn("payment_status")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  async function handleBillDelete(id: number) {
    toast.promise(updateMutation.mutateAsync({ id }), {
      loading: "Deleting bill...",
      success: "Bill deleted successfully",
      error: "Failed to delete bill",
    })
    await utils.bill.getAllBills.invalidate()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3 max-lg:flex-col">
        <div className="w-full space-y-2 lg:max-w-sm">
          {/* Filter by name */}
          <div className="relative">
            <Input
              type="text"
              ref={inputRef}
              id="global-search"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by name, address, or phone..."
              aria-label="Search by name, address, or phone..."
              className={cn("peer min-w-60 ps-9", Boolean(table.getColumn("customer_name")?.getFilterValue()) && "pe-9")}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Icons.Search size={16} strokeWidth={2} />
            </div>
            {Boolean(table.getColumn("customer_name")?.getFilterValue()) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:outline-ring/70 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("customer_name")?.setFilterValue("")
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
        <div className="flex w-full items-center justify-between gap-3 lg:justify-end">
          <div className="space-x-3">
            {/* Filter by status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Icons.Filter className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span className="border-border bg-background text-muted-foreground/70 ms-3 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                      {selectedStatuses.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="min-w-32 p-3" align="start">
                <div className="space-y-3">
                  <div className="text-muted-foreground text-xs font-medium">Filters</div>
                  <div className="space-y-3">
                    {uniqueStatusValues.map((value, i) => (
                      <div key={`${value}-${i}`} className="flex items-center gap-2">
                        <Checkbox
                          id={`${id}-${i}`}
                          checked={selectedStatuses.includes(value)}
                          onCheckedChange={(checked: boolean) => {
                            handleStatusChange(checked, value)
                          }}
                        />
                        <Label htmlFor={`${id}-${i}`} className="flex grow justify-between gap-2 font-normal">
                          {value} <span className="text-muted-foreground ms-2 text-xs">{statusCounts.get(value)}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {/* Toggle columns visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Icons.Columns3 className="-ms-1 me-2 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href="/dashboard/bill/generate">
            <Button>
              <Icons.Plus />
              Generate Bill
            </Button>
          </Link>
        </div>
      </div>

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
                            header.column.getCanSort() && "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            // Enhanced keyboard handling for sorting
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
            {isLoading && <TableSkeleton columns={columns.length} rows={7} />}
            {isError && <TableAlert colSpan={columns.length} type="error" message="Failed to load customers!" />}
            {!isLoading && !table.getRowModel().rows.length && (
              <TableAlert colSpan={columns.length} message="No customers found, Add to get started!" />
            )}

            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="even:bg-muted/30 even:hover:bg-muted/60 border-none max-sm:h-16"
              >
                {row.getVisibleCells().map((cell) => {
                  if (cell.getContext().column.id === "plan_type") {
                    return (
                      <TableCell key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  }
                  if (cell.getContext().column.id === "payment_status") {
                    return (
                      <TableCell key={cell.id} className="p-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  }
                  return (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
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
            disabled={isLoading || isError || table.getRowCount() === 10}
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
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{" "}
            of <span className="text-foreground">{table.getRowCount().toString()}</span>
          </p>
        </div>
        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent className="gap-2">
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  variant="secondary"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <Icons.ChevronLeft size={16} strokeWidth={2} aria-hidden="true" /> Prev
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
    </div>
  )
}
