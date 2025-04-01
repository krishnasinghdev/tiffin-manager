import type { GlobalConfig } from "payload"

import { link } from "@/payload/fields/link"

import { revalidateHeader } from "./revalidate-hook"

export const Header: GlobalConfig = {
  slug: "header",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "navItems",
      type: "array",
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/payload/global/header/row-label",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
