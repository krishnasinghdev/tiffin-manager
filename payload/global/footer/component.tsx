import Link from "next/link"

import type { Footer } from "@/types/payload-types"
import { CMSLink } from "@/payload/components/link"
import { Logo } from "@/payload/components/logo"
import { getCachedGlobal } from "@/payload/payload-queries"
import { ThemeSelector } from "@/payload/providers/theme"

export async function Footer() {
  const footerData = (await getCachedGlobal("footer", 1)()) as Footer

  const navItems = footerData?.navItems || []
  return (
    <footer className="border-border dark:bg-card mt-auto border-t bg-orange-300 text-white">
      <div className="container flex flex-col flex-wrap gap-8 py-8 md:justify-between lg:flex-row">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        {navItems.map(({ title, links }, i) => (
          <div key={i}>
            <h3 className="mb-4 text-sm font-semibold tracking-wider uppercase">{title}</h3>
            <ul className="space-y-2">
              {links?.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink className="text-white" key={i} {...link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <ThemeSelector />
      </div>
    </footer>
  )
}
