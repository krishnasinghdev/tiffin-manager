"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

import Icons from "../lib/icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    avatar?: string
  }
}) {
  const avatar = user.name.charAt(0).toUpperCase() + (user.name.split(" ")[1]?.charAt(0)?.toUpperCase() || "")
  const { setTheme, theme } = useTheme()
  const { isMobile, toggleSidebar } = useSidebar()

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error) {
      console.log(error)
      toast.error("Sign Out failed")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="bg-sidebar-accent hover:cursor-pointer">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg tracking-wide">{avatar}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
              </div>
              <Icons.ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{avatar}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icons.Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link href="/dashboard/account" onClick={isMobile ? toggleSidebar : undefined}>
                <DropdownMenuItem>
                  <Icons.BadgeCheck />
                  Account
                </DropdownMenuItem>
              </Link>

              <Link href="/dashboard/account/notification" onClick={isMobile ? toggleSidebar : undefined}>
                <DropdownMenuItem>
                  <Icons.Bell />
                  Notifications
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark")
                  if (isMobile) toggleSidebar()
                }}
              >
                {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
                Toggle Theme
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut}>
              <Icons.LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
