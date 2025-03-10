import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import type { Block } from "payload"

export const LocationGroup: Block = {
  slug: "locationGroup",
  interfaceName: "LocationGroupBlock",
  fields: [
    {
      name: "introContent",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
      }),
      label: "Intro Content",
    },
    {
      name: "locations",
      type: "relationship",
      hasMany: true,
      required: true,
      relationTo: ["locations"],
    },
  ],
}
