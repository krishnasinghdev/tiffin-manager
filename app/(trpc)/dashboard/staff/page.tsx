"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreateStaffSchema, CreateStaffType } from "@/types/zod"
import { hashPassword } from "@/server/db/schema"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { SelectItem } from "@/components/ui/select"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

const staffRoleOptions = [
  { value: "staff", label: "Staff" },
  { value: "delivery", label: "Delivery" },
  { value: "kitchen", label: "Kitchen" },
  { value: "manager", label: "Manager" },
]

export default function StaffPage() {
  const utils = clientApi.useUtils()
  const session = useSession()
  const isAdmin = session.data?.user?.role === "admin"
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const createMutation = clientApi.staff.createStaff.useMutation()
  const updateMutation = clientApi.staff.updateStaff.useMutation()
  const { data: staffs, isLoading, isError } = clientApi.staff.getStaffs.useQuery({})

  const form = useForm({
    resolver: zodResolver(CreateStaffSchema),
    mode: "onChange",
  })

  async function onSubmit(values: CreateStaffType) {
    const action = values.id ? updateMutation : createMutation
    if (values.password) {
      values.password = await hashPassword(values.password)
    }
    if (values.staff_id) {
      values.staff_id = values.staff_id.toLowerCase()
    }

    const { success, message } = await action.mutateAsync(values)

    if (success) {
      utils.staff.getStaffs.invalidate()
      toast.success(message)
      form.reset()
      setIsDialogOpen(false)
    } else {
      toast.error(message || "Something went wrong")
    }
  }

  function handleStaffEdit(item: CreateStaffType) {
    setIsDialogOpen(true)

    form.setValue("id", item.id)
    form.setValue("name", item.name)
    form.setValue("phone", item.phone)
    form.setValue("password", "")
    form.setValue("staff_id", item.staff_id)
    form.setValue("staff_role", item.staff_role)
    form.setValue("is_active", item.is_active)
  }

  function handleDailog() {
    setIsDialogOpen(!isDialogOpen)
    form.reset()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Staffs</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDailog}>
          <DialogTrigger asChild>
            <Button>
              <Icons.Plus />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Staff Form</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <CustomField type="text" control={form.control} name="name" label="Enter name" />
                <div className="flex gap-4">
                  <CustomField type="text" control={form.control} name="staff_id" label="Enter Staff Id" />
                  <CustomField type="number" control={form.control} name="phone" label="Enter phone" />
                </div>
                <CustomField type="password" control={form.control} name="password" label="Password" />
                <div className="flex gap-4">
                  <CustomField
                    type="select"
                    control={form.control}
                    name="staff_role"
                    label="Staff Role"
                    placeholder="Select a role"
                    defaultValue={form.getValues("staff_role")}
                  >
                    {staffRoleOptions.map((option) => (
                      <SelectItem value={option.value.toString()} key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </CustomField>

                  <CustomField type="checkbox" control={form.control} name="is_active" label="Active" />
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Submit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded border [&>div]:max-h-[85dvh]">
        <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
          <TableHeader className="bg-muted sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[120px]">Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Staff Id</TableHead>
              <TableHead>Staff Role</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeleton rows={3} columns={6} />}
            {isError && <TableAlert colSpan={6} type="error" message="Failed to load staffs!" />}
            {!isLoading && !isError && !staffs?.data.length && (
              <TableAlert colSpan={6} message="No staff found, Add to get started!" />
            )}

            {staffs?.data.map((item, i) => (
              <TableRow key={i} className="even:bg-muted/30 even:hover:bg-muted/60 h-16 border-none">
                <TableCell className="min-w-[120px]">
                  <Link href={`/dashboard/staff/${item.id}`} className="text-primary underline underline-offset-4">
                    <div className="min-w-[100px] font-medium">{item.name}</div>
                  </Link>
                </TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>
                  <Badge className={getBadgeColor(item.is_active)} variant="secondary">
                    {item.is_active ? "Active" : "In Active"}
                  </Badge>
                </TableCell>
                <TableCell>{item.staff_id}</TableCell>
                <TableCell>
                  <Badge className={getBadgeColor(item.staff_role)} variant="secondary">
                    {item.staff_role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {isAdmin ? (
                    <Button
                      variant="ghost"
                      size="icon_sm"
                      onClick={() =>
                        handleStaffEdit({
                          id: item.id,
                          name: item.name,
                          phone: item.phone,
                          password: "",
                          staff_id: item.staff_id,
                          staff_role: item.staff_role,
                          is_active: item.is_active,
                        })
                      }
                      className="text-blue-500"
                    >
                      <Icons.Edit />
                    </Button>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
