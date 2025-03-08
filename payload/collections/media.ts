import type { CollectionConfig } from "payload"

import { anyone } from "./access/anyone"
import { authenticated } from "./access/authenticated"

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "square",
        width: 500,
        height: 500,
      },
      {
        name: "medium",
        width: 900,
      },
      {
        name: "large",
        width: 1400,
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center",
      },
    ],
  },
}
