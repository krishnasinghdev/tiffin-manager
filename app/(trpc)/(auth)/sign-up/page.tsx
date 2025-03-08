"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { SignUpSchema, SignUpType } from "@/types/zod"
import Icons from "@/lib/icons"
import { SERVICE_AREAS } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomField from "@/components/custom-field"
import { clientApi } from "@/components/trpc-provider"

type StepProps = {
  label: string
  fields?: {
    name: string
    type: string
    placeholder: string
  }[]
}

type StepIndicatorProps = {
  currentStep: number
  steps: StepProps[]
}

const steps: StepProps[] = [
  {
    label: "Personal Information",
    fields: [
      { name: "name", type: "text", placeholder: "Name" },
      { name: "phone", type: "tel", placeholder: "Phone" },
      { name: "org_name", type: "text", placeholder: "Organisation Name" },
    ],
  },
  {
    label: "Address Details",
    fields: [
      { name: "service_area", type: "multi_select", placeholder: "Service Areas" },
      { name: "address", type: "text", placeholder: "Address" },
    ],
  },
  {
    label: "Set Password",
    fields: [
      { name: "password", type: "password", placeholder: "Password" },
      { name: "cpassword", type: "password", placeholder: "Confirm Password" },
    ],
  },
]

const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => (
  <div className="relative w-full">
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <motion.div
              className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                index <= currentStep ? "bg-primary text-white" : "bg-gray-200 text-white dark:bg-gray-800 dark:text-gray-600"
              }`}
              animate={{ scale: 1.02 }}
            >
              {index < currentStep ? <Icons.CheckCircle size={17} /> : <Icons.Circle size={17} fill="currentColor" />}
            </motion.div>
          </div>
          {index < steps.length - 1 && (
            <div className="relative grow">
              <div className="absolute -top-1 h-1.5 w-full bg-gray-100 dark:bg-gray-800" />
              <motion.div
                className="bg-primary absolute -top-1 h-1.5 w-full"
                initial={{ width: "0%" }}
                animate={{
                  width: index < currentStep ? "100%" : "0%",
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
)

export default function SignUpPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  const form = useForm<SignUpType>({
    resolver: zodResolver(SignUpSchema),
    mode: "onTouched",
    defaultValues: {
      service_area: [], // Initialize with empty array
    },
  })

  const selectedAreas = form.watch("service_area") || []

  const signUpMutation = clientApi.auth.signUp.useMutation()

  async function onSubmit(values: SignUpType) {
    setIsLoading(true)
    const { success } = await signUpMutation.mutateAsync(values)
    if (success) {
      router.push("/dashboard")
      toast.success("Account created successfully, Signing in to continue")
    } else {
      toast.error("Failed to create account")
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Register your account</h1>
        <p className="text-muted-foreground text-sm text-balance">in 3 simple steps.</p>
      </div>

      <StepIndicator currentStep={currentStep} steps={steps} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {currentStep === 0 && (
            <React.Fragment>
              <CustomField type="text" control={form.control} name="name" label="Name" />
              <CustomField type="number" control={form.control} name="phone" label="Phone" />
              <CustomField type="text" control={form.control} name="org_name" label="Organisation Name" />
            </React.Fragment>
          )}
          {currentStep === 1 && (
            <React.Fragment>
              <CustomField
                type="multi_select"
                control={form.control}
                name="service_area"
                label="Serice Areas"
                className="sm:col-span-2"
                options={SERVICE_AREAS}
                listOpen={listOpen}
                setListOpen={setListOpen}
              />
              <div>
                <p className="mb-2 text-sm">Selected Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <CustomField type="textarea" control={form.control} name="address" label="Address" />
            </React.Fragment>
          )}
          {currentStep === 2 && (
            <React.Fragment>
              <CustomField type="password" control={form.control} name="password" label="Password" />
              <CustomField type="password" control={form.control} name="cpassword" label="Confirm Password" />
              <Button type="submit" vibrate className="w-full" isLoading={isLoading}>
                Submit
              </Button>
            </React.Fragment>
          )}
        </form>
      </Form>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button onClick={handlePrev} variant="outline" disabled={currentStep === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} variant="outline" disabled={currentStep === steps.length - 1}>
          Next
        </Button>
      </div>

      <div className="text-center text-sm">
        Have an account?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Sign in
        </Link>
      </div>
    </div>
  )
}
