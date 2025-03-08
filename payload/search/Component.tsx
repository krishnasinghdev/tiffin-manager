"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Input } from "@/payload/components/ui/input"
import { Label } from "@/payload/components/ui/label"
import { useDebounce } from "@/lib/hooks/useDebounce"

export const Search: React.FC = () => {
  const [value, setValue] = useState("")
  const router = useRouter()

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ""}`)
  }, [debouncedValue, router])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search"
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
