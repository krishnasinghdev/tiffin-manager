"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreateBillSchema, CreateBillType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn, PAYMENT_MODE_OPT } from "@/lib/utils"
import { RenderAlert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

type CustomerSelectionDialogProps = {
  customers: { id: number; name: string; plan_type: string }[]
  selectedId?: number
  onSelect: (id: number, plan_type: string) => void
}

type TabOptions = "regular" | "random"

type BillFormProps = {
  billData: {
    customer_name: string
    customer_id: number
    counts: { breakfast: number; lunch: number; dinner: number; custom: number } | null
    total_tiffins: number | null
    price_per_tiffin: number | null
    addon_amount: number | null
    total_amount: string | null
    start_date: string | null
    end_date: string | null
    bill_date: string
    due_date: string
  }
  billType: TabOptions
  onSubmit: (values: CreateBillType) => Promise<void>
}

function CustomerSelectionDialog({ customers, selectedId, onSelect }: CustomerSelectionDialogProps) {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Button onClick={() => setOpen(true)}>Select Customer</Button>
      </div>
    )
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search customers..." />
      <CommandList>
        <CommandEmpty>No customers found.</CommandEmpty>
        <CommandGroup heading="Select a Customer">
          {customers.map((customer) => (
            <CommandItem
              key={customer.id}
              onSelect={() => {
                setOpen(false)
                onSelect(customer.id, customer.plan_type)
              }}
              className="cursor-pointer"
            >
              <Icons.User />
              <span>{customer.name}</span>
              {selectedId === customer.id && <span className="text-muted-foreground ml-auto text-sm">Selected</span>}
              <Badge className={cn(getBadgeColor(customer.plan_type), "ml-auto")}>{customer.plan_type}</Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default function GenerateBillPage() {
  const router = useRouter()
  const [customer_id, setCustomer_id] = useQueryState("customer_id", parseAsInteger.withDefault(0))
  const [planType, setPlanType] = useQueryState("plan_type")
  const [billType, setBillType] = useQueryState("bill_type", parseAsString.withDefault(planType === "regular" ? "regular" : "random"))
  const { data: customers, isLoading: isLoadingCustomers } = clientApi.customer.getCustomers.useQuery({
    status: "active",
  })
  const {
    data: estimatedBillData,
    isLoading: isLoadingBill,
    error,
    refetch,
  } = clientApi.bill.getEstimatedBill.useQuery({ id: customer_id, bill_type: billType as TabOptions }, { enabled: !!customer_id })

  useEffect(() => {
    if (billType === "regular") {
      refetch()
    }
  }, [billType])

  const createBillMutation = clientApi.bill.createBill.useMutation()

  const handleSubmit = async (values: CreateBillType) => {
    try {
      const { success, data, message } = await createBillMutation.mutateAsync(values)
      if (success && data) {
        router.push(`/dashboard/bill/${data.id}`)
        toast.success(message)
      } else {
        toast.error(message)
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while creating the bill.")
    }
  }

  function handleCustomerSelection(id: number, plan_type: string) {
    setCustomer_id(id)
    setPlanType(plan_type)
    setBillType(plan_type)
  }

  if (isLoadingCustomers || (customer_id && isLoadingBill)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Icons.Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <RenderAlert message={error?.message} />
  }

  if (!customer_id && (!customers?.data || customers.data.length === 0)) {
    return <RenderAlert variant="destructive" message="No customers found. Please add customers before generating a bill." />
  }

  if (!customer_id && customers?.data) {
    return <CustomerSelectionDialog customers={customers.data} selectedId={customer_id} onSelect={handleCustomerSelection} />
  }

  if (!estimatedBillData?.data) {
    return <RenderAlert variant="destructive" message="Failed to load bill data. Please try again." />
  }

  const billData = estimatedBillData.data

  if (billData && "bill_id" in billData) {
    router.push(`/dashboard/bill/${billData.bill_id}`)
    return null
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card className="mx-auto">
        <CardHeader className="mb-4 flex flex-row items-center justify-between">
          <CardTitle>Generate Bill</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setCustomer_id(0)
            }}
          >
            Change Customer
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={billType} onValueChange={(value) => setBillType(value as TabOptions)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regular" disabled={planType === "random"}>
                Regular Customer
              </TabsTrigger>
              <TabsTrigger value="random" disabled={planType === "regular"}>
                Custom Delivery
              </TabsTrigger>
            </TabsList>
            <div className="mb-6 grid gap-6 [&>div]:overflow-hidden [&>div]:rounded-lg [&>div]:border">
              <Table>
                <TableBody>
                  <TableRow className="*:border-border border-b hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="bg-muted/50 w-2/5 py-2 font-medium">Customer Id</TableCell>
                    <TableCell className="w-3/5 py-2">{billData.customer_id}</TableCell>
                  </TableRow>
                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                    <TableCell className="bg-muted/50 w-2/5 py-2 font-medium">Customer Name</TableCell>
                    <TableCell className="w-3/5 py-2">{billData.customer_name}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            {billType !== "random" && billData.counts && (
              <div className="mb-6 grid gap-6 lg:grid-cols-2 [&>div]:overflow-hidden [&>div]:rounded-lg [&>div]:border">
                <Table>
                  <TableBody>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 w-2/3 py-2 font-medium">Delivery Counts</TableCell>
                      <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Value</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Breakfast Count</TableCell>
                      <TableCell className="w-1/3 py-2">{billData.counts.breakfast}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-1/3 py-2">Lunch Count</TableCell>
                      <TableCell className="w-1/3 py-2">{billData.counts.lunch}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Dinner Count</TableCell>
                      <TableCell className="w-1/3 py-2">{billData.counts.dinner}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-1/3 py-2">Custom Deliveries</TableCell>
                      <TableCell className="w-1/3 py-2">{billData.counts.custom}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Table>
                  <TableBody>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Billing Details</TableCell>
                      <TableCell className="bg-muted/50 w-1/3 py-2 font-medium">Amount</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Total Tiffins</TableCell>
                      <TableCell className="w-1/3 py-2">{billData.total_tiffins}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Price Per Tiffin</TableCell>
                      <TableCell className="w-1/3 py-2">₹{billData.price_per_tiffin}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Addon Delivery Amount</TableCell>
                      <TableCell className="w-1/3 py-2">₹{billData.addon_amount}</TableCell>
                    </TableRow>
                    <TableRow className="*:border-border font-bold hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="w-2/3 py-2">Total Amount</TableCell>
                      <TableCell className="w-1/3 py-2">₹{billData.total_amount}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            <TabsContent value={billType}>
              <BillForm billData={billData} billType={billType as TabOptions} onSubmit={handleSubmit} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function BillForm({ billData, billType, onSubmit }: BillFormProps) {
  const [items, setItems] = useState<Array<{ name: string; quantity: number; price: string }>>([{ name: "", quantity: 1, price: "" }])

  const form = useForm<CreateBillType>({
    resolver: zodResolver(CreateBillSchema),
    mode: "onTouched",
    defaultValues: {
      bill_type: billType,
      start_date: billData.start_date || undefined,
      end_date: billData.end_date || undefined,
      bill_date: billData.bill_date,
      due_date: billData.due_date,
      total_amount: String(billData?.total_amount || 0),
      customer_id: billData.customer_id,
      note: "",
      discount: undefined,
      payment_mode: "cash",
      amount_paid: undefined,
      items: billType === "random" ? items : undefined,
      payment_status: billType === "random" ? "unpaid" : "advance",
    },
  })
  console.log(form.formState.errors, form.formState)
  useEffect(() => {
    if (billType === "regular") form.setValue("items", undefined)
    // if (billType === "random") form.setValue("total_amount", 0)
  }, [billType])

  const addItem = () => setItems([...items, { name: "", quantity: 0, price: "" }])

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    calculateTotal(newItems)
  }

  const updateItem = (index: number, field: keyof (typeof items)[0], value: string | number) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    })
    setItems(newItems)
    calculateTotal(newItems)
  }

  const calculateTotal = (currentItems: typeof items) => {
    const total = currentItems.reduce((sum, item) => sum + item.quantity * parseFloat(item.price || "0"), 0)
    form.setValue("total_amount", String(total))
    form.setValue("items", currentItems)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-dashed">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Date Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 space-y-2 md:grid-cols-2">
            {billType === "regular" && (
              <>
                <CustomField type="date" control={form.control} name="start_date" label="Start Date" />
                <CustomField type="date" control={form.control} name="end_date" label="End Date" />
              </>
            )}
            <CustomField type="date" control={form.control} name="bill_date" label="Bill Date" />
            <CustomField type="date" control={form.control} name="due_date" label="Due Date" />
          </CardContent>
        </Card>
        {billType === "random" && (
          <Card className="border-dashed md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-medium">Custom Delivery Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Icons.Plus /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 max-md:flex-col md:gap-4">
                  <div className="flex-1">
                    <FormLabel>Item {index + 1}</FormLabel>
                    <Input value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} placeholder="Item name" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="max-w-30">
                      <FormLabel>Quantity</FormLabel>
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="max-w-30">
                      <FormLabel>Price</FormLabel>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Price"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="text-destructive px-4"
                        onClick={() => removeItem(index)}
                      >
                        <Icons.Trash className="" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">₹{form.watch("total_amount")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border-dashed">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 space-y-2 md:grid-cols-2">
            <CustomField type="number" control={form.control} name="amount_paid" label="Amount Paid" />
            <CustomField type="number" control={form.control} name="discount" label="Discount" />
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

        <Card className="border-dashed">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CustomField type="textarea" control={form.control} name="note" label="Note" />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Generate Bill
        </Button>
      </form>
    </Form>
  )
}
