"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import CustomField from "@/components/custom-field"

const formSchema = z.object({
  date_time: z.string().optional(),
  subject: z.string(),
  detail: z.string().min(10),
})

export default function SupportPage() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      date_time: new Date()
        .toLocaleString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", " |"),
      subject: "",
      detail: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    console.log(values)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-medium">Write to us!</h1>
        <p className="text-muted-foreground text-sm">
          We are here to help you. Please fill out the form below and we will get back to you as soon as possible.
        </p>
      </div>

      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-4">
          <CustomField type="text" control={form.control} name="subject" label="Enter subject" />
          <CustomField type="textarea" control={form.control} name="detail" rows={10} label="Message in detail" />
          <Button type="submit" isLoading={isLoading}>
            Submit
          </Button>
        </form>
      </Form>
    </div>
  )
}
