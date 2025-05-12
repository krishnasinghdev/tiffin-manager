"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { DialogDescription } from "@radix-ui/react-dialog"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { CreatePlanSchema, type CreatePlanType } from "@/types/zod"
import { getBadgeColor } from "@/lib/helper-functions"
import Icons from "@/lib/icons"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

export default function PlanPage() {
  const utils = clientApi.useUtils()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const createMutation = clientApi.plan.createPlan.useMutation()
  const updateMutation = clientApi.plan.updatePlan.useMutation()
  const { data: plans, isLoading, isError } = clientApi.plan.getPlans.useQuery()

  const form = useForm({
    resolver: zodResolver(CreatePlanSchema),
    mode: "onTouched",
  })

  const onSubmit = async (values: CreatePlanType) => {
    if (!form.formState.isDirty && !!values.id) {
      toast.info("No changes were made")
      setIsDialogOpen(false)
      return
    }

    const action = values.id ? updateMutation : createMutation
    const { success, message } = await action.mutateAsync(values)
    setIsDialogOpen(false)

    if (success) {
      utils.plan.getPlans.invalidate()
      toast.success(message)
      form.reset()
    } else {
      toast.error(message || "Failed to add plan")
    }
  }

  const handlePlanEdit = (plan: CreatePlanType) => {
    setIsDialogOpen(true)
    Object.entries(plan).forEach(([key, value]) => {
      form.setValue(key as keyof CreatePlanType, value, {
        shouldDirty: false,
      })
    })
  }

  const handleDialog = () => {
    setIsDialogOpen((prev) => !prev)
    form.reset()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Plans</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Icons.Plus aria-hidden="true" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{form.getValues("id") ? "Edit" : "Add"} Plan</DialogTitle>
              <DialogDescription>
                {form.getValues("id") ? "Update the details of your plan." : "Create a new plan for your customers."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <CustomField type="text" control={form.control} name="plan_name" label="Plan Name" />
                <CustomField type="textarea" control={form.control} name="plan_description" rows={4} label="Plan Details" />
                <div className="grid grid-cols-2 gap-4">
                  <CustomField type="number" control={form.control} name="total_tiffins" label="Total Tiffins" />
                  <CustomField type="number" control={form.control} name="price_per_tiffin" label="Price Per Tiffin" />
                </div>
                <div className="grid grid-cols-3">
                  <CustomField type="checkbox" control={form.control} name="breakfast" label="Breakfast" />
                  <CustomField type="checkbox" control={form.control} name="lunch" label="Lunch" />
                  <CustomField type="checkbox" control={form.control} name="dinner" label="Dinner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomField type="number" control={form.control} name="duration" label="Total Days" />
                  <CustomField type="checkbox" control={form.control} name="is_active" label="Active" />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                  disabled={
                    createMutation.isPending || updateMutation.isPending || (!!form.getValues("id") && !form.formState.isDirty)
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </CardContent>
              <CardFooter className="mt-auto">
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <Icons.AlertTriangle />
          <AlertTitle>Oh no</AlertTitle>
          <AlertDescription>Failed to load plans. Please try again later.</AlertDescription>
        </Alert>
      )}

      {plans && plans.data.length === 0 && (
        <Alert variant="warning">
          <Icons.AlertTriangle />
          <AlertTitle>No Plans Found</AlertTitle>
          <AlertDescription>
            It seems like you haven&apos;t added any plans yet. Click the button above to add a new plan.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {plans &&
          plans.data.map((plan) => (
            <Card className="flex flex-col transition-all hover:shadow-lg" key={plan.id}>
              <div className={cn(getBadgeColor(plan.is_active), "flex items-center justify-between rounded-t-lg px-4 py-2")}>
                <p>{plan.is_active ? "Active" : "Inactive"}</p>
                <Button
                  variant="secondary"
                  onClick={() =>
                    handlePlanEdit({
                      ...plan,
                      duration: plan.duration ?? 0,
                    })
                  }
                >
                  <Icons.Edit aria-hidden="true" />
                  Edit Plan
                </Button>
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">{plan.plan_name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 p-0">
                  {plan.breakfast && <Badge>Breakfast</Badge>}
                  {plan.lunch && <Badge>Lunch</Badge>}
                  {plan.dinner && <Badge>Dinner</Badge>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{plan.plan_description}</p>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">₹{plan.price_per_tiffin}</span>
                  <span className="text-muted-foreground text-sm">/tiffin</span>
                </div>
                <div className="text-muted-foreground text-sm">Total Tiffins: {plan.total_tiffins}</div>
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
}
