import React from "react"
import Link from "next/link"
import { NavToolsProps } from "@/types"

import { cn } from "@/lib/utils"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

import { Badge } from "./ui/badge"

export function NavTools({ tools }: { tools: NavToolsProps[] }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Tools</SidebarGroupLabel>
      <SidebarMenu>
        {tools.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild className={cn("flex", item.status !== "active" && "text-sidebar-foreground/70")}>
              <Link href={item.url}>
                {item.icon && React.createElement(item.icon)}
                <span>{item.name}</span>
                {item.status == "soon" && <Badge>soon</Badge>}
                {item.status == "upgrade" && <Badge>upgrade</Badge>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
