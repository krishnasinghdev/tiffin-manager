import type { Header } from "@/types/payload-types"
import { getCachedGlobal } from "@/payload/payload-queries"

import { HeaderClient } from "./Component.client"

export async function Header() {
  const headerData: Header = await getCachedGlobal("header", 1)()

  return <HeaderClient data={headerData} />
}
