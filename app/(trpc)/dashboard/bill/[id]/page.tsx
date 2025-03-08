"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { UpdateBillSchema, UpdateBillType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { PDFGenerator, type jsPDFExtra } from "@/lib/pdf-generator"
import { PAYMENT_MODE_OPT } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

function BillSkeleton() {
  return (
    <Card className="xl:w-1/2">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-8 w-[120px]" />
        <Skeleton className="h-10 w-[100px]" />
      </CardHeader>
      <CardContent className="p-0">
        {[1, 2, 3].map((table) => (
          <div key={table} className="mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex border-b">
                <Skeleton className="h-10 w-1/2 rounded-none" />
                <Skeleton className="h-10 w-1/2 rounded-none" />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function BillPage() {
  const params = useParams<{ id: string }>()

  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const utils = clientApi.useUtils()
  const updateMutation = clientApi.bill.updateBill.useMutation()
  const { data: billData, isLoading } = clientApi.bill.getBillById.useQuery({
    id: Number(params.id),
  })

  const form = useForm<UpdateBillType>({
    resolver: zodResolver(UpdateBillSchema),
    mode: "onBlur",
    defaultValues: {
      id: Number(params.id),
      payment_date: dayjs().format("YYYY-MM-DD"),
    },
  })

  const amountPaid = form.watch("amount_paid") || 0
  const totalAmount = Number(billData?.data?.total_amount) || 0
  const refreshBillMutation = clientApi.bill.refreshBill.useMutation()

  async function refreshBill() {
    toast.promise(refreshBillMutation.mutateAsync({ id: Number(params.id) }), {
      loading: "Refreshing ...",
      success: () => {
        utils.bill.getBillById.invalidate({ id: Number(params.id) })
        return "Bill refreshed successfully"
      },
      error: "Failed to refresh bill",
    })
  }

  useEffect(() => {
    if (!isNaN(Number(amountPaid))) {
      const previouslyPaid = Number(billData?.data?.amount_paid || 0)
      const remaining = Math.max(0, totalAmount - Number(amountPaid) - previouslyPaid)
      form.setValue("remaining_amount", String(remaining))
    }
  }, [amountPaid, totalAmount, form, billData?.data?.amount_paid])

  const onSubmit = async (values: UpdateBillType) => {
    try {
      const { success, data, message } = await updateMutation.mutateAsync(values)

      if (success && data) {
        utils.bill.getBillById.invalidate({ id: data.id })
        setIsEditing(false)
        toast.success(message)
      } else {
        toast.error(message)
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while updating the bill.")
    }
  }

  const handleDownloadPDF = () => {
    if (!billData?.data) return
    setIsPdfGenerating(true)
    const pdfGenerator = new PDFGenerator()
    const customerName = billData.data.customer_name || "Customer"
    const month = dayjs(billData.data.bill_date).format("MMM")

    try {
      const pdfPromise = pdfGenerator.generateBillPDF({
        id: bill.id,
        customer_name: bill.customer_name || "",
        bill_date: dayjs(bill.bill_date).format("DD MMM YYYY"),
        due_date: dayjs(bill.due_date).format("DD MMM YYYY"),
        bill_details:
          "counts" in bill.bill_detail
            ? {
                ...bill.bill_detail,
                total_tiffins: String(bill.bill_detail.total_tiffins),
                price_per_tiffin: String(bill.bill_detail.price_per_tiffin),
                addon_amount: String(bill.bill_detail.addon_amount),
                previous_addon_amount: String(bill.bill_detail.previous_addon_amount),
              }
            : {
                ...bill.bill_detail,
                items: bill.bill_detail.items.map((item) => ({
                  ...item,
                  price: String(item.price),
                })),
              },
        payments: bill.payments,
        total_amount: bill.total_amount,
        remaining_amount: bill.remaining_amount,
        payment_status: bill.payment_status,
        amount_paid: bill.amount_paid || "0",
        upi_id: bill.upi_id || "",
        qr_code: bill.qr_code || "",
        org_name: bill.org_name || "Tiffin Manager",
        logo_url: bill.logo_url || "",
      })
      toast.promise(pdfPromise, {
        loading: "Generating PDF...",
        success: (doc: jsPDFExtra) => {
          doc.save(`${customerName.split(" ")[0]}-${month}-bill.pdf`)
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

  if (isLoading) return <BillSkeleton />
  if (!billData?.data) {
    return (
      <Card className="xl:w-1/2">
        <CardHeader>
          <CardTitle className="text-destructive">Bill not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The requested bill could not be found. Please check the bill ID and try again.</p>
        </CardContent>
      </Card>
    )
  }

  const bill = billData.data
  const billDetails = bill.bill_detail

  return (
    <Card className="xl:w-1/2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{!isEditing ? "Bill Summary" : "Edit Bill"} </CardTitle>
        <div className="flex gap-2 max-sm:flex-col max-sm:items-end">
          {bill.bill_type === "regular" && !bill.is_closed && (
            <Button onClick={refreshBill} disabled={refreshBillMutation.isPending} variant="secondary" className="w-fit">
              <Icons.RefreshCcwDot />
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            className="w-fit"
            disabled={!billData?.data || isEditing || isPdfGenerating}
          >
            <Icons.Download />
            Download PDF
          </Button>
          {bill.payment_status !== "paid" && (
            <Button onClick={() => setIsEditing(!isEditing)} className="w-fit">
              {!isEditing ? <Icons.ReceiptIndianRupee /> : <Icons.Cancel />}
              {!isEditing ? "Add Payment" : "Cancel Edit"}
            </Button>
          )}
        </div>
      </CardHeader>

      {!isEditing && (
        <CardContent className="p-0">
          <Table>
            <TableBody>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">
                  {bill.bill_type === "regular" ? "Delivery" : "Item"} Counts
                </TableCell>
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">Value</TableCell>
              </TableRow>
              {"counts" in billDetails && billDetails.counts && (
                <>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Start Date</TableCell>
                    <TableCell className="w-1/2 py-2">{dayjs(billDetails.start_date).format("DD MMM YYYY")}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">End Date</TableCell>
                    <TableCell className="w-1/2 py-2">{dayjs(billDetails.end_date).format("DD MMM YYYY")}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Breakfast Count</TableCell>
                    <TableCell className="w-1/2 py-2">{billDetails.counts.breakfast}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Lunch Count</TableCell>
                    <TableCell className="w-1/2 py-2">{billDetails.counts.lunch}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Dinner Count</TableCell>
                    <TableCell className="w-1/2 py-2">{billDetails.counts.dinner}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Addon Counts</TableCell>
                    <TableCell className="w-1/2 py-2">{billDetails.counts.custom}</TableCell>
                  </TableRow>
                </>
              )}
              {"items" in billDetails &&
                billDetails.items &&
                billDetails.items.map((item, i) => (
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r" key={i}>
                    <TableCell className="w-1/2 py-2">
                      {item.name} x {item.quantity}
                    </TableCell>

                    <TableCell className="w-1/2 py-2">₹ {item.price}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <Table className="pt-4">
            <TableBody>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">Amount Details</TableCell>
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">Value</TableCell>
              </TableRow>
              {"counts" in billDetails && billDetails.counts && (
                <>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Total Tiffins</TableCell>
                    <TableCell className="w-1/2 py-2">{billDetails.total_tiffins}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Price Per Tiffin</TableCell>
                    <TableCell className="w-1/2 py-2">₹{billDetails.price_per_tiffin}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="w-1/2 py-2">Custom Delivery Amount</TableCell>
                    <TableCell className="w-1/2 py-2">₹{billDetails.addon_amount}</TableCell>
                  </TableRow>
                </>
              )}
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Total Amount</TableCell>
                <TableCell className="w-1/2 py-2">₹ {bill.total_amount}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Amount Paid</TableCell>
                <TableCell className="w-1/2 py-2">₹ {bill.amount_paid || 0}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="text-muted-foreground w-1/2 py-2">Remaining Amount</TableCell>
                <TableCell className="text-muted-foreground w-1/2 py-2">₹ {bill.remaining_amount}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="text-muted-foreground w-1/2 py-2">Discount</TableCell>
                <TableCell className="text-muted-foreground w-1/2 py-2">₹ {bill.discount}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Table className="pt-4">
            <TableBody>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">Payment Details</TableCell>
                <TableCell className="bg-muted/50 w-1/2 py-2 font-medium">Status</TableCell>
              </TableRow>

              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Bill Date</TableCell>
                <TableCell className="w-1/2 py-2">{dayjs(bill.bill_date).format("DD MMM YYYY")}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Due Date</TableCell>
                <TableCell className="w-1/2 py-2">{dayjs(bill.due_date).format("DD MMM YYYY")}</TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Payment Status</TableCell>
                <TableCell className="w-1/2 py-2">
                  <Badge className={getBadgeColor(bill.payment_status)}>{bill.payment_status}</Badge>
                </TableCell>
              </TableRow>
              <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell className="w-1/2 py-2">Bill Status</TableCell>
                <TableCell className="w-1/2 py-2">
                  <Badge className={getBadgeColor(bill.is_closed)}>{bill.is_closed ? "completed" : "current"}</Badge>
                </TableCell>
              </TableRow>
              {bill.payments?.map((payment) => (
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r" key={payment.id}>
                  <TableCell className="w-1/2 py-2">Payment Amount / Date</TableCell>
                  <TableCell className="w-1/2 py-2">
                    ₹ {payment.amount} / {dayjs(payment.payment_date).format("DD MMM YYYY")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {bill.note && (
            <Table className="pt-4">
              <TableBody>
                <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableCell className="bg-muted/50 py-2 font-medium">Note</TableCell>
                </TableRow>
                <TableRow className="*:border-border hover:bg-transparent">
                  <TableCell className="py-2">{bill.note}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}

      {isEditing && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-dashed">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-medium">Add Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <CustomField type="date" control={form.control} name="payment_date" label="Payment Date" />
                  <CustomField type="number" control={form.control} name="amount_paid" label="Amount " />
                  <CustomField type="number" control={form.control} name="remaining_amount" label="Remaining Amount" disabled />
                  <CustomField type="radio" control={form.control} name="payment_mode" label="Payment Mode">
                    <div className="flex flex-wrap gap-4">
                      {PAYMENT_MODE_OPT.map((option) => (
                        <FormItem className="flex items-center space-y-0 space-x-2" key={option.value}>
                          <FormControl>
                            <RadioGroupItem value={option.value} />
                          </FormControl>
                          <FormLabel className="font-normal">{option.label}</FormLabel>
                        </FormItem>
                      ))}
                    </div>
                  </CustomField>
                </CardContent>
              </Card>
              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending || !form.formState.isDirty}
                isLoading={updateMutation.isPending}
              >
                Update Bill
              </Button>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  )
}
