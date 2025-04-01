import type { CollectionConfig } from "payload"

import { slugField } from "@/payload/fields/slug"

import { anyone } from "./access/anyone"
import { authenticated } from "./access/authenticated"

export const Locations: CollectionConfig = {
  slug: "locations",
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    ...slugField("title"),
  ],
}
