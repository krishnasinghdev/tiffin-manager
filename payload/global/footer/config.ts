import type { GlobalConfig } from "payload"

import { linkGroup } from "@/payload/fields/linkGroup"

import { revalidateFooter } from "./revalidate-hook"

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "navItems",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        linkGroup({
          appearances: false,
          overrides: {
            maxRows: 4,
          },
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/payload/global/footer/row-label",
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
