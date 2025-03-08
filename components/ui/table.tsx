import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
)
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("bg-muted/50 border-t font-medium last:[&>tr]:border-b-0", className)} {...props} />
  )
)
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "text-muted-foreground ml-2 h-12 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
)
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => <caption ref={ref} className={cn("text-muted-foreground mt-4 text-sm", className)} {...props} />
)
TableCaption.displayName = "TableCaption"

// Custom components

interface TableSkeletonProps {
  columns: number
  rows: number
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="h-14">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex} className="p-2">
              <div className="bg-muted h-5 w-full animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

interface TableAlertProps {
  message: string
  colSpan: number
  type?: "error" | "warning"
}

const TableAlert: React.FC<TableAlertProps> = ({ message, colSpan, type = "warning" }) => (
  <TableRow className={cn(type === "error" ? "bg-destructive/10" : "bg-yellow-500/15")}>
    <TableCell colSpan={colSpan} className={cn("py-4 text-center", type === "error" ? "text-destructive" : "text-yellow-500")}>
      {message || "Something went wrong!"}
    </TableCell>
  </TableRow>
)

// const PaginationBar: React.FC = () => {
//   return (

//   )
// }

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, TableAlert, TableSkeleton }
