"use client"

import * as React from "react"
import { useId, useState } from "react"

import { cn } from "@/lib/utils"

import Icons from "../../lib/icons"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, ...props }, ref) => {
    const id = useId()
    const [isVisible, setIsVisible] = useState<boolean>(false)

    const toggleVisibility = () => setIsVisible((prevState) => !prevState)

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input id={id} ref={ref} className={cn("pe-9", className)} type={isVisible ? "text" : "password"} {...props} />
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:outline-ring/70 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <Icons.EyeOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Icons.Eye size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { Input, PasswordInput }
