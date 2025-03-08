"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/payload/components/ui/select"
import canUseDOM from "@/lib/canUseDOM"

import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from "./shared"

export type Theme = "dark" | "light"

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void
  theme?: Theme | null
}

export function themeIsValid(string: null | string): string is Theme {
  return string ? ["dark", "light"].includes(string) : false
}

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute("data-theme") as Theme) : undefined
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey)
      const implicitPreference = getImplicitPreference()
      document.documentElement.setAttribute("data-theme", implicitPreference || "")
      if (implicitPreference) setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute("data-theme", themeToSet)
    }
  }, [])

  useEffect(() => {
    let themeToSet: Theme = defaultTheme
    const preference = window.localStorage.getItem(themeLocalStorageKey)

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      const implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute("data-theme", themeToSet)
    setThemeState(themeToSet)
  }, [])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()
  const [value, setValue] = useState("")

  const onThemeChange = (themeToSet: Theme & "auto") => {
    if (themeToSet === "auto") {
      setTheme(null)
      setValue("auto")
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  React.useEffect(() => {
    const preference = window.localStorage.getItem(themeLocalStorageKey)
    setValue(preference ?? "auto")
  }, [])

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger aria-label="Select a theme" className="w-auto gap-2 border-none bg-transparent pl-0 md:pl-3">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">Auto</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}
