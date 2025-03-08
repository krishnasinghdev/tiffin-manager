"use client"

import React from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

import { SidebarTrigger } from "./ui/sidebar"

export default function Header() {
  const pathname = usePathname()
  const [section, subsection] = pathname.split("/").slice(2)
  return (
    <header className="bg-background fixed top-0 z-50 flex h-12 w-full shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="text-primary -ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {section ? (
                <BreadcrumbLink href={`/dashboard/${section}`} className={cn("capitalize", !subsection && "text-foreground")}>
                  {section}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage></BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {subsection && (
              <React.Fragment>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/dashboard/${section}/${subsection}`} className="capitalize">
                    <BreadcrumbPage>{subsection}</BreadcrumbPage>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </React.Fragment>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
