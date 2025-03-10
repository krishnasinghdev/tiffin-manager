import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import type { Block } from "payload"

import { linkGroup } from "@/payload/fields/linkGroup"

export const CallToAction: Block = {
  slug: "cta",
  interfaceName: "CallToActionBlock",
  fields: [
    {
      name: "richText",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature()],
      }),
      label: false,
    },
    linkGroup({
      appearances: ["default", "outline"],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
  labels: {
    plural: "Calls to Action",
    singular: "Call to Action",
  },
}
