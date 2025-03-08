"use client"

import { useId, useRef, useState } from "react"
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
import { createParser, parseAsBoolean, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreateExpenseSchema, CreateExpenseType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

type ExpenseType = {
  id: number
  date: string
  month_year: string
  amount: string
  type: string
  note: string | null
  staff_id: number | null
  staff_name: string | null
}

export default function ExpensePage() {
  const id = useId()
  const utils = clientApi.useUtils()
  const inputRef = useRef<HTMLInputElement>(null)
  const [currentDate, setCurrentDate] = useQueryState("date", parseAsDate.withDefault(dayjs()))
  const [openDialog, setOpenDialog] = useQueryState("dialog", parseAsBoolean.withDefault(false))

  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])

  const {
    data: expensesResponse,
    isLoading,
    isError,
  } = clientApi.expense.getExpenses.useQuery({
    date: currentDate.format("DD-MM-YYYY"),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy: sorting[0]?.id || "date",
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
  })

  const columns: ColumnDef<ExpenseType>[] = [
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => <div className="min-w-[100px] font-medium">{dayjs(row.getValue("date")).format("DD MMM YYYY")}</div>,
      size: 64,
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: ({ row }) => <Badge className={getBadgeColor(row.getValue("type"))}>{row.getValue("type")}</Badge>,
      size: 64,
    },
    {
      header: "Staff",
      accessorKey: "staff_name",
      cell: ({ row }) => (
        <>
          {row.getValue("staff_name") ? (
            <Link href={`/dashboard/staff/${row.original.staff_id}`} className="text-primary underline underline-offset-4">
              <div className="min-w-[100px] font-medium">{row.getValue("staff_name")}</div>
            </Link>
          ) : (
            <p>N/A</p>
          )}
        </>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => <div className="min-w-[80px]">₹{row.getValue("amount")}</div>,
      size: 64,
    },
    {
      header: "Note",
      accessorKey: "note",
      cell: ({ row }) => <div className="min-w-[150px]">{row.getValue("note")}</div>,
      enableSorting: false,
    },
    {
      size: 28,
      header: () => <div className="w-full text-center">Action</div>,
      id: "action",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setOpenDialog(true)
            form.reset({
              id: row.original.id,
              date: row.original.date,
              amount: row.original.amount,
              note: row.original.note || "",
              type: row.original.type,
              staff_id: row.original.staff_id ? row.original.staff_id : undefined,
              month_year: row.original.month_year || undefined,
            })
          }}
        >
          <Icons.Edit size={18} /> Edit
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: expensesResponse?.data || [],
    columns,
    pageCount: expensesResponse?.meta?.pageCount ?? -1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    manualSorting: true,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    enableSortingRemoval: true,
  })

  const goToPreviousDay = () => setCurrentDate((prev) => prev.subtract(1, "day"))
  const goToNextDay = () => setCurrentDate((prev) => prev.add(1, "day"))
  const resetDate = () => setCurrentDate(dayjs())

  // Expense Form
  const expenseUpdateMutation = clientApi.expense.updateExpense.useMutation()

  const form = useForm<CreateExpenseType>({
    resolver: zodResolver(CreateExpenseSchema),
    mode: "onTouched",
  })
  console.log(form.formState.errors)
  const onSubmit = async (values: CreateExpenseType) => {
    try {
      const result = await expenseUpdateMutation.mutateAsync(values)

      if (result.success) {
        utils.expense.getExpenses.invalidate()
        toast.success(result.message)
        queryReset()
      } else {
        toast.error(result.message || "Failed to update expense")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    }
  }

  function queryReset() {
    setOpenDialog(false)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-3 max-lg:flex-col">
        <div className="w-full space-y-2 lg:max-w-sm">
          <div className="relative">
            <Input
              type="text"
              ref={inputRef}
              id="global-search"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search expenses..."
              aria-label="Search expenses"
              className={cn("peer min-w-60 ps-9", Boolean(globalFilter) && "pe-9")}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
              <Icons.Search size={16} strokeWidth={2} />
            </div>
            {Boolean(globalFilter) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:outline-ring/70 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  setGlobalFilter("")
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
        <div className="w-full items-center justify-between gap-3 sm:flex lg:justify-end">
          <div>
            <Pagination>
              <PaginationContent className="w-full justify-between gap-2">
                <PaginationItem>
                  <Button variant="outline" onClick={goToPreviousDay} className="flex items-center gap-2">
                    <Icons.ChevronLeft size={16} strokeWidth={2} />
                    {currentDate.subtract(1, "day").format("DD MMM")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button variant="secondary" onClick={resetDate} className="flex items-center gap-2">
                    {currentDate.format("DD MMM")}
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <Button variant="outline" onClick={goToNextDay} className="flex items-center gap-2">
                    {currentDate.add(1, "day").format("DD MMM")}
                    <Icons.ChevronRight size={16} strokeWidth={2} />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          <Link href="/dashboard/expense/add">
            <Button>
              <Icons.Plus />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={(open) => !open && queryReset()}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-gray-500">Edit Expense</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CustomField type="date" control={form.control} name="date" label="Date" />
                <CustomField type="select" control={form.control} defaultValue={form.getValues("type")} name="type" label="Type">
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="grocery">Grocery</SelectItem>
                    <SelectItem value="utility">Utility</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </CustomField>
                <CustomField type="number" control={form.control} name="amount" label="Amount" />
                <Button type="submit" className="w-full" isLoading={expenseUpdateMutation.isPending}>
                  Update
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
            {isError && <TableAlert colSpan={table.getAllColumns().length} type="error" message="Failed to load expenses!" />}
            {!isLoading && !isError && table.getRowModel().rows.length === 0 && (
              <TableAlert colSpan={table.getAllColumns().length} message="No expenses found for this date." />
            )}

            {!isLoading &&
              !isError &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={`expense-${row.original.id}`}
                  data-state={row.getIsSelected() && "selected"}
                  className="even:bg-muted/40 even:hover:bg-muted/40 border-none hover:bg-transparent max-sm:h-16"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={`${cell.id}-${row.original.id}`} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
              {expensesResponse?.meta?.currentPage
                ? `${(expensesResponse.meta.currentPage - 1) * expensesResponse.meta.pageSize + 1}-${Math.min(
                    expensesResponse.meta.currentPage * expensesResponse.meta.pageSize,
                    expensesResponse.meta.totalCount
                  )}`
                : "0-0"}
            </span>{" "}
            of <span className="text-foreground">{expensesResponse?.meta?.totalCount ?? 0}</span>
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
    </div>
  )
}
