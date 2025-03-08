import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SessionProvider } from "next-auth/react"

import { auth } from "@/lib/next-auth"
import { DASHBOARD_NAV, MOBILE_NAV_LINKS } from "@/lib/utils"
import {
  MobileSidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import Header from "@/components/header"
import { NavMain } from "@/components/nav-main"
import { NavTools } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) return notFound()

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link href="/dashboard">
              <SidebarMenuButton size="lg" className="bg-muted data-[state=open]:text-sidebar-accent-foreground cursor-pointer">
                <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-white">
                  <Image
                    src="/icons/apple-icon.png"
                    quality={100}
                    alt="tiffin-mangaer-logo"
                    className="rounded"
                    width={64}
                    height={64}
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="line-clamp-1 truncate font-semibold">{session.user.org_name || "Tiffin Manager"}</span>
                  {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <NavMain items={DASHBOARD_NAV.navMain} />
            <NavTools tools={DASHBOARD_NAV.tools} />
            <NavSecondary items={DASHBOARD_NAV.navSecondary} className="mt-auto" />
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              user={{
                name: session.user.name,
              }}
            />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        {/* Page component */}
        <SidebarInset>
          <Header />
          <div className="mt-12 p-4 max-md:mb-16 md:p-6">{children}</div>
        </SidebarInset>
        <nav className="bg-background fixed bottom-0 left-0 z-50 w-full border-t md:hidden">
          <div className="mx-auto grid h-16 max-w-lg grid-cols-5 gap-2">
            {MOBILE_NAV_LINKS.map((item, index) => (
              <Link href={item.url} key={index} className="group flex flex-col items-center justify-center px-4">
                <item.icon className="text-muted-foreground group-hover:text-foreground mb-1 h-6 w-6" />
                <span className="text-muted-foreground group-hover:text-foreground text-xs">{item.label}</span>
              </Link>
            ))}

            <MobileSidebarTrigger />
          </div>
        </nav>
      </SidebarProvider>
    </SessionProvider>
  )
}
