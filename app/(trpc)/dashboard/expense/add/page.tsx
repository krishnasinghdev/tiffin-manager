"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreateExpenseSchema, type CreateExpenseType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { RenderAlert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

type StaffSelectionDialogProps = {
  staffList: { id: number; name: string; role: string }[]
  selectedId?: number
  onSelect: (id: number, name: string) => void
  onOpenChange: () => void
}

type TabOptions = "expense" | "salary"

type ExpenseFormProps = {
  staffId?: number
  staffName?: string
  expenseType: TabOptions
  onSubmit: (values: CreateExpenseType) => Promise<void>
}

function StaffSelectionDialog({ staffList, selectedId, onSelect, onOpenChange }: StaffSelectionDialogProps) {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Button onClick={() => setOpen(true)}>Select Staff Member</Button>
      </div>
    )
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={() => {
        setOpen(false)
        if (open) {
          onOpenChange()
        }
      }}
    >
      <CommandInput placeholder="Search staff..." />
      <CommandList>
        <CommandEmpty>No staff found.</CommandEmpty>
        <CommandGroup heading="Select a Staff Member">
          {staffList.map((staff) => (
            <CommandItem
              key={staff.id}
              onSelect={() => {
                setOpen(false)
                onSelect(staff.id, staff.name)
              }}
              className="cursor-pointer"
            >
              <Icons.User />
              <span>{staff.name}</span>
              {selectedId === staff.id && <span className="text-muted-foreground ml-auto text-sm">Selected</span>}
              <Badge className={cn(getBadgeColor(staff.role), "ml-auto")}>{staff.role}</Badge>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default function AddExpensePage() {
  const router = useRouter()
  const [staff_id, setStaff_id] = useQueryState("staff_id", parseAsInteger.withDefault(0))
  const [staffName, setStaffName] = useQueryState("staff_name")
  const [expenseType, setExpenseType] = useQueryState("expense_type", parseAsString.withDefault("expense"))

  const { data: staffList, isLoading: isLoadingStaff } = clientApi.staff.getStaffs.useQuery(
    {
      is_active: true,
    },
    {
      enabled: expenseType === "salary",
    }
  )

  const createExpenseMutation = clientApi.expense.createExpense.useMutation()

  const handleSubmit = async (values: CreateExpenseType) => {
    try {
      const { success, data, message } = await createExpenseMutation.mutateAsync(values)
      if (success && data) {
        router.push("/dashboard/expense")
        toast.success(message)
      } else {
        toast.error(message)
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while creating the expense record.")
    }
  }

  function handleStaffSelection(id: number, name: string) {
    setStaff_id(id)
    setStaffName(name)
  }

  function handleDialogClose() {
    setExpenseType("expense")
    setStaff_id(0)
    setStaffName(null)
  }

  if (expenseType === "salary" && !staff_id) {
    if (isLoadingStaff) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Icons.Loader className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (!staffList?.data || staffList.data.length === 0) {
      return <RenderAlert variant="destructive" message="No staff found. Please add staff members before recording salary expenses." />
    }

    return (
      <StaffSelectionDialog
        staffList={staffList.data}
        selectedId={staff_id}
        onSelect={handleStaffSelection}
        onOpenChange={handleDialogClose}
      />
    )
  }
  function handleTabChange(tab: string) {
    setExpenseType(tab)
    if (tab === "expense") {
      setStaff_id(0)
      setStaffName(null)
    }
  }
  return (
    <div className="container max-w-4xl py-6">
      <Card className="mx-auto">
        <CardHeader className="mb-4 flex flex-row items-center justify-between">
          <CardTitle>Add Expense</CardTitle>
          {expenseType === "salary" && staff_id > 0 && (
            <Button
              size="sm"
              onClick={() => {
                setStaff_id(0)
              }}
            >
              Change Staff
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={expenseType} onValueChange={(v) => handleTabChange(v)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">General Expense</TabsTrigger>
              <TabsTrigger value="salary">Salary Payment</TabsTrigger>
            </TabsList>

            {expenseType === "salary" && staff_id > 0 && (
              <div className="mb-6 grid gap-6 [&>div]:overflow-hidden [&>div]:rounded-lg [&>div]:border">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-muted rounded-full p-2">
                      <Icons.User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{staffName}</h3>
                      <p className="text-muted-foreground text-sm">Staff ID: {staff_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <TabsContent value={expenseType}>
              <ExpenseForm
                staffId={expenseType === "salary" ? staff_id : undefined}
                expenseType={expenseType as TabOptions}
                onSubmit={handleSubmit}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function ExpenseForm({ staffId, expenseType, onSubmit }: ExpenseFormProps) {
  const form = useForm<CreateExpenseType>({
    resolver: zodResolver(CreateExpenseSchema),
    mode: "onTouched",
  })

  useEffect(() => {
    form.setValue("type", expenseType)
    form.setValue("staff_id", staffId || undefined)
    form.setValue("date", dayjs().format("YYYY-MM-DD"))
    form.setValue("month_year", dayjs().format("YYYY-MM"))
  }, [expenseType, staffId, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-dashed">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Expense in {dayjs().format("MMMM")} </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CustomField type="date" control={form.control} name="date" label="Date" />
            <CustomField type="number" control={form.control} name="amount" label="Amount (₹)" />
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <CustomField
              type="textarea"
              control={form.control}
              name="note"
              label={expenseType === "salary" ? "Payment Note" : "Expense Description"}
              placeholder={expenseType === "salary" ? "Enter payment details..." : "What was this expense for?"}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {expenseType === "salary" ? "Add Salary Payment" : "Add Expense"}
        </Button>
      </form>
    </Form>
  )
}
