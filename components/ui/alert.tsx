import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

import Icons from "../../lib/icons"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-muted-foreground [&>svg]:text-secondary",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "border-yellow-500/50 text-yellow-500 dark:border-yellow-500/50 [&>svg]:text-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("mb-1 ml-2 leading-none font-medium tracking-tight", className)} {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("ml-2 text-sm [&_p]:leading-relaxed", className)} {...props} />
)
AlertDescription.displayName = "AlertDescription"

const RenderAlert: React.FC<{ message: string } & VariantProps<typeof alertVariants>> = ({ variant, message }) => {
  return (
    <Alert variant={variant}>
      <Icons.AlertTriangle className="size-4" />
      <AlertTitle>{variant === "destructive" ? "Error" : variant === "warning" ? "Warning" : "Info"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription, RenderAlert }
