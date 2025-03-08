"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomField from "@/components/custom-field"

const formSchema = z.object({
  user_id: z.string().min(6),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function SignInpage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      user_id: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const res = await signIn("credentials", {
        user_id: values.user_id,
        password: values.password,
        redirect: false,
      })
      if (res?.code) {
        toast.error(res.code)
        return
      }
      router.push("/dashboard")
    } catch (error) {
      console.log(error)
      toast.error("Sign In failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Sign In to your account</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CustomField type="text" control={form.control} name="user_id" label="Enter Your Staff ID/Phone" />
          <CustomField type="password" control={form.control} name="password" label="Password" />
          <Button type="submit" vibrate isLoading={isLoading} className="mt-4 w-full">
            Submit
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </>
  )
}
