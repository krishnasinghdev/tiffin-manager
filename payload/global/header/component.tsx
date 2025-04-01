import React from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import type { Header } from "@/types/payload-types"
import { CMSLink } from "@/payload/components/link"
import { Logo } from "@/payload/components/logo"
import { getCachedGlobal } from "@/payload/payload-queries"

export async function Header() {
  const headerData = (await getCachedGlobal("header", 1)()) as Header

  return (
    <header className="fixed top-0 right-0 left-0 z-50 mx-auto bg-orange-300">
      <div className="container flex justify-between py-4">
        <Link href="/">
          <Logo loading="eager" priority="high" type="secondary" height={40} width={40} />
        </Link>
        <nav className="flex items-center gap-3">
          {headerData.navItems?.map(({ link }, i) => {
            return <CMSLink key={i} {...link} appearance="link" />
          })}
          <Link href="/search">
            <span className="sr-only">Search</span>
            <SearchIcon className="text-primary w-5" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
