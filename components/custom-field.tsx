"use client"

import * as React from "react"
import { useId, useState } from "react"
import { Control, ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import Icons from "../lib/icons"

// ShadCN Input Component
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

// ShadCN PasswordInput Component
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

export const formFieldTypes = {
  text: "text",
  password: "password",
  textarea: "textarea",
  number: "number",
  checkbox: "checkbox",
  date: "date",
  select: "select",
  time: "time",
  radio: "radio",
  multi_select: "multi_select",
} as const

export type FormFieldType = keyof typeof formFieldTypes

type FieldProperties<T extends FormFieldType> = {
  text: string
  password: string
  textarea: string
  number: string // Changed to string to match schema output
  checkbox: boolean
  date: string
  select: string
  time: string
  radio: string
  multi_select: string[]
}[T]

interface BaseFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T extends FormFieldType = FormFieldType,
> {
  name: TName
  label: string
  disabled?: boolean
  placeholder?: string
  control: Control<TFieldValues>
  type: T
  children?: React.ReactNode
}

export type CustomFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T extends FormFieldType = FormFieldType,
> = BaseFieldProps<TFieldValues, TName, T> & {
  className?: string
  rows?: number
  options?: string[]
  listOpen?: boolean
  setListOpen?: (open: boolean) => void
  defaultValue?: string
}

interface RenderInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T extends FormFieldType = FormFieldType,
> {
  field: ControllerRenderProps<TFieldValues, TName> & {
    value: FieldProperties<T>
  }
  props: CustomFieldProps<TFieldValues, TName, T>
}

function RenderInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T extends FormFieldType = FormFieldType,
>({ field, props }: RenderInputProps<TFieldValues, TName, T>) {
  const { type, placeholder, disabled, name, children } = props

  switch (type) {
    case formFieldTypes.text:
      return (
        <FormControl>
          <Input placeholder={placeholder} {...field} disabled={disabled} />
        </FormControl>
      )

    case formFieldTypes.date:
      return (
        <FormControl>
          <Input placeholder={placeholder} {...field} type="date" disabled={disabled} />
        </FormControl>
      )

    case formFieldTypes.time:
      return (
        <FormControl>
          <Input placeholder={placeholder} {...field} type="time" disabled={disabled} />
        </FormControl>
      )

    case formFieldTypes.password:
      return (
        <FormControl>
          <PasswordInput placeholder={placeholder} {...field} disabled={disabled} />
        </FormControl>
      )

    case formFieldTypes.textarea:
      return (
        <FormControl>
          <Textarea placeholder={placeholder} {...field} className="shad-textArea" rows={props.rows || 3} disabled={disabled} />
        </FormControl>
      )

    case formFieldTypes.number:
      return (
        <FormControl>
          <Input
            placeholder={placeholder}
            {...field}
            type="number"
            min={0}
            step="0.01"
            disabled={disabled}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.valueAsNumber)}
          />
        </FormControl>
      )

    case formFieldTypes.checkbox:
      return (
        <FormControl>
          <div className="flex items-center gap-4">
            <Checkbox id={name} checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            <label htmlFor={name} className="checkbox-label">
              {props.label}
            </label>
          </div>
        </FormControl>
      )

    case formFieldTypes.radio:
      return (
        <FormControl>
          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-1 flex">
            {children}
          </RadioGroup>
        </FormControl>
      )

    case formFieldTypes.select:
      return (
        <FormControl>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value?.toString() || props.defaultValue}
            value={field.value?.toString()}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="shad-select-content">{children}</SelectContent>
          </Select>
        </FormControl>
      )

    case formFieldTypes.multi_select:
      if (!props.options || props.options.length === 0) return null
      const currentValue: string[] = field.value || []

      return (
        <FormControl>
          <Popover open={props.listOpen} onOpenChange={props.setListOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {currentValue.length > 0
                  ? `${currentValue.length} area${currentValue.length > 1 ? "s" : ""} selected`
                  : "Select service areas..."}
                <Icons.ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search service area..." />
                <CommandList>
                  <CommandEmpty>No service area found.</CommandEmpty>
                  <CommandGroup>
                    {props.options.map((area) => (
                      <CommandItem
                        key={area}
                        onSelect={() => {
                          const updatedValue = currentValue.includes(area)
                            ? currentValue.filter((item: string) => item !== area)
                            : [...currentValue, area]
                          field.onChange(updatedValue)
                        }}
                      >
                        <Icons.Check className={cn("", currentValue.includes(area) ? "opacity-100" : "opacity-0")} />
                        {area}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormControl>
      )

    default:
      return null
  }
}

export default function CustomField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  T extends FormFieldType = FormFieldType,
>(props: CustomFieldProps<TFieldValues, TName, T>) {
  const { control, name, label } = props

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="flex-1">
          <FormLabel className="mb-2 block text-gray-500">{label}</FormLabel>
          <RenderInput field={field} props={props} />
          <FormMessage>{fieldState.error?.message}</FormMessage>
        </FormItem>
      )}
    />
  )
}

export const RenderValue = ({ label, value, className }: { label: string; value: string | number | null; className?: string }) => (
  <div className={cn("border-b pb-2 capitalize", className)}>
    <strong className="text-gray-500">{label}: </strong>
    {value || "N/A"}
  </div>
)
