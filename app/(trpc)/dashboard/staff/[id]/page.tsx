"use client"

import { use } from "react"
import Link from "next/link"
import dayjs from "dayjs"

import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { clientApi } from "@/components/trpc-provider"

type Props = {
  params: Promise<{ id: string }>
}

export default function SingleStaffPage({ params }: Props) {
  const id = use(params).id
  const { data, isLoading } = clientApi.staff.getStaffById.useQuery({ id: Number.parseInt(id) })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data || !data.data) {
    return (
      <Card className="p-6 text-center xl:w-1/2">
        <CardHeader className="mb-8 flex flex-row items-center justify-between">
          <CardTitle className="text-destructive mb-4">Staff Not Found!</CardTitle>
          <Link href="/dashboard/customer" className={cn(buttonVariants({ variant: "secondary" }))}>
            <Icons.ChevronLeft />
            Back to Staffs
          </Link>
        </CardHeader>
      </Card>
    )
  }

  const staffData = data.data
  const salaries = staffData.salaries || []

  return (
    <>
      <Card className="xl:w-1/2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="bg-background overflow-hidden rounded-b-lg border-y p-0">
          <Table>
            <TableBody>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Name</TableCell>
                <TableCell className="w-2/3 py-2">{staffData.name}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Phone</TableCell>
                <TableCell className="w-2/3 py-2">{staffData.phone}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Status</TableCell>
                <TableCell className="w-2/3 py-2">
                  <Badge className={getBadgeColor(staffData.is_active)}>{staffData.is_active ? "active" : "inactive"}</Badge>
                </TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Staff Role</TableCell>
                <TableCell className="w-2/3 py-2">
                  <Badge className={getBadgeColor(staffData.staff_role)}>{staffData.staff_role}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 xl:w-1/2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <Link
            href={`/dashboard/expense/add?staff_id=${id}&staff_name=${staffData.name}&expense_type=salary`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Icons.ReceiptIndianRupee />
            Add Payment
          </Link>
        </CardHeader>
        <CardContent className="bg-background overflow-hidden rounded-b-lg border-y p-0">
          {!salaries?.length && <div className="p-6 text-center">No payments found</div>}
          {salaries.length > 0 && (
            <Table>
              <TableBody>
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableCell className="bg-muted/50 w-1/6 py-2 font-medium">Expense Id</TableCell>
                  <TableCell className="bg-muted/50 w-1/6 py-2 font-medium">Amount</TableCell>
                  <TableCell className="bg-muted/50 w-4/6 py-2 font-medium">Date</TableCell>
                </TableRow>
                {salaries.map((s) => (
                  <TableRow key={s.id} className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/6 py-2">{s.id}</TableCell>
                    <TableCell className="w-1/6 py-2">₹ {s.amount}</TableCell>
                    <TableCell className="w-4/6 py-2">{s.expense_date && dayjs(s.expense_date).format("DD-MM-YYYY")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
