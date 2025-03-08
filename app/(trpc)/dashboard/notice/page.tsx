"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreateNoticeSchema, CreateNoticeType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Table, TableAlert, TableBody, TableCell, TableHead, TableHeader, TableRow, TableSkeleton } from "@/components/ui/table"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

export default function NoticePage() {
  const utils = clientApi.useUtils()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: notices, isLoading, isError } = clientApi.notice.getNotices.useQuery()

  const createMutation = clientApi.notice.createNotice.useMutation()
  const updateMutation = clientApi.notice.updateNotice.useMutation()

  const form = useForm<CreateNoticeType>({
    resolver: zodResolver(CreateNoticeSchema),
    mode: "onTouched",
  })

  async function onSubmit(values: CreateNoticeType) {
    const action = values.id ? updateMutation : createMutation
    const { success, message } = await action.mutateAsync(values)
    setIsDialogOpen(false)

    if (success) {
      utils.notice.getNotices.invalidate()
      toast.success(message)
      form.reset()
    } else {
      toast.error(message || "Failed to add notice")
    }
  }

  function handleAnnonEdit(item: CreateNoticeType) {
    setIsDialogOpen(true)
    form.reset(item)
  }

  function handleAnnonRepeat(item: CreateNoticeType) {
    setIsDialogOpen(true)
    form.setValue("time", item.time)
    form.setValue("detail", item.detail)
  }

  async function handleAnnonDelete(item: CreateNoticeType) {
    const { success, message } = await updateMutation.mutateAsync({ ...item, status: "deleted" })
    if (success) {
      utils.notice.getNotices.invalidate()
      toast.success(message)
      form.reset()
    } else {
      toast.error(message || "Failed to delete notice")
    }
  }

  function handleDialog() {
    setIsDialogOpen(!isDialogOpen)
    form.reset()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Notice</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Icons.Plus size={16} />
              Add Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Notice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <CustomField type="date" control={form.control} name="date" label="Enter date" />
                <CustomField type="time" control={form.control} name="time" label="Time" />
                <CustomField type="textarea" control={form.control} name="detail" label="Notice detail" />
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending} className="w-full">
                  Submit
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded border [&>div]:max-h-[85dvh]">
        <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
          <TableHeader className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableSkeleton columns={4} rows={7} />}
            {isError && <TableAlert colSpan={4} type="error" message="Failed to load notices!" />}
            {!isLoading && !notices?.data.length && <TableAlert colSpan={4} message="No notice found, Add to get started!" />}

            {notices?.data.map((item, i) => (
              <TableRow key={i} className="even:bg-muted/30 even:hover:bg-muted/60 border-none max-sm:h-16">
                <TableCell className="whitespace-nowrap">{dayjs(`${item.date} ${item.time}`).format("DD, MMM / h:mm A")}</TableCell>
                <TableCell>
                  <Badge className={getBadgeColor(item.status)} variant="secondary">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-3 max-w-[450px] min-w-[250px]">{item.detail}</p>
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "pending" ? (
                    <>
                      <Button variant="ghost" size="icon_sm" className="lg:mr-2" onClick={() => handleAnnonEdit(item)}>
                        <Icons.Edit />
                      </Button>
                      <Button variant="ghost" size="icon_sm" className="text-red-500" onClick={() => handleAnnonDelete(item)}>
                        <Icons.Trash />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon_sm" className="text-green-500" onClick={() => handleAnnonRepeat(item)}>
                      <Icons.Repeat />
                    </Button>
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
