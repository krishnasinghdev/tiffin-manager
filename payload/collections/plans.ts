import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import type { CollectionConfig } from "payload"

import { slugField } from "@/payload/fields/slug"

import { anyone } from "./access/anyone"
import { authenticated } from "./access/authenticated"

export const Plans: CollectionConfig = {
  slug: "plans",
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
      type: "richText",
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
      }),
    },
    {
      name: "price",
      type: "number",
      required: true,
    },
    {
      name: "show_price",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "images",
      type: "array",
      minRows: 1,
      maxRows: 4,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "vendor_id",
      type: "relationship",
      relationTo: "vendors",
      hasMany: false,
      required: true,
    },
    ...slugField("title"),
  ],
}
