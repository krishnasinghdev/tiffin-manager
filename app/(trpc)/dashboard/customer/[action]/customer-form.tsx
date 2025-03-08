"use client"

import React, { useState } from "react"
import { redirect, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { customerSchema, CustomerType } from "@/types/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { SelectItem } from "@/components/ui/select"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

const radioOptions = [
  { value: "regular", label: "Regular" },
  { value: "random", label: "Random" },
]

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "InActive" },
  { value: "left", label: "Left" },
]

interface CustomerAddPageProps {
  defaultValues?: CustomerType | null
}

export default function CustomerForm({ defaultValues }: CustomerAddPageProps) {
  // const utils = clientApi.useUtils()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { data: planData } = clientApi.plan.getPlans.useQuery()

  if (planData && planData.data.length === 0) {
    toast.warning("No plans found, please add a plan first")
    router.push("/dashboard/menu")
  }

  const planOptions = planData?.data.map((_) => ({ value: _.id, label: _.plan_name })) || []
  const createMutation = clientApi.customer.createCustomer.useMutation()
  const updateMutation = clientApi.customer.updateCustomer.useMutation()

  const form = useForm<CustomerType>({
    resolver: zodResolver(customerSchema),
    mode: "onTouched",
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      address: "",
      plan_type: "regular",
      status: "active",
    },
  })

  async function onSubmit(values: CustomerType) {
    // if (!form.formState.isDirty && !!values.id) {
    //   utils.auth.getVendor.invalidate()
    //   toast.info("No changes were made")
    //   setIsLoading(false)
    //   return
    // }
    setIsLoading(true)
    const action = values.id ? updateMutation : createMutation
    const { success, message, data } = await action.mutateAsync(values)
    setIsLoading(false)

    if (success && data) {
      toast.success(message)
      form.reset()
      redirect(`/dashboard/customer`)
    } else {
      toast.error(message || "Something went wrong")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomField type="text" control={form.control} name="name" label="Name" />
        <CustomField type="number" control={form.control} name="phone" label="Phone" />
        <CustomField type="textarea" control={form.control} name="address" label="Address" />
        <CustomField
          type="select"
          control={form.control}
          name="plan_id"
          label="Selected Plan"
          placeholder="Select a plan"
          defaultValue={defaultValues?.plan_id?.toString()}
        >
          {planOptions.map((option) => (
            <SelectItem value={option.value.toString()} key={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </CustomField>

        <CustomField type="radio" control={form.control} name="plan_type" label="Plan Type">
          {radioOptions.map((option) => (
            <FormItem className="flex items-center space-y-0 space-x-3" key={option.value}>
              <FormControl>
                <RadioGroupItem value={option.value} />
              </FormControl>
              <FormLabel className="font-normal">{option.value}</FormLabel>
            </FormItem>
          ))}
        </CustomField>

        <CustomField type="radio" control={form.control} name="status" label="Satus">
          {statusOptions.map((option) => (
            <FormItem className="flex items-center space-y-0 space-x-3" key={option.value}>
              <FormControl>
                <RadioGroupItem value={option.value} />
              </FormControl>
              <FormLabel className="font-normal">{option.value}</FormLabel>
            </FormItem>
          ))}
        </CustomField>

        <Button type="submit" className="mt-4 w-full" isLoading={isLoading}>
          {defaultValues ? "Update Account" : "Create Account"}
        </Button>
      </form>
    </Form>
  )
}
