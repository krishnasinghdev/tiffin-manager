import Link from "next/link"
import { notFound } from "next/navigation"
import dayjs from "dayjs"

import { serverApi } from "@/server/server"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { auth } from "@/lib/next-auth"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

import CustomerForm from "./customer-form"

type Props = {
  params: Promise<{ action: string }>
}

export default async function CustomerActionPage({ params }: Props) {
  const action = (await params).action
  const session = await auth()
  if (!session) notFound()

  const isEdit = action.startsWith("edit-")
  const customerId = isEdit ? action.replace("edit-", "") : action

  if (action === "add") {
    return (
      <Card className="xl:w-1/2">
        <CardHeader className="mb-8 flex flex-row items-center justify-between">
          <CardTitle>Add Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm defaultValues={null} />
        </CardContent>
      </Card>
    )
  }

  const customer = await serverApi.customer.getCustomerById({ id: Number.parseInt(customerId) })

  if (!customer || !customer.data) {
    return (
      <Card className="p-6 text-center xl:w-1/2">
        <CardHeader className="mb-8 flex flex-row items-center justify-between">
          <CardTitle className="text-destructive mb-4">Customer Not Found!</CardTitle>
          <Link href="/dashboard/customer" className={cn(buttonVariants({ variant: "secondary" }))}>
            <Icons.ChevronLeft />
            Back to Customers
          </Link>
        </CardHeader>
      </Card>
    )
  }
  const customerData = customer.data

  if (isEdit) {
    return (
      <Card className="xl:w-1/2">
        <CardHeader className="mb-8 flex flex-row items-center justify-between pb-2">
          <CardTitle>Edit Customer</CardTitle>
          <Link href={`/dashboard/customer/${customerData.id}`} className={cn(buttonVariants({ variant: "secondary" }))}>
            <Icons.Cancel />
            Cancel Edit
          </Link>
        </CardHeader>
        <CardContent>
          <CustomerForm
            defaultValues={{
              id: customerData.id,
              name: customerData.name,
              phone: customerData.phone,
              address: customerData.address,
              plan_type: customerData.plan_type,
              status: customerData.status,
              plan_id: customerData.plan_id || undefined,
            }}
          />
        </CardContent>
      </Card>
    )
  }
  const { data: bill, success: billSuccess } = await serverApi.bill.getBillByCustomerId({ id: Number.parseInt(customerId) })

  return (
    <>
      <Card className="xl:w-1/2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Link href={`/dashboard/customer/edit-${customerId}`} className={cn(buttonVariants({ variant: "default" }))}>
            <Icons.Edit />
            Edit Customer
          </Link>
        </CardHeader>
        <CardContent className="bg-background overflow-hidden rounded-b-lg border-y p-0">
          <Table>
            <TableBody>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Name</TableCell>
                <TableCell className="w-2/3 py-2">{customerData.name}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Phone</TableCell>
                <TableCell className="w-2/3 py-2">{customerData.phone}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Plan Type</TableCell>
                <TableCell className="w-2/3 py-2">
                  <Badge className={getBadgeColor(customerData.plan_type)}>{customerData.plan_type}</Badge>
                </TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Status</TableCell>
                <TableCell className="w-2/3 py-2">
                  <Badge className={getBadgeColor(customerData.status)}>{customerData.status}</Badge>
                </TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Plan Name</TableCell>
                <TableCell className="w-2/3 py-2">{customerData.plan_name || "N/A"}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Last Bill Date</TableCell>
                <TableCell className="w-2/3 py-2">
                  {(customerData.last_bill_date && dayjs(customerData.last_bill_date).format("DD-MM-YYYY")) || "N/A"}
                </TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Address</TableCell>
                <TableCell className="w-2/3 py-2">{customerData.address}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 xl:w-1/2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bills</CardTitle>
          <Link
            href={`/dashboard/bill/generate?customer_id=${customerId}&plan_type=${customerData.plan_type}`}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Icons.ReceiptIndianRupee />
            Generate Bill
          </Link>
        </CardHeader>
        <CardContent className="bg-background overflow-hidden rounded-b-lg border-y p-0">
          {billSuccess && bill && bill.length ? (
            <Table>
              <TableBody>
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableCell className="bg-muted/50 w-1/6 py-2 font-medium">Bill No</TableCell>
                  <TableCell className="bg-muted/50 w-1/6 py-2 font-medium">Amount</TableCell>
                  <TableCell className="bg-muted/50 w-4/6 py-2 font-medium">Date</TableCell>
                </TableRow>
                {bill.map((b) => (
                  <TableRow key={b.id} className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/6 py-2">{b.id}</TableCell>
                    <TableCell className="w-1/6 py-2">₹ {b.total_amount}</TableCell>
                    <TableCell className="w-4/6 py-2">{b.created_at && dayjs(b.created_at).format("DD-MM-YYYY")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground p-4 text-center">No bills found for this customer.</div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
